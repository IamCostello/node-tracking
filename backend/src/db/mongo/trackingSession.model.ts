import mongoose, { Schema, Document } from "mongoose";

export interface TrackingSession extends Document {
  activeSessionId: string;
  userId: string;
}

export interface TrackingSessionWithActions extends TrackingSession {
  actions: [
    {
      sessiondId: string;
      origin: string;
      type: string;
      timestamp: Date;
    }
  ];
}

const trackingSessionActionSchema = new Schema({
  sessionId: { type: String, required: true },
  origin: { type: String, required: false },
  type: { type: String, required: true },
  timestamp: { type: Date, required: true },
});

const trackingSessionSchema = new Schema({
  activeSessionId: { type: String, required: true },
  userId: { type: String, required: true, unique: true },
  actions: [trackingSessionActionSchema],
});

export default mongoose.model("TrackingSession", trackingSessionSchema);
