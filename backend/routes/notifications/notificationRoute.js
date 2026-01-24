import express from "express";

import {
  registerDeviceToken,
  unregisterDeviceToken,
} from "../../controller/notifications/notificationController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const notificationRouter = express.Router();

notificationRouter.post(
  "/notifications/token",
  authenticate,
  registerDeviceToken
);

notificationRouter.delete(
  "/notifications/token",
  authenticate,
  unregisterDeviceToken
);

export default notificationRouter;
