import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  updateUserSchema,
  userIdParamSchema,
} from "../validators/auth.validator";
import { Role } from "../types";

const router = Router();
router.use(authenticate); // all user routes require a valid JWT

// Any logged-in user can list users or fetch a specific user
// (controllers enforce additional scope rules, e.g. non-admins can only see themselves)
router.get("/", UserController.getAll);
router.get("/:id", validate(userIdParamSchema), UserController.getById);

// Only admins can mutate users
router.patch(
  "/:id",
  authorize(Role.ADMIN),
  validate(updateUserSchema),
  UserController.update,
);
router.patch(
  "/:id/toggle-status",
  authorize(Role.ADMIN),
  validate(userIdParamSchema),
  UserController.toggleStatus,
);

export default router;
