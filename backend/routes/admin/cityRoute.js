import express from "express";
const cityRouter = express.Router();
import {
  getAllCities,
  getCityById,
  getCityByName,
  getServiceableCities,
  getCitiesByState,
  createCity,
  updateCity,
  deleteCity,
  toggleCityActive,
  toggleCityServiceable,
  seedCities,
} from "../../controller/admin/cityController.js";
import { authenticate, authorize } from "../../middleware/authMiddleware.js";

// Public routes
cityRouter.get("/cities", getAllCities);
cityRouter.get("/cities/:id", getCityById);
cityRouter.get("/cities/name/:name", getCityByName);
cityRouter.get("/cities/serviceable", getServiceableCities);
cityRouter.get("/cities/state/:state", getCitiesByState);

// Admin routes
cityRouter.post("/cities", authenticate, authorize("admin", "super_admin"), createCity);
cityRouter.put("/cities/:id", authenticate, authorize("admin", "super_admin"), updateCity);
cityRouter.delete("/cities/:id", authenticate, authorize("admin", "super_admin"), deleteCity);
cityRouter.patch("/cities/:id/toggle-active", authenticate, authorize("admin", "super_admin"), toggleCityActive);
cityRouter.patch("/cities/:id/toggle-serviceable", authenticate, authorize("admin", "super_admin"), toggleCityServiceable);
cityRouter.post("/cities/seed", authenticate, authorize("admin", "super_admin"), seedCities);

export default cityRouter;



