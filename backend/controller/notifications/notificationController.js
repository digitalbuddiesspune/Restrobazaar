import User from "../../models/users/user.js";
import Vendor from "../../models/admin/vendor.js";

const resolveRecipientModel = (role) => {
  if (role === "vendor") return Vendor;
  if (role === "user") return User;
  return null;
};

const maskToken = (token) => {
  if (!token || typeof token !== "string") return "unknown";
  const trimmed = token.trim();
  if (trimmed.length <= 12) return `${trimmed.slice(0, 4)}...`;
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
};

export const registerDeviceToken = async (req, res) => {
  try {
    const { token, platform, deviceId } = req.body || {};

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Device token is required",
      });
    }

    const role = req.user?.role;
    const model = resolveRecipientModel(role);
    if (!model) {
      return res.status(403).json({
        success: false,
        message: "Notifications are not supported for this account type",
      });
    }

    const recipient = await model.findById(req.user.userId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const now = new Date();
    const existing = recipient.deviceTokens?.find(
      (entry) => entry.token === token
    );

    if (existing) {
      existing.lastUsedAt = now;
      if (platform) existing.platform = platform;
      if (deviceId) existing.deviceId = deviceId;
    } else {
      recipient.deviceTokens = recipient.deviceTokens || [];
      recipient.deviceTokens.push({
        token,
        platform: platform || "unknown",
        deviceId,
        createdAt: now,
        lastUsedAt: now,
      });
    }

    await recipient.save();

    console.log("Device token registered", {
      userId: req.user?.userId?.toString(),
      role: req.user?.role,
      platform: platform || existing?.platform || "unknown",
      deviceId: deviceId || existing?.deviceId || null,
      status: existing ? "updated" : "created",
      token: maskToken(token),
    });

    return res.status(200).json({
      success: true,
      message: "Device token registered",
    });
  } catch (error) {
    console.error("Error registering device token:", error);
    return res.status(500).json({
      success: false,
      message: "Error registering device token",
      error: error.message,
    });
  }
};

export const unregisterDeviceToken = async (req, res) => {
  try {
    const { token } = req.body || {};

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Device token is required",
      });
    }

    const role = req.user?.role;
    const model = resolveRecipientModel(role);
    if (!model) {
      return res.status(403).json({
        success: false,
        message: "Notifications are not supported for this account type",
      });
    }

    await model.updateOne(
      { _id: req.user.userId },
      { $pull: { deviceTokens: { token } } }
    );

    return res.status(200).json({
      success: true,
      message: "Device token removed",
    });
  } catch (error) {
    console.error("Error unregistering device token:", error);
    return res.status(500).json({
      success: false,
      message: "Error unregistering device token",
      error: error.message,
    });
  }
};
