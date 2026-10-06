import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { CreditTabs } from "./CreditTabs";
import { useState } from "react";

export function CustomerViewDialog({
  isOpen,
  onOpenChange,
  customer,
  creditInvoices,
  creditPaymentHistory,
  onEdit,
  onRefreshInvoices,
  onRefreshHistory,
  onPayCredit,
  onAdjustCredit,
  isLoading = false
}) {
  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
     <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto border-blue-300 shadow-xl mx-4 sm:mx-0">

        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-blue-700">
            Customer Details - {customer.customer_name}
          </DialogTitle>
          <DialogDescription>
            Full profile overview and credit management
          </DialogDescription>
        </DialogHeader>

        {/* Customer Info Summary */}
        <CustomerInfoSummary customer={customer} />

        {/* Credit Tabs */}
        <CreditTabs
          selectedCustomer={customer}
          creditInvoices={creditInvoices}
          creditPaymentHistory={creditPaymentHistory}
          onRefreshInvoices={onRefreshInvoices}
          onRefreshHistory={onRefreshHistory}
          onPayCredit={onPayCredit}
          onAdjustCredit={onAdjustCredit}
          isLoading={isLoading}
        />

        {/* Action Buttons */}
        <DialogActions
          onEdit={() => onEdit(customer)}
          onClose={() => onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}

function CustomerInfoSummary({ customer }) {
  return (
    <Card className="mb-4">
      <CardContent className="p-4 sm:p-6">
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <InfoItem
            label="Customer Code"
            value={customer.customer_code}
            icon="id"
            color="blue"
          />
          
          {/* NIC Number */}
          <InfoItem
            label="NIC Number"
            value={customer.nic_no || "-"}
            icon="id"
            color="gray"
          />
          
          {/* Primary Phone */}
          <InfoItem
            label="Primary Phone"
            value={customer.phone_no_01}
            icon="phone"
            color="green"
          />
          
          {/* Secondary Phone */}
          <InfoItem
            label="Secondary Phone"
            value={customer.phone_no_02 || "-"}
            icon="phone"
            color="gray"
          />
        </div>

        {/* Address */}
        {customer.address && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPinIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-700">Address</div>
                <div className="text-gray-600 text-sm mt-1">{customer.address}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value, icon, color }) {
  const [expanded, setExpanded] = useState(false);

  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    gray: "bg-gray-100 text-gray-600",
    purple: "bg-purple-100 text-purple-600",
  };

  const IconComponent = {
    id: IdCardIcon,
    phone: PhoneIcon,
    user: UserIcon,
    map: MapPinIcon,
  }[icon] || UserIcon;

  return (
    <div
      className="flex items-center gap-3 cursor-pointer w-full"
      onClick={() => setExpanded(!expanded)}
    >
      <div
        className={`w-10 h-10 rounded-full ${colorClasses[color]} flex items-center justify-center`}
      >
        <IconComponent className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-500">{label}</div>

        {/* If expanded show full text, else show truncated */}
        <div className={`font-semibold ${expanded ? "" : "truncate"}`}>
          {value}
        </div>

        {/* Small hint */}
        <div className="text-xs text-blue-600 mt-1">
          {expanded ? "Click to hide" : "Click to view full"}
        </div>
      </div>
    </div>
  );
}

function DialogActions({ onEdit, onClose, isLoading }) {
  return (
    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
      <Button
        variant="outline"
        onClick={onEdit}
        size="sm"
        className="text-sm"
        disabled={isLoading}
      >
        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
        Edit Customer
      </Button>
      <Button
        className="bg-blue-600 text-white hover:bg-blue-700 text-sm"
        onClick={onClose}
        size="sm"
        disabled={isLoading}
      >
        Close
      </Button>
    </div>
  );
}

// Icon Components (you can import from lucide-react if available)
function IdCardIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 18v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <rect x="16" y="2" width="6" height="20" rx="2" />
    </svg>
  );
}

function PhoneIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function UserIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MapPinIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}