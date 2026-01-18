import express from "express";
import { generateUploadUrl } from "../../controller/admin/uploadController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const uploadRouter = express.Router();

// Upload route - requires authentication
uploadRouter.post("/upload-url", authenticate, generateUploadUrl);

export default uploadRouter;
