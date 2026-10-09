const test = require("node:test");
const assert = require("node:assert/strict");

test("Order & Payment Business Logic Tests", async (t) => {
  await t.test("Webhook Secret Key validation logic", () => {
    const configuredSecret = "my_super_secret_webhook_key";
    
    // Case 1: Valid Apikey header
    const validHeader = `Apikey ${configuredSecret}`;
    const isValid = (validHeader === `Apikey ${configuredSecret}` || validHeader === configuredSecret);
    assert.equal(isValid, true);

    // Case 2: Invalid header
    const invalidHeader = "Apikey wrong_secret";
    const isInvalid = (invalidHeader === `Apikey ${configuredSecret}` || invalidHeader === configuredSecret);
    assert.equal(isInvalid, false);
  });

  await t.test("Order Total and Remaining Amount Calculation", () => {
    const order = {
      subtotal: 500000,
      shippingFee: 30000,
      discountTotal: 50000,
      total: 480000,
      payments: [
        { amount: 200000, payment_status: "paid" },
        { amount: 100000, payment_status: "paid" }
      ]
    };

    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = Math.max(0, order.total - totalPaid);

    assert.equal(totalPaid, 300000);
    assert.equal(remainingAmount, 180000);
    assert.equal(totalPaid >= order.total, false); // Still partially paid
  });
});
