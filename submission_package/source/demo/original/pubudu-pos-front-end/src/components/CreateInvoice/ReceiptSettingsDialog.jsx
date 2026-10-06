import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Printer, Download, X } from "lucide-react";

export default function ReceiptSettingsDialog({
  isOpen,
  onClose,
  invoiceNo,
  setInvoiceNo,
  orderNo,
  setOrderNo,
  dateTime,
  userCode,
  setUserCode,
  autoPrintEnabled,
  toggleAutoPrint,
  cart,
  handleManualPrint,
  handleDownload80mmPDF,
  generateNewInvoiceNumber
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Printer className="h-5 w-5 text-orange-500" />
              Receipt Settings
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Receipt No.</Label>
              <Input
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="font-mono text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Order No.</Label>
              <Input
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                className="font-mono text-sm mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Date & Time</Label>
            <Input value={dateTime} readOnly className="text-sm mt-1" />
          </div>
          
          <div>
            <Label className="text-sm font-medium">User Code</Label>
            <Input
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              className="text-sm mt-1"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">Auto Print Receipt</div>
              <div className="text-xs text-gray-500">
                Automatically print thermal receipt when creating invoice
              </div>
            </div>
            <button
              onClick={toggleAutoPrint}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoPrintEnabled ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoPrintEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={generateNewInvoiceNumber}
              className="flex-1"
            >
              New Invoice No
            </Button>
            
            <Button
              variant="outline"
              onClick={handleManualPrint}
              className="flex-1"
              disabled={cart.length === 0}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Now
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownload80mmPDF}
              className="flex-1"
              disabled={cart.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}