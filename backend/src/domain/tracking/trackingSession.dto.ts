import { TrackingSession } from "./trackingSession";

export type TrackingSessionDTO = {
  sessionId: string;
};

export const fromDomain = (session: TrackingSession): TrackingSessionDTO => ({
  sessionId: session.activeSessionId,
});
