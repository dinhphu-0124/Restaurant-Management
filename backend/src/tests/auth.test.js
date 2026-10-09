const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { requireRoles } = require("../middleware/authMiddleware");

test("Authentication & Authorization Middleware Tests", async (t) => {
  await t.test("requireRoles blocks unauthorized roles with 403 status", () => {
    const adminOnlyMiddleware = requireRoles("admin");
    const req = {
      user: { id: 1, role: "user", name: "Test User" }
    };
    let statusSet = null;
    let jsonResponse = null;
    const res = {
      status: (s) => {
        statusSet = s;
        return {
          json: (data) => {
            jsonResponse = data;
          }
        };
      }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    adminOnlyMiddleware(req, res, next);

    assert.equal(statusSet, 403);
    assert.equal(jsonResponse.success, false);
    assert.equal(jsonResponse.code, "FORBIDDEN");
    assert.equal(nextCalled, false);
  });

  await t.test("requireRoles allows authorized role", () => {
    const managerMiddleware = requireRoles("manager", "admin");
    const req = {
      user: { id: 2, role: "admin", name: "Admin User" }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    managerMiddleware(req, {}, next);
    assert.equal(nextCalled, true);
  });

  await t.test("JWT token verification works properly with secret", () => {
    const secret = "test_jwt_secret_key_123456";
    const payload = { id: 99, role: "staff" };
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });

    const decoded = jwt.verify(token, secret);
    assert.equal(decoded.id, 99);
    assert.equal(decoded.role, "staff");
  });
});
