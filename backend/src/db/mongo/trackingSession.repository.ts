import { randomUUID } from "crypto";
import { TrackingSessionRepository } from "../../domain/tracking/trackingSession.repository";
import trackingSessionModel from "./trackingSession.model";

export const trackingSessionRepository = (): TrackingSessionRepository => ({
  async findByUserId(userId) {
    const session = await trackingSessionModel.findOne({
      userId,
    });

    if (!session) {
      return Promise.reject("Session not found");
    }

    return { userId: session.userId, activeSessionId: session.activeSessionId };
  },
  async createSession(userId) {
    const session = await trackingSessionModel.create({
      userId,
      activeSessionId: randomUUID(),
    });

    return { userId: session.userId, activeSessionId: session.activeSessionId };
  },
  async refreshSession(userId) {
    const session = await trackingSessionModel.findOneAndUpdate(
      { userId },
      { activeSessionId: randomUUID() },
      { new: true }
    );

    if (!session) {
      return Promise.reject("Session not found");
    }

    return { userId: session.userId, activeSessionId: session.activeSessionId };
  },
  async createAction(userId, sessionId, action, origin) {
    const sessionAction = await trackingSessionModel
      .findOneAndUpdate(
        { userId },
        {
          $push: {
            actions: {
              sessionId,
              origin,
              type: action,
              timestamp: new Date(),
            },
          },
        },
        { new: true }
      )
      .exec();

    if (!sessionAction) {
      return Promise.reject("Session not found");
    }

    return {
      userId: sessionAction.userId,
      activeSessionId: sessionAction.activeSessionId,
    };
  },
});
