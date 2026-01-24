import fs from "fs";
import admin from "firebase-admin";

import User from "../models/users/user.js";
import Vendor from "../models/admin/vendor.js";

let firebaseApp = null;

const normalizeData = (data = {}) => {
  const normalized = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    normalized[key] = typeof value === "string" ? value : String(value);
  });
  return normalized;
};

const getFirebaseApp = () => {
  if (firebaseApp) return firebaseApp;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  let serviceAccount = null;
  try {
    if (json) {
      serviceAccount = JSON.parse(json);
    } else if (path) {
      const raw = fs.readFileSync(path, "utf8");
      serviceAccount = JSON.parse(raw);
    }
  } catch (error) {
    console.warn("FCM: Failed to load service account:", error.message);
  }

  if (!serviceAccount) {
    return null;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return firebaseApp;
};

const getTokensFromRecipient = (recipient) => {
  if (!recipient?.deviceTokens?.length) return [];
  return recipient.deviceTokens
    .map((entry) => entry.token)
    .filter((token) => typeof token === "string" && token.trim().length > 0);
};

const pruneInvalidTokens = async (model, recipientId, response) => {
  if (!response?.responses || !Array.isArray(response.responses)) return;

  const invalidTokens = [];
  response.responses.forEach((result, index) => {
    if (result?.success) return;
    const code = result?.error?.code;
    if (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-argument"
    ) {
      invalidTokens.push(response.tokens?.[index]);
    }
  });

  if (!invalidTokens.length) return;
  await model.updateOne(
    { _id: recipientId },
    { $pull: { deviceTokens: { token: { $in: invalidTokens } } } }
  );
};

const sendToTokens = async (tokens, { title, body, data }) => {
  if (!tokens.length) {
    return { sent: 0, failed: 0 };
  }

  const app = getFirebaseApp();
  if (!app) {
    console.warn("FCM: Service account not configured. Skipping send.");
    return { sent: 0, failed: tokens.length };
  }

  const message = {
    tokens,
    notification: {
      title,
      body,
    },
    data: normalizeData(data),
    android: {
      priority: "high",
      notification: {
        channelId: "restrobazaar_default",
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  response.tokens = tokens;
  return response;
};

export const sendNotificationToUser = async ({
  userId,
  title,
  body,
  data = {},
}) => {
  const user = await User.findById(userId).select("deviceTokens");
  if (!user) return { sent: 0, failed: 0 };

  const tokens = getTokensFromRecipient(user);
  const response = await sendToTokens(tokens, { title, body, data });
  await pruneInvalidTokens(User, userId, response);
  return response;
};

export const sendNotificationToVendor = async ({
  vendorId,
  title,
  body,
  data = {},
}) => {
  const vendor = await Vendor.findById(vendorId).select("deviceTokens");
  if (!vendor) return { sent: 0, failed: 0 };

  const tokens = getTokensFromRecipient(vendor);
  const response = await sendToTokens(tokens, { title, body, data });
  await pruneInvalidTokens(Vendor, vendorId, response);
  return response;
};
