import { TrackingActionType } from "../../domain/tracking/trackingAction";
import {
  TrackingSessionDTO,
  fromDomain,
} from "../../domain/tracking/trackingSession.dto";
import { TrackingSessionRepository } from "../../domain/tracking/trackingSession.repository";

export const trackingService = (
  trackingSessionRepository: TrackingSessionRepository
) => ({
  getByUserId: async (userId: string): Promise<TrackingSessionDTO | null> =>
    trackingSessionRepository
      .findByUserId(userId)
      .then((session) => fromDomain(session))
      .catch(() => null),
  save: async (userId: string): Promise<TrackingSessionDTO | null> =>
    trackingSessionRepository
      .createSession(userId)
      .then((session) => fromDomain(session))
      .catch(() => null),
  refresh: async (userId: string): Promise<TrackingSessionDTO | null> =>
    trackingSessionRepository
      .refreshSession(userId)
      .then((session) => fromDomain(session))
      .catch(() => null),
  track: async (
    userId: string,
    sessionId: string,
    action: TrackingActionType,
    origin?: string
  ): Promise<TrackingSessionDTO | null> =>
    trackingSessionRepository
      .createAction(userId, sessionId, action, origin)
      .then((session) => fromDomain(session))
      .catch(() => null),
});

export type TrackingService = ReturnType<typeof trackingService>;
