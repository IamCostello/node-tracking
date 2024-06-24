"use client";

import { RefObject, useEffect, useRef } from "react";
import {
  TrackingActionDispatch,
  TrackingActionType,
  useTrackingActionDispatch,
} from "./trackingSessionProvider";

export type TrackingActionObject = RefObject<HTMLDivElement>;

export type TrackingBehavior = (args: {
  ref: TrackingActionObject;
  actionType: TrackingActionType;
  trackAction: TrackingActionDispatch;
}) => void;

type WithTrackingBehaviorProps = {
  actionType: TrackingActionType;
  behavior: TrackingBehavior;
  children: React.ReactNode;
};

export const WithTrackingBehavior = ({
  actionType,
  behavior,
  children,
}: WithTrackingBehaviorProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const trackAction = useTrackingActionDispatch();

  useEffect(() => {
    behavior({ ref, actionType, trackAction });
  }, [ref, actionType, trackAction]);

  return <div ref={ref}>{children}</div>;
};
