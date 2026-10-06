import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Receipt, History } from "lucide-react";
import { CreditOverviewTab } from "./CreditOverviewTab";
import { CreditInvoicesTab } from "./CreditInvoicesTab";
import { PaymentHistoryTab } from "./PaymentHistoryTab";

export function CreditTabs({
  selectedCustomer,
  creditInvoices,
  creditPaymentHistory,
  onRefreshInvoices,
  onRefreshHistory,
  onPayCredit,
  onAdjustCredit,
  isLoading = false
}) {
  return (
    <Tabs defaultValue="credit" className="w-full">
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0">
        <TabsTrigger value="credit" className="text-xs sm:text-sm py-2">
          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Credit</span>
          <span className="xs:hidden">Credit</span>
        </TabsTrigger>
        <TabsTrigger value="invoices" className="text-xs sm:text-sm py-2">
          <Receipt className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Invoices</span>
          <span className="xs:hidden">Invoices</span>
        </TabsTrigger>
        <TabsTrigger value="history" className="text-xs sm:text-sm py-2">
          <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">History</span>
          <span className="xs:hidden">History</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="credit">
        <CreditOverviewTab
          customer={selectedCustomer}
          onPayCredit={onPayCredit}
          onAdjustCredit={onAdjustCredit}
        />
      </TabsContent>

      <TabsContent value="invoices">
        <CreditInvoicesTab
          invoices={creditInvoices}
          onRefresh={onRefreshInvoices}
          isLoading={isLoading}
        />
      </TabsContent>

      <TabsContent value="history">
        <PaymentHistoryTab
          payments={creditPaymentHistory}
          onRefresh={onRefreshHistory}
          isLoading={isLoading}
        />
      </TabsContent>
    </Tabs>
  );
}