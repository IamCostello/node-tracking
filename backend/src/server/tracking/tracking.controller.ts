import { Request, Response } from "express";
import { TrackingService } from "./tracking.service";
import { trackingActionType } from "../../domain/tracking/trackingAction";
import { z } from "zod";

export const sessionRequestSchema = z.object({
  userId: z.string().uuid(),
});

export const sessionActionRequestSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(trackingActionType),
});

export const trackingController = (trackingService: TrackingService) => ({
  async saveSession(req: Request, res: Response) {
    const { userId } = req.body;

    try {
      const session = await trackingService.getByUserId(userId);

      if (session) {
        const refreshedSession = await trackingService.refresh(userId);

        return res.status(200).json(refreshedSession);
      }

      const newSession = await trackingService.save(userId);

      return res.status(201).json(newSession);
    } catch (error) {
      return res.status(409).json({ message: "Failed to save session" });
    }
  },
  async refreshSession(req: Request, res: Response) {
    const { userId } = req.body;

    const session = await trackingService.refresh(userId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json({ session });
  },
  async trackAction(req: Request, res: Response) {
    const { userId, action } = req.body;

    const session = await trackingService.getByUserId(userId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await trackingService.track(
      userId,
      session.sessionId,
      action,
      req.get("origin")
    );

    res.status(201).json(session);
  },
});
