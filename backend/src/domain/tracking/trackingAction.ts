export type TrackingAction = {
  sessionId: string;
  metric: TrackingActionType;
  origin?: string;
  timestamp: Date;
};

export const trackingActionType = [
  "pageVisit",
  "objectInView",
  "objectInteraction",
] as const;

export type TrackingActionType = (typeof trackingActionType)[number];
