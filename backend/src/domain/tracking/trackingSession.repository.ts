import { TrackingActionType } from "./trackingAction";
import { TrackingSession } from "./trackingSession";

export interface TrackingSessionRepository {
  findByUserId(userId: string): Promise<TrackingSession>;
  createSession(userId: string): Promise<TrackingSession>;
  refreshSession(userId: string): Promise<TrackingSession>;
  createAction(
    userId: string,
    sessionId: string,
    action: TrackingActionType,
    origin?: string
  ): Promise<TrackingSession>;
}
