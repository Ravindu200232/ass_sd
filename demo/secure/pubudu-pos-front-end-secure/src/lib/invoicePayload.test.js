import { describe, expect, it } from "vitest";
import {
  buildInvoicePayload,
  SERVER_DERIVED_INVOICE_FIELDS,
} from "./invoicePayload";

const validInput = {
  invDate: "2026-09-21",
  customerType: "save",
  customerCode: "CUS0001",
  departmentId: "2",
  type: "tire",
  service: "Tyre fitting",
  paymentStatus: "cash",
  payAmount: "5000",
  note: "Customer waiting",
  items: [
    {
      product_code: "PRD0001",
      product_name: "Michelin Primacy 4",
      qty: "2",
      selling_price: "32000",
      discount: "300",
      description: "205/55R16",
      type: "product",
    },
  ],
};

describe("buildInvoicePayload", () => {
  it("sends operator choices and an expected catalogue quote", () => {
    expect(buildInvoicePayload(validInput)).toMatchObject({
      inv_date: "2026-09-21",
      customer_code: "CUS0001",
      department_id: 2,
      pay_amount: 5000,
      items: [
        {
          product_code: "PRD0001",
          qty: 2,
          selling_price: 32000,
          discount: 300,
        },
      ],
    });
  });

  it("never sends fields that the API must calculate or take from the token", () => {
    const payload = buildInvoicePayload(validInput);

    for (const field of SERVER_DERIVED_INVOICE_FIELDS) {
      expect(payload).not.toHaveProperty(field);
    }
  });

  it("does not carry a customer identifier for a cash sale", () => {
    const payload = buildInvoicePayload({
      ...validInput,
      customerType: "cash",
      customerCode: "CUS0001",
    });

    expect(payload).not.toHaveProperty("customer_code");
  });

  it("normalizes invalid submitted amounts without calculating a financial total", () => {
    const payload = buildInvoicePayload({
      ...validInput,
      payAmount: "not-a-number",
      items: [{ ...validInput.items[0], qty: "invalid", discount: -50 }],
    });

    expect(payload.pay_amount).toBe(0);
    expect(payload.items[0]).toMatchObject({ qty: 0, discount: 0 });
    expect(payload).not.toHaveProperty("net_total");
  });
});
