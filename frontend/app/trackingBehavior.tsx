"use client";

import { TrackingBehavior } from "./WithTrackingBehavior";

export const trackInView: TrackingBehavior = ({
  ref,
  actionType,
  trackAction,
}) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        trackAction(actionType);
        observer.unobserve(entry.target);
      }
    });
  });

  if (ref.current) {
    observer.observe(ref.current);
  }
  return () => {
    observer.disconnect();
  };
};

export const trackPageVisit: TrackingBehavior = ({
  trackAction,
  actionType,
}) => {
  setTimeout(() => trackAction(actionType), 1000);
};

export const trackRefInteraction: TrackingBehavior = ({
  ref,
  trackAction,
  actionType,
}) => {
  if (ref.current) {
    ref.current.addEventListener("click", () => {
      trackAction(actionType);
    });
  }
};
