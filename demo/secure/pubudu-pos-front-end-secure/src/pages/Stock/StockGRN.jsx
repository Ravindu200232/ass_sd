import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { TableHead as TableHeadCell, TableCell } from "@/components/ui/table";

// Import Components
import { PageHeader } from "../../components/StockGRN/PageHeader";
import { FilterSection } from "../../components/StockGRN/FilterSection";
import { GRNTableRow } from "../../components/StockGRN/GRNTableRow";
import { GRNDetailsModal } from "../../components/StockGRN/GRNDetailsModal";

export default function StockGRN() {
  const navigate = useNavigate();
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [selectedGRN, setSelectedGRN] = useState(null);

  useEffect(() => {
    fetchGRNs();
  }, []);

  const fetchGRNs = async () => {
    try {
      const res = await api.get("/grns");
      setGrns(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load GRNs");
    } finally {
      setLoading(false);
    }
  };

  const filtered = grns.filter((g) => {
    if (!parseFloat(g.total_cost)) return false;
    const s = search.toLowerCase();
    return (
      (g.grn_code?.toLowerCase().includes(s) ||
        g.created_by?.full_name?.toLowerCase().includes(s) ||
        g.department?.department_name?.toLowerCase().includes(s)) &&
      (dateFilter ? g.grn_date?.startsWith(dateFilter) : true) &&
      (departmentFilter
        ? g.department?.department_name
            ?.toLowerCase()
            .includes(departmentFilter.toLowerCase())
        : true)
    );
  });

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      {/* PAGE HEADER */}
      <PageHeader navigate={navigate} />

      {/* FILTERS */}
      <Card className="max-w-7xl mx-auto mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterSection 
            search={search}
            setSearch={setSearch}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
          />
        </CardContent>
      </Card>

      {/* GRN TABLE */}
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle>All GRNs ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200">
                <TableHead>GRN Code</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Total Selling</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-center">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4">
                    Loading GRNs...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                    No GRNs found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((grn) => (
                  <GRNTableRow 
                    key={grn.id} 
                    grn={grn} 
                    onView={setSelectedGRN}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* GRN DETAILS MODAL */}
      <GRNDetailsModal 
        selectedGRN={selectedGRN}
        onClose={() => setSelectedGRN(null)}
      />
    </div>
  );
}