import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { escapeHtml } from '@/lib/escapeHtml';
import { toast } from 'sonner';

import { 
  FileText, BarChart3, TrendingUp, TrendingDown,
  Package, DollarSign, Calculator, Download, 
  RefreshCw, Search, Filter, 
  AlertCircle, X, 
  Percent, Building, Ban
} from 'lucide-react';

// ─── Mobile Header ───────────────────────────────────────────────────────────
const MobileHeader = ({ onDownloadPDF, onRefreshData, hasData }) => (
  <div className="px-4 py-3">
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold">Profit Report</h1>
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={onRefreshData} className="h-9 w-9">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onDownloadPDF} disabled={!hasData} className="h-9 w-9">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
);

// ─── Mobile Filter Panel ──────────────────────────────────────────────────────
const MobileFilterPanel = ({ 
  showFilters, onToggleFilters,
  fromDate, toDate, onFromDateChange, onToDateChange,
  departmentFilter, onDepartmentFilterChange, departments,
  typeFilter, onTypeFilterChange,
  serviceFilter, onServiceFilterChange, serviceOptions,
  searchTerm, onSearchChange, onClearFilters
}) => (
  <div className="px-4">
    <div className="relative mb-3">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search invoices..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 w-full h-11 text-sm"
      />
    </div>

    <div className="flex items-center justify-between mb-3">
      <Button variant="outline" size="sm" onClick={onToggleFilters} className="flex-1 mr-2 h-9">
        <Filter className="h-4 w-4 mr-2" />
        Filters {showFilters ? '▲' : '▼'}
      </Button>
      <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-red-600 h-9 w-9 p-0">
        <X className="h-4 w-4" />
      </Button>
    </div>

    {showFilters && (
      <Card className="mb-4">
        <CardContent className="p-4 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2">Date Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">From</Label>
                <Input type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2">Department</Label>
            <Select value={departmentFilter} onValueChange={onDepartmentFilterChange}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={String(dept.id)}>{dept.department_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2">Invoice Type</Label>
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="tire">Tire</SelectItem>
                <SelectItem value="other">Service</SelectItem>
                <SelectItem value="tire and other">Tire + Service</SelectItem>
                <SelectItem value="cancel">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {serviceOptions.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2">Service</Label>
              <Select value={serviceFilter} onValueChange={onServiceFilterChange}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Services" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {serviceOptions.map(service => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    )}
  </div>
);

// ─── Mobile Summary Cards ─────────────────────────────────────────────────────
const MobileSummaryCards = ({ profitData }) => {
  if (!profitData) return null;

  const cards = [
    {
      title: 'Revenue',
      value: profitData.summary.total_revenue,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100'
    },
    {
      title: 'Cost',
      value: profitData.summary.total_cost,
      icon: Calculator,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100'
    },
    {
      title: profitData.summary.total_profit >= 0 ? 'Profit' : 'Loss',
      value: Math.abs(profitData.summary.total_profit),
      icon: profitData.summary.total_profit >= 0 ? TrendingUp : TrendingDown,
      color: profitData.summary.total_profit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: profitData.summary.total_profit >= 0 ? 'bg-green-50' : 'bg-red-50',
      borderColor: profitData.summary.total_profit >= 0 ? 'border-green-100' : 'border-red-100'
    },
    {
      title: 'Margin',
      value: profitData.summary.profit_margin,
      icon: Percent,
      color: parseFloat(profitData.summary.profit_margin) > 20 ? 'text-green-600' : 
             parseFloat(profitData.summary.profit_margin) > 10 ? 'text-yellow-600' : 'text-red-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      suffix: '%'
    }
  ];

  return (
    <div className="px-4 mb-4">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((item, index) => (
          <Card key={index} className={`${item.bgColor} ${item.borderColor}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">{item.title}</p>
                  <p className={`text-lg font-bold ${item.color} mt-1`}>
                    {item.title === 'Margin' ? item.value : `LKR ${item.value?.toLocaleString()}`}{item.suffix || ''}
                  </p>
                </div>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cancelled invoices warning */}
      {profitData.summary.cancelled_count > 0 && (
        <Card className="mt-3 bg-orange-50 border-orange-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs font-semibold text-orange-700">
                  {profitData.summary.cancelled_count} Cancelled Invoice{profitData.summary.cancelled_count > 1 ? 's' : ''} in Period
                </p>
                <p className="text-xs text-orange-600">
                  Cancelled invoices show LKR 0 revenue & profit (shown in red)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─── Invoice List Item ────────────────────────────────────────────────────────
const InvoiceListItem = ({ invoice, getTypeBadge, calculateInvoiceProfit, getDepartmentName }) => {
  const isCancelled = invoice.type === 'cancel';
  const profitData = isCancelled
    ? { revenue: 0, cost: 0, profit: 0, margin: 0 }
    : calculateInvoiceProfit(invoice);

  return (
    <Card className={`p-3 mb-2 ${isCancelled ? 'bg-red-50 border-red-200 opacity-80' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{invoice.inv_no}</span>
            {isCancelled && <Ban className="h-3 w-3 text-red-500" />}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(invoice.inv_date).toLocaleDateString()} • {getDepartmentName(invoice.department_id)}
          </div>
        </div>
        <div className="text-sm font-semibold text-red-600">
          {isCancelled ? 'CANCELLED' : (
            profitData.profit >= 0
              ? `+LKR ${Math.abs(profitData.profit).toFixed(0)}`
              : `-LKR ${Math.abs(profitData.profit).toFixed(0)}`
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        {getTypeBadge(invoice.type)}
        <Badge variant="outline" className="text-xs">
          {invoice.customer?.customer_name || 'Cash Sale'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Revenue:</span>
          <span className={`ml-1 font-medium ${isCancelled ? 'text-red-500' : ''}`}>
            LKR {profitData.revenue.toFixed(0)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Cost:</span>
          <span className={`ml-1 font-medium ${isCancelled ? 'text-red-500' : ''}`}>
            LKR {profitData.cost.toFixed(0)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Margin:</span>
          <span className="ml-1 font-medium text-red-500">{profitData.margin}%</span>
        </div>
        <div>
          <span className="text-gray-500">Status:</span>
          <Badge
            variant={isCancelled ? 'destructive' : (invoice.payment_status === 'cash' ? 'default' : 'outline')}
            className="ml-1 text-xs"
          >
            {isCancelled ? 'Cancelled' : invoice.payment_status}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

// ─── Service List Item ────────────────────────────────────────────────────────
const ServiceListItem = ({ service }) => (
  <Card className="p-3 mb-2">
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1">
        <div className="font-semibold text-sm truncate">{service.service_name}</div>
        <div className="text-xs text-gray-500">
          Unit: LKR {service.service_price.toFixed(0)} • Cost: LKR {service.service_cost.toFixed(0)}
        </div>
      </div>
      <div className={`text-sm font-semibold ${service.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        LKR {service.profit.toFixed(0)}
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div className="text-center">
        <div className="text-gray-500">Qty</div>
        <div className="font-medium">{service.quantity || 1}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-500">Revenue</div>
        <div className="font-medium">LKR {service.revenue.toFixed(0)}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-500">Margin</div>
        <div className={`font-medium ${service.margin >= 20 ? 'text-green-600' : service.margin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
          {service.margin}%
        </div>
      </div>
    </div>
  </Card>
);

// ─── Department List Item ─────────────────────────────────────────────────────
const DepartmentListItem = ({ dept, invoices, calculateInvoiceProfit }) => {
  const deptInvoices = invoices.filter(inv => String(inv.department_id) === String(dept.id));
  if (deptInvoices.length === 0) return null;

  const totalProfit = deptInvoices.reduce((sum, inv) => {
    if (inv.type === 'cancel') return sum;
    return sum + calculateInvoiceProfit(inv).profit;
  }, 0);

  const totalRevenue = deptInvoices.reduce((sum, inv) => {
    if (inv.type === 'cancel') return sum;
    return sum + calculateInvoiceProfit(inv).revenue;
  }, 0);

  const cancelledCount = deptInvoices.filter(inv => inv.type === 'cancel').length;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <Card className="p-3 mb-2">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold text-sm">{dept.department_name}</div>
          <div className="text-xs text-gray-500">
            {deptInvoices.length} invoices
            {cancelledCount > 0 && <span className="text-red-500 ml-1">({cancelledCount} cancelled)</span>}
          </div>
        </div>
        <div className={`text-sm font-semibold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {totalProfit >= 0 ? '+' : ''}LKR {Math.abs(totalProfit).toFixed(0)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Revenue:</span>
          <span className="ml-1 font-medium">LKR {totalRevenue.toFixed(0)}</span>
        </div>
        <div>
          <span className="text-gray-500">Margin:</span>
          <span className={`ml-1 font-medium ${margin >= 20 ? 'text-green-600' : margin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
            {margin.toFixed(1)}%
          </span>
        </div>
      </div>
    </Card>
  );
};

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────
const MobileBottomNav = ({ activeTab, setActiveTab }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around items-center shadow-lg z-40">
    {[
      { id: 'summary', icon: BarChart3, label: 'Summary' },
      { id: 'services', icon: Package, label: 'Services' },
      { id: 'invoices', icon: FileText, label: 'Invoices' },
      { id: 'departments', icon: Building, label: 'Depts' },
    ].map(({ id, icon: Icon, label }) => (
      <button
        key={id}
        onClick={() => setActiveTab(id)}
        className={`flex flex-col items-center p-2 rounded-lg ${activeTab === id ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
      >
        <Icon className="h-5 w-5" />
        <span className="text-xs mt-1">{label}</span>
      </button>
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MobileProfitReport() {
  const [invoices, setInvoices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [grnItems, setGrnItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invoicesRes, deptRes, servicesRes, grnRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/departments'),
        api.get('/services'),
        api.get('/grns'),
      ]);
      setInvoices(invoicesRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      setServices(servicesRes.data.data || []);

      const grns = grnRes.data.data || [];
      const flatItems = [];
      grns.forEach(grn => {
        (grn.items || []).forEach(item => {
          flatItems.push({ ...item, grn_date: grn.grn_date });
        });
      });
      setGrnItems(flatItems);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  }, []);

  const getDepartmentName = useCallback((departmentId) => {
    const department = departments.find(dept => dept.id === parseInt(departmentId) || dept.id === departmentId);
    return department ? department.department_name : 'Unknown Department';
  }, [departments]);

  const getUniqueServices = useCallback(() => {
    const serviceNames = new Set();
    invoices.forEach(invoice => {
      if (invoice.service) {
        invoice.service.split(',').map(s => s.trim()).forEach(s => {
          if (s && s !== 'Tire Service') serviceNames.add(s);
        });
      }
    });
    return Array.from(serviceNames).sort();
  }, [invoices]);

  const findServiceByName = useCallback((serviceName) => {
    if (!serviceName) return null;
    const cleanedName = serviceName.trim().toLowerCase();
    let service = services.find(s => s.name.trim().toLowerCase() === cleanedName);
    if (!service) {
      service = services.find(s =>
        s.name.toLowerCase().includes(cleanedName) ||
        cleanedName.includes(s.name.toLowerCase())
      );
    }
    if (service) {
      return { id: service.id, name: service.name, price: parseFloat(service.price) || 0, cost: parseFloat(service.cost) || 0 };
    }
    return null;
  }, [services]);

  const latestGrnMap = useMemo(() => {
    const map = new Map();
    grnItems.forEach(item => {
      const existing = map.get(item.product_code);
      const itemDate = new Date(item.grn_date || item.date || 0);
      const existingDate = existing ? new Date(existing.grn_date || existing.date || 0) : null;
      if (!existing || itemDate > existingDate) map.set(item.product_code, item);
    });
    return map;
  }, [grnItems]);

  const extractServicesFromInvoice = useCallback((invoice) => {
    const servicesMap = new Map();
    invoice.items?.forEach(item => {
      if (item.type === 'product' && item.grn_code === 'SERVICE' && item.product_name) {
        const serviceName = item.product_name.trim();
        const serviceData = findServiceByName(serviceName);
        if (serviceData) {
          const itemRevenue = (parseFloat(item.selling_price) || 0) * (parseFloat(item.qty) || 1);
          const itemDiscount = (parseFloat(item.discount) || 0) * (parseFloat(item.qty) || 1);
          const netRevenue = itemRevenue - itemDiscount;
          if (!servicesMap.has(serviceName)) {
            servicesMap.set(serviceName, { serviceData, revenue: 0, cost: 0, quantity: 0 });
          }
          const service = servicesMap.get(serviceName);
          service.revenue += netRevenue;
          service.cost += serviceData.cost * (parseFloat(item.qty) || 1);
          service.quantity += parseFloat(item.qty) || 1;
        }
      }
    });
    return Array.from(servicesMap.values());
  }, [findServiceByName]);

  // ── calculateInvoiceProfit: returns zeros for cancelled invoices ──────────
  const calculateInvoiceProfit = useCallback((invoice) => {
    // CANCELLED invoices → always show zero revenue/cost/profit in red
    if (invoice.type === 'cancel') {
      return { revenue: 0, cost: 0, profit: 0, margin: 0, service: invoice.service, type: 'cancel', serviceRevenue: 0, serviceCost: 0, invoiceServices: [], isCancelled: true };
    }

    const totalRevenue = parseFloat(invoice.net_total) || 0;
    let totalCost = 0;

    invoice.items?.forEach(item => {
      if (item.type === 'service' || item.grn_code === 'SERVICE') return;
      const qty = parseFloat(item.qty) || 1;
      const latestGrn = latestGrnMap.get(item.product_code);
      const actualCost = latestGrn
        ? parseFloat(latestGrn.actual_cost) || parseFloat(item.actual_cost) || 0
        : parseFloat(item.actual_cost) || 0;
      totalCost += actualCost * qty;
    });

    const invoiceServices = extractServicesFromInvoice(invoice);
    const serviceRevenue = invoiceServices.reduce((s, x) => s + x.revenue, 0);
    const serviceCost = invoiceServices.reduce((s, x) => s + x.cost, 0);
    totalCost += serviceCost;

    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return { revenue: totalRevenue, cost: totalCost, profit, margin: parseFloat(margin.toFixed(2)), service: invoice.service, type: invoice.type, serviceRevenue, serviceCost, invoiceServices, isCancelled: false };
  }, [extractServicesFromInvoice, latestGrnMap]);

  // ── Filtered invoices ─────────────────────────────────────────────────────
  const getFilteredInvoices = useMemo(() => {
    let filtered = invoices;

    if (fromDate && toDate) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.inv_date);
        const from = new Date(fromDate); from.setHours(0, 0, 0, 0);
        const to = new Date(toDate); to.setHours(23, 59, 59, 999);
        return invoiceDate >= from && invoiceDate <= to;
      });
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(invoice => String(invoice.department_id) === String(departmentFilter));
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.type === typeFilter);
    }

    if (serviceFilter !== 'all') {
      filtered = filtered.filter(invoice => {
        if (!invoice.service) return false;
        return invoice.service.split(',').map(s => s.trim().toLowerCase()).includes(serviceFilter.toLowerCase());
      });
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(invoice =>
        invoice.inv_no?.toLowerCase().includes(searchLower) ||
        invoice.customer?.customer_name?.toLowerCase().includes(searchLower) ||
        invoice.items?.some(item => item.product_name?.toLowerCase().includes(searchLower)) ||
        getDepartmentName(invoice.department_id).toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [invoices, fromDate, toDate, departmentFilter, typeFilter, serviceFilter, searchTerm, getDepartmentName]);

  // ── Profit data ───────────────────────────────────────────────────────────
  const calculateProfitData = useMemo(() => {
    const filteredInvoices = getFilteredInvoices;
    if (filteredInvoices.length === 0) return null;

    let totalRevenue = 0, totalCost = 0, totalProfit = 0;
    let serviceRevenue = 0, serviceCost = 0;
    let cancelledCount = 0;

    filteredInvoices.forEach(invoice => {
      const profitData = calculateInvoiceProfit(invoice);
      if (invoice.type === 'cancel') {
        cancelledCount++;
        // do NOT add to totals — cancelled = zero contribution
        return;
      }
      totalRevenue += profitData.revenue;
      totalCost += profitData.cost;
      totalProfit += profitData.profit;
      serviceRevenue += profitData.serviceRevenue;
      serviceCost += profitData.serviceCost;
    });

    const serviceProfit = serviceRevenue - serviceCost;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0;
    const serviceMargin = serviceRevenue > 0 ? ((serviceProfit / serviceRevenue) * 100).toFixed(2) : 0;

    // Service breakdown (skip cancelled)
    const serviceMap = new Map();
    filteredInvoices.forEach(invoice => {
      if (invoice.type === 'cancel') return;
      const profitData = calculateInvoiceProfit(invoice);
      profitData.invoiceServices.forEach(serviceItem => {
        const serviceName = serviceItem.serviceData.name;
        if (!serviceMap.has(serviceName)) {
          serviceMap.set(serviceName, {
            service_name: serviceName,
            service_id: serviceItem.serviceData.id,
            service_price: serviceItem.serviceData.price,
            service_cost: serviceItem.serviceData.cost,
            revenue: 0, cost: 0, profit: 0, invoice_count: 0, quantity: 0
          });
        }
        const service = serviceMap.get(serviceName);
        service.revenue += serviceItem.revenue;
        service.cost += serviceItem.cost;
        service.profit += (serviceItem.revenue - serviceItem.cost);
        service.invoice_count += 1;
        service.quantity += serviceItem.quantity;
      });
    });

    const profitByService = Array.from(serviceMap.values()).map(service => ({
      ...service,
      margin: service.revenue > 0 ? ((service.profit / service.revenue) * 100).toFixed(2) : 0
    })).sort((a, b) => b.profit - a.profit);

    return {
      summary: {
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_profit: totalProfit,
        profit_margin: profitMargin,
        service_revenue: serviceRevenue,
        service_cost: serviceCost,
        service_profit: serviceProfit,
        service_margin: serviceMargin,
        total_invoices: filteredInvoices.length,
        cancelled_count: cancelledCount,
      },
      profit_by_service: profitByService,
      invoices: filteredInvoices,
    };
  }, [getFilteredInvoices, calculateInvoiceProfit]);

  // ── Type badge ─────────────────────────────────────────────────────────────
  const getTypeBadge = useCallback((type) => {
    if (type === 'cancel') {
      return <Badge variant="destructive" className="text-xs px-2 py-0.5 flex items-center gap-1"><Ban className="h-3 w-3" />Cancelled</Badge>;
    }
    const variants = { 'tire': 'default', 'other': 'secondary', 'tire and other': 'destructive' };
    const typeText = { 'tire': 'Tire', 'other': 'Service', 'tire and other': 'Tire+Service' };
    return <Badge variant={variants[type] || 'outline'} className="text-xs px-2 py-0.5">{typeText[type] || type || 'N/A'}</Badge>;
  }, []);

  // ── PDF / Print ───────────────────────────────────────────────────────────
  const generateProfitPDF = useCallback(() => {
    const profitData = calculateProfitData;
    if (!profitData) { toast.error('No data available'); return; }

    const printContent = `
      <html><head><title>Profit Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 16px; }
        h1 { font-size: 24px; } h2 { font-size: 18px; margin: 16px 0 8px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 14px; }
        th { background-color: #f4f4f4; }
        .positive { color: green; } .negative { color: red; }
        .summary { background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 12px 0; }
        .summary-item { display: flex; justify-content: space-between; margin: 6px 0; }
        .cancelled-row { background: #fff0f0; color: #cc0000; }
      </style></head>
      <body>
        <h1>Profit Report</h1>
        <p>Period: ${escapeHtml(fromDate)} to ${escapeHtml(toDate)}</p>
        ${profitData.summary.cancelled_count > 0 ? `<p style="color:orange;"><strong>Note:</strong> ${profitData.summary.cancelled_count} cancelled invoice(s) excluded from totals.</p>` : ''}
        <div class="summary">
          <h2>Summary</h2>
          <div class="summary-item"><span>Total Revenue:</span><span>LKR ${profitData.summary.total_revenue.toFixed(2)}</span></div>
          <div class="summary-item"><span>Total Cost:</span><span>LKR ${profitData.summary.total_cost.toFixed(2)}</span></div>
          <div class="summary-item"><span>Net Profit:</span>
            <span class="${profitData.summary.total_profit >= 0 ? 'positive' : 'negative'}">
              LKR ${profitData.summary.total_profit.toFixed(2)} (${profitData.summary.profit_margin}%)
            </span>
          </div>
          <div class="summary-item"><span>Cancelled Invoices:</span><span style="color:red;">${profitData.summary.cancelled_count}</span></div>
        </div>
        <h2>Services</h2>
        <table>
          <tr><th>Service</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Margin</th></tr>
          ${profitData.profit_by_service.map(service => `
            <tr>
              <td>${escapeHtml(service.service_name)}</td>
              <td>LKR ${service.revenue.toFixed(2)}</td>
              <td>LKR ${service.cost.toFixed(2)}</td>
              <td class="${service.profit >= 0 ? 'positive' : 'negative'}">LKR ${service.profit.toFixed(2)}</td>
              <td>${service.margin}%</td>
            </tr>
          `).join('')}
        </table>
        <h2>All Invoices</h2>
        <table>
          <tr><th>Invoice</th><th>Date</th><th>Type</th><th>Revenue</th><th>Profit</th></tr>
          ${profitData.invoices.map(inv => {
            const isCancelled = inv.type === 'cancel';
            const pd = isCancelled ? { revenue: 0, profit: 0 } : calculateInvoiceProfit(inv);
            return `
              <tr class="${isCancelled ? 'cancelled-row' : ''}">
                <td>${escapeHtml(inv.inv_no)}${isCancelled ? ' [CANCELLED]' : ''}</td>
                <td>${new Date(inv.inv_date).toLocaleDateString()}</td>
                <td>${escapeHtml(inv.type)}</td>
                <td>LKR ${pd.revenue.toFixed(2)}</td>
                <td class="${pd.profit >= 0 ? 'positive' : 'negative'}">LKR ${pd.profit.toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
        </table>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">Generated: ${new Date().toLocaleString()}</p>
      </body></html>
    `;

    // This window is opened blank and then written into, so it deliberately
    // does NOT pass "noopener": that would make window.open() return null and
    // there would be nothing to write to. Reverse tabnabbing is not a risk here
    // because no third-party document is ever loaded - only markup this
    // application built, with every interpolation escaped (V-13).
    //
    // The external links in DiscountRequests.jsx DO navigate to another origin
    // and do pass "noopener,noreferrer".
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    // The original code dereferenced this immediately. With popups blocked -
    // the default in several browsers - window.open returns null and the whole
    // report export died with an unhandled TypeError.
    if (!printWindow) {
      toast.error('Popup blocked. Allow popups to print the report.');

      return;
    }

    // V-13: safe by construction - every value interpolated into this
    // template is escaped with escapeHtml() from @/lib/escapeHtml. The lint
    // rule stays enabled so a NEW unescaped sink cannot be added silently.
    // eslint-disable-next-line no-restricted-syntax
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }, [calculateProfitData, fromDate, toDate, calculateInvoiceProfit]);

  const clearFilters = useCallback(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    setFromDate(date.toISOString().split('T')[0]);
    setToDate(new Date().toISOString().split('T')[0]);
    setDepartmentFilter('all');
    setTypeFilter('all');
    setServiceFilter('all');
    setSearchTerm('');
    setShowFilters(false);
    toast.success('Filters cleared');
  }, []);

  const profitData = calculateProfitData;
  const filteredInvoices = getFilteredInvoices;
  const invoiceServices = getUniqueServices();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600 font-medium">Loading profit data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader onDownloadPDF={generateProfitPDF} onRefreshData={fetchData} hasData={!!profitData} />

      <MobileFilterPanel
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        fromDate={fromDate} toDate={toDate}
        onFromDateChange={setFromDate} onToDateChange={setToDate}
        departmentFilter={departmentFilter} onDepartmentFilterChange={setDepartmentFilter}
        departments={departments}
        typeFilter={typeFilter} onTypeFilterChange={setTypeFilter}
        serviceFilter={serviceFilter} onServiceFilterChange={setServiceFilter}
        serviceOptions={invoiceServices}
        searchTerm={searchTerm} onSearchChange={setSearchTerm}
        onClearFilters={clearFilters}
      />

      {profitData ? (
        <>
          <MobileSummaryCards profitData={profitData} />
          <div className="px-4 mb-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Total Invoices</div>
                    <div className="text-2xl font-bold text-blue-600">{profitData.summary.total_invoices}</div>
                    {profitData.summary.cancelled_count > 0 && (
                      <div className="text-xs text-red-500">{profitData.summary.cancelled_count} cancelled</div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Service Margin</div>
                    <div className={`text-2xl font-bold ${parseFloat(profitData.summary.service_margin) > 20 ? 'text-green-600' : parseFloat(profitData.summary.service_margin) > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {profitData.summary.service_margin}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="px-4">
          <Card className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Data Available</h3>
              <p className="text-gray-500">Try adjusting your filters or select a different date range</p>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs content */}
      <div className="px-4">
        {/* Summary Tab */}
        <div className={activeTab === 'summary' ? 'block' : 'hidden'}>
          {profitData && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="p-4"><CardTitle className="text-base">Invoice Type Breakdown</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    {['tire', 'other', 'tire and other', 'cancel'].map(type => {
                      const typeInvoices = filteredInvoices.filter(inv => inv.type === type);
                      if (typeInvoices.length === 0) return null;

                      const isCancelType = type === 'cancel';
                      const total = isCancelType ? 0 : typeInvoices.reduce((sum, inv) => sum + calculateInvoiceProfit(inv).profit, 0);
                      const revenue = isCancelType ? 0 : typeInvoices.reduce((sum, inv) => sum + calculateInvoiceProfit(inv).revenue, 0);
                      const margin = revenue > 0 ? (total / revenue) * 100 : 0;

                      return (
                        <div key={type} className={`flex justify-between items-center p-3 rounded-lg ${isCancelType ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {isCancelType && <Ban className="h-3 w-3 text-red-500" />}
                              {type === 'tire' ? 'Tire' : type === 'tire and other' ? 'Tire + Service' : type === 'cancel' ? 'Cancelled' : 'Service'}
                            </div>
                            <div className="text-xs text-gray-500">{typeInvoices.length} invoices</div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${isCancelType ? 'text-red-500' : total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {isCancelType ? 'LKR 0 (cancelled)' : `LKR ${Math.abs(total).toFixed(0)}`}
                            </div>
                            <div className="text-xs text-gray-500">{isCancelType ? '—' : `${margin.toFixed(1)}% margin`}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {profitData.profit_by_service?.length > 0 && (
                <Card>
                  <CardHeader className="p-4"><CardTitle className="text-base">Top Services</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      {profitData.profit_by_service.slice(0, 5).map((service, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium truncate">{service.service_name}</div>
                            <div className="text-xs text-gray-500">{service.invoice_count} invoices • {service.quantity} units</div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${service.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              LKR {service.profit.toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-500">{service.margin}% margin</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Services Tab */}
        <div className={activeTab === 'services' ? 'block' : 'hidden'}>
          {profitData?.profit_by_service?.length > 0 ? (
            <div>
              <div className="text-sm text-gray-500 mb-3">{profitData.profit_by_service.length} services found</div>
              {profitData.profit_by_service.map((service, index) => (
                <ServiceListItem key={index} service={service} />
              ))}
            </div>
          ) : (
            <Card className="p-6">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Services Found</h3>
              </div>
            </Card>
          )}
        </div>

        {/* Invoices Tab */}
        <div className={activeTab === 'invoices' ? 'block' : 'hidden'}>
          {filteredInvoices.length > 0 ? (
            <div>
              <div className="text-sm text-gray-500 mb-3">
                {filteredInvoices.length} invoices found
                {filteredInvoices.filter(i => i.type === 'cancel').length > 0 && (
                  <span className="text-red-500 ml-2">
                    ({filteredInvoices.filter(i => i.type === 'cancel').length} cancelled — shown in red)
                  </span>
                )}
              </div>
              {filteredInvoices.map((invoice) => (
                <InvoiceListItem
                  key={invoice.id}
                  invoice={invoice}
                  getTypeBadge={getTypeBadge}
                  calculateInvoiceProfit={calculateInvoiceProfit}
                  getDepartmentName={getDepartmentName}
                />
              ))}
            </div>
          ) : (
            <Card className="p-6">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Invoices Found</h3>
              </div>
            </Card>
          )}
        </div>

        {/* Departments Tab */}
        <div className={activeTab === 'departments' ? 'block' : 'hidden'}>
          {departments.length > 0 ? (
            <div>
              <div className="text-sm text-gray-500 mb-3">{departments.length} departments</div>
              {departments.map((dept) => (
                <DepartmentListItem
                  key={dept.id}
                  dept={dept}
                  invoices={filteredInvoices}
                  calculateInvoiceProfit={calculateInvoiceProfit}
                />
              ))}
            </div>
          ) : (
            <Card className="p-6">
              <div className="text-center">
                <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Departments</h3>
              </div>
            </Card>
          )}
        </div>
      </div>

      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}