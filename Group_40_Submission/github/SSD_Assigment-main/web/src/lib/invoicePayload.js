/**
 * V-10: Build the smallest possible request for invoice creation.
 *
 * A browser is an untrusted client. It may describe the sale the operator is
 * trying to make, but it must not author the financial record. In particular,
 * totals, balances, staff identity and credit allocation are calculated from
 * locked database records by InvoiceController::store(). Keeping them out of
 * the request is defence in depth and makes DevTools tampering visibly futile.
 *
 * `selling_price` remains as an expected catalogue quote: the API compares it
 * with the FIFO-resolved price and rejects a mismatch. It is not authoritative.
 */
export const SERVER_DERIVED_INVOICE_FIELDS = Object.freeze([
  "total_amount",
  "total_discount",
  "net_total",
  "balance",
  "credit_paid",
  "credit_allocated",
  "remaining_balance",
  "is_credit_paid",
  "inv_by",
  "is_draft",
]);

const numberOrZero = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function buildInvoicePayload({
  invDate,
  customerType,
  customerCode,
  departmentId,
  type,
  service,
  paymentStatus,
  payAmount,
  note,
  items,
}) {
  const payload = {
    inv_date: invDate,
    customer_type: customerType,
    department_id: Number(departmentId),
    type,
    service: service || null,
    payment_status: paymentStatus,
    // The amount tendered is operator input. The API bounds it by the
    // server-calculated total before storing it.
    pay_amount: Math.max(0, numberOrZero(payAmount)),
    note: note || "",
    items: items.map((item) => ({
      product_code: item.product_code,
      product_name: item.product_name,
      qty: numberOrZero(item.qty),
      // A quote to be verified by the API, not a price to be trusted.
      selling_price: numberOrZero(item.selling_price),
      // The API resolves this to an approved, single-use request or rejects it.
      discount: Math.max(0, numberOrZero(item.discount)),
      description: item.description || item.product_name,
      type: item.type || "product",
    })),
  };

  if (customerType === "save" && customerCode) {
    payload.customer_code = customerCode;
  }

  return payload;
}
