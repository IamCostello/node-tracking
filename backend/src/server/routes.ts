import { Router } from "express";
import { trackingService } from "./tracking/tracking.service";
import {
  sessionActionRequestSchema,
  sessionRequestSchema,
  trackingController,
} from "./tracking/tracking.controller";
import { trackingSessionRepository } from "../db/mongo/trackingSession.repository";
import { validate } from "./validation.middleware";

const router = Router();

const mongoTrackingSessionRepository = trackingSessionRepository();

const trackingServiceInstance = trackingService(mongoTrackingSessionRepository);
const trackingControllerInstance = trackingController(trackingServiceInstance);

router.post(
  "/session",
  validate(sessionRequestSchema),
  trackingControllerInstance.saveSession
);
router.post(
  "/track",
  validate(sessionActionRequestSchema),
  trackingControllerInstance.trackAction
);

export default router;
