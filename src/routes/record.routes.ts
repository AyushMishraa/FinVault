import { Router } from "express";
import { RecordController } from "../controllers/record.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createRecordSchema,
  updateRecordSchema,
  recordFilterSchema,
  recordIdParamSchema,
} from "../validators/record.validator";
import { Role } from "../types";

const router = Router();
router.use(authenticate);

// Viewers can read; Analysts can read + write their own; Admins have full access
router.post(
  "/",
  authorize(Role.ANALYST, Role.ADMIN),
  validate(createRecordSchema),
  RecordController.create,
);
router.get("/", validate(recordFilterSchema), RecordController.getAll);
router.get("/:id", validate(recordIdParamSchema), RecordController.getById);
router.patch(
  "/:id",
  authorize(Role.ANALYST, Role.ADMIN),
  validate(updateRecordSchema),
  RecordController.update,
);
router.delete(
  "/:id",
  authorize(Role.ANALYST, Role.ADMIN),
  validate(recordIdParamSchema),
  RecordController.remove,
);

export default router;
