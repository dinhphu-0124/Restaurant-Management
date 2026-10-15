const fs = require("fs");
const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

let isInitialized = false;

function initFirebase() {
  if (isInitialized || getApps().length > 0) {
    isInitialized = true;
    return true;
  }

  try {
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        // In case it was base64 encoded
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf-8");
        serviceAccount = JSON.parse(decoded);
      }
    } else {
      const jsonPath = path.join(__dirname, "firebase-service-account.json");
      if (fs.existsSync(jsonPath)) {
        serviceAccount = require(jsonPath);
      }
    }

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
      });
      isInitialized = true;
      console.log("Firebase Admin SDK initialized successfully");
      return true;
    } else {
      console.warn("⚠️ Firebase Admin SDK: No service account credentials found. Social login verification may be unavailable.");
      return false;
    }
  } catch (err) {
    console.warn("⚠️ Firebase Admin initialization failed:", err.message);
    return false;
  }
}

initFirebase();

module.exports = {
  auth: () => {
    if (!isInitialized && !initFirebase()) {
      throw new Error(
        "Firebase Admin SDK is not configured. Please set FIREBASE_SERVICE_ACCOUNT environment variable or provide firebase-service-account.json."
      );
    }
    return getAuth();
  },
};
