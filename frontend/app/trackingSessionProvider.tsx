"use client";

import { createContext, use, useCallback, useEffect, useState } from "react";

const trackingActionType = [
  "objectInView",
  "pageVisit",
  "objectInteraction",
] as const;

export type TrackingActionType = (typeof trackingActionType)[number];

export type TrackingActionDispatch = (actionType: TrackingActionType) => void;

type SessionId = string;

export const TrackingSessionContext = createContext<
  TrackingActionDispatch | undefined
>(undefined);

export const TrackingSessionProvider = ({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) => {
  const [sessionId, setSessionId] = useState<string | undefined>();
  const trackActionDispatch = useCallback(trackAction(userId), [userId]);

  useEffect(() => {
    sessionStorage.clear();
  }, [userId]);

  useEffect(() => {
    const retrieveSession = async () => {
      try {
        const sessionIdCache = getSessionIdFromStorage();

        if (sessionIdCache) {
          setSessionId(sessionIdCache);
          return;
        }

        const newSession = await createSession(userId);

        if (newSession) {
          setSessionIdStorage(newSession);
          setSessionId(newSession);
          return;
        }
      } catch (error) {
        console.error("Error getting session", error);
      }
    };

    retrieveSession();
  }, []);

  return (
    <TrackingSessionContext.Provider value={trackActionDispatch}>
      {children}
    </TrackingSessionContext.Provider>
  );
};

export const useTrackingActionDispatch = () => {
  const trackActionDispatch = use(TrackingSessionContext);

  if (!trackActionDispatch) {
    throw new Error(
      "useTrackingActionDispatch must be used within a TrackingSessionProvider"
    );
  }

  return trackActionDispatch;
};

const getSessionIdFromStorage = (): SessionId | null => {
  const sessionId = sessionStorage.getItem("sessionId");

  if (sessionId && sessionId !== "undefined") {
    return sessionId;
  }

  return null;
};

const setSessionIdStorage = (sessionId: SessionId) =>
  sessionStorage.setItem("sessionId", sessionId);

const createSession = async (userId: string): Promise<SessionId | null> => {
  try {
    const newSessionResponse = await fetch(
      // "http://localhost:8080/api/session",
      process.env.NEXT_PUBLIC_TRACKING_SERVICE_URL + "/session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );

    const newSession = await newSessionResponse.json();

    return Promise.resolve(newSession.sessionId);
  } catch (error) {
    return Promise.resolve(null);
  }
};

const trackAction = (userId?: string): TrackingActionDispatch => {
  return async (actionType) => {
    const trackActionResponse = await fetch(
      process.env.NEXT_PUBLIC_TRACKING_SERVICE_URL + "/track",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, action: actionType }),
      }
    );

    if (
      trackActionResponse.status === 400 ||
      trackActionResponse.status === 404
    ) {
      sessionStorage.removeItem("sessionId");
    }
  };
};
