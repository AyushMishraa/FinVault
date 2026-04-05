import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeMinRole } from "../middleware/role.middleware";
import { Role } from "../types";

const router = Router();
router.use(authenticate);

// All roles can view summary, categories, and recent activity
router.get("/summary", DashboardController.getSummary);
router.get("/categories", DashboardController.getCategoryTotals);
router.get("/recent", DashboardController.getRecentActivity);

// Trend endpoints require Analyst or Admin (deeper analytical views)
router.get(
  "/trends/monthly",
  authorizeMinRole(Role.ANALYST),
  DashboardController.getMonthlyTrends,
);
router.get(
  "/trends/weekly",
  authorizeMinRole(Role.ANALYST),
  DashboardController.getWeeklyTrends,
);

export default router;
