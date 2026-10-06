// StockDataUtils.js
import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';

export const useStockData = (selectedDepartment = null, isAdmin = false) => {
  const [grns, setGrns] = useState([]);
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [grnRes, prodRes, deptRes] = await Promise.all([
        api.get('/grns'),
        api.get('/products'),
        api.get('/departments'),
      ]);

      setGrns(grnRes.data.data || []);
      setProducts(prodRes.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load stock data");
      toast.error("Failed to load stock");
    }
    setLoading(false);
  }, []);

  // Filter GRNs by selected department
  const filteredGrns = useMemo(() => {
    if (!selectedDepartment) return grns;
    return grns.filter(grn => grn.department_id == selectedDepartment);
  }, [grns, selectedDepartment]);

  // Calculate department statistics
  const departmentStats = useMemo(() => {
    const stats = {};
    
    grns.forEach(grn => {
      const deptId = grn.department_id;
      if (!stats[deptId]) {
        stats[deptId] = {
          department_id: deptId,
          department_name: grn.department?.department_name || 'Unknown',
          total_grns: 0,
          total_items: 0,
          total_qty: 0,
          total_value: 0,
          latest_grn_date: null
        };
      }
      
      stats[deptId].total_grns += 1;
      const liveItems = (grn.items || []).filter(
        item => item.status === 'on' && (isAdmin || Number(item.qty || 0) > 0)
      );

      stats[deptId].total_items += liveItems.length;
      stats[deptId].total_qty += liveItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
      stats[deptId].total_value += liveItems.reduce((sum, item) => {
        return sum + ((Number(item.actual_cost) || 0) * (Number(item.qty) || 0));
      }, 0);
      
      const grnDate = new Date(grn.grn_date);
      if (!stats[deptId].latest_grn_date || grnDate > new Date(stats[deptId].latest_grn_date)) {
        stats[deptId].latest_grn_date = grn.grn_date;
      }
    });
    
    return Object.values(stats);
  }, [grns, isAdmin]);

  const groupedStock = useMemo(() => {
    const map = {};

    filteredGrns.forEach(grn => {
      grn.items.forEach(item => {
        if (item.status !== 'on' || (!isAdmin && Number(item.qty || 0) <= 0)) {
          return;
        }

        if (!map[item.product_code]) {
          map[item.product_code] = {
            product_code: item.product_code,
            product_name: item.product_name,
            total_qty: 0,
            prices: [],
            batches: [],
            main_branch_prices: [],
            actual_costs: [],
            department_id: grn.department_id,
            department_name: grn.department?.department_name || 'Unknown',
            grn_details: [],
            discounts: { d1: [], d2: [], d3: [], d4: [] }
          };
        }

        map[item.product_code].total_qty += Number(item.qty) || 0;
        map[item.product_code].prices.push(Number(item.selling_price) || 0);
        map[item.product_code].main_branch_prices.push(Number(item.main_branch_price) || 0);
        map[item.product_code].actual_costs.push(Number(item.actual_cost) || 0);

        // Collect discounts
        map[item.product_code].discounts.d1.push(Number(item.discount1) || 0);
        map[item.product_code].discounts.d2.push(Number(item.discount2) || 0);
        map[item.product_code].discounts.d3.push(Number(item.discount3) || 0);
        map[item.product_code].discounts.d4.push(Number(item.discount4) || 0);

        map[item.product_code].grn_details.push({
          grn_code: grn.grn_code,
          grn_date: grn.grn_date,
          department_id: grn.department_id,
          department_name: grn.department?.department_name || 'Unknown',
        });

        map[item.product_code].batches.push({
          grn_code: item.grn_code,
          department_id: grn.department_id,
          department_name: grn.department?.department_name || 'Unknown',
          date: item.date,
          qty: item.qty,
          selling_price: item.selling_price,
          stock_price: item.stock_price,
          main_branch_price: item.main_branch_price,
          actual_cost: item.actual_cost,
          discount1: item.discount1,
          discount2: item.discount2,
          discount3: item.discount3,
          discount4: item.discount4,
          subtotal: item.subtotal,
        });
      });
    });

    return Object.values(map);
  }, [filteredGrns, isAdmin]);

  const enhancedStock = useMemo(() => {
    return groupedStock.map(s => {
      const p = products.find(x => x.product_code === s.product_code);
      return {
        ...s,
        brand_name: p?.brand_name || "NO BRAND",
        category: p?.category || "",
      };
    });
  }, [groupedStock, products]);

  return {
    grns,
    filteredGrns,
    products,
    departments,
    departmentStats,
    loading,
    error,
    loadData,
    groupedStock,
    enhancedStock
  };
};
