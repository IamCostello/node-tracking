### Development
Run project with Docker
```
make dev
```
or
```
docker-compose up
```

# Content
* [Solution](#Solution)
* [Code walkthrough](#Code-walkthrough)

# Solution
![image](https://github.com/IamCostello/node-tracking/assets/28679660/43d3a03b-1630-4cc9-94f9-3193ed94740d)
- Establish new session for every unique user
- Client handles when session starts and ends
  - Refresh session when sesstion storage lost
  - Tracking service stores only active session id to brand user event actions with
  - Same way the tracking service is able to track user actions across different sessions
- Store user action event as action log
  - Can be used to "recreate" user navigation/interaction in session
  - (could implement batch processing by having client send events periodically resulting in less chatty traffic between Client and Tracking service)
  - (could implement layer 4 load balancer to control inflow of user tracking requests)
- Tracking service DB acts as a data lake for user tracking events
  - Holds lots of semi-structured data in high throughput DB
  - Tracking service designed as a stateless service to allow for easy horizontal scaling
    - (could implement DNS load balancing to reduce the latency as much as possible given a lot of user event tracking calls)
- Analytics server periodically processes or analyses data
  - In this use case, pulls out numerical session/events count metrics
  - Store every metric report in analytics DB
  - Store most recent job result (report) in in-memory DB for caching purpose
- Analytics service DB acts as a data warehouse
  - Process a subset of data (metric in this case) to be actively used in different part of the system
  - This approach offers better performance when using the tracking service data

### Tech stack
- Node.js
  - Built on an event-driven architecture, which makes it suitable for handling numerous concurrent connections. This is ideal for a tracking service that needs to manage a high volume of user event data.
- MongoDB
  - Designed to handle high volumes of read and write operations, making it suitable for a tracking service that needs to store a large number of events.
  - Supports sharding, which allows the database to scale horizontally, matching the stateless design of the tracking service for easy horizontal scaling.  - 
- Memcached
  - In-memory caching improves the overall performance of the system by reducing the load on the primary database and speeding up data retrieval times.
- Next.js
  - Supports SSR, which can improve the performance and SEO of the client application. This is beneficial for the analytics dashboard or any client-facing part of the system.
- Nginx (not implemented in the docker-compose)
  - Can act as a reverse proxy and load balancer, distributing incoming traffic across multiple instances of the tracking service and improving the system’s reliability and availability.
----
- Scalability
  - The combination of Node.js, MongoDB, and Nginx supports both vertical and horizontal scaling, ensuring the system can handle increased load as the number of users grows.
- Performance:
  - Node.js’s non-blocking architecture, MongoDB’s high throughput, and Memcache’s in-memory caching work together to provide a high-performance system capable of processing and analyzing large volumes of data efficiently.
- Flexibility:
  - MongoDB’s schema flexibility, combined with the ability of Next.js to handle both static and dynamic content, allows the system to adapt to changing requirements without significant overhauls.

# Code walkthrough
## Tracking service [/backend](/backend)
Http web server used to store users tracking session and log it's events

### [routes.ts](backend/src/server/routes.ts)
```typescript
// Creats a new session and writes it to db
router.post(
  "/session",
  validate(sessionRequestSchema),
  trackingControllerInstance.saveSession
);
// Saves user tracking event to db
router.post(
  "/track",
  validate(sessionActionRequestSchema),
  trackingControllerInstance.trackAction
);
```

### [validation.middleware.ts](backend/src/server/validation.middleware.ts)
Validate incoming requests using zod
```typescript
const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  };
```

```typescript
export const sessionRequestSchema = z.object({
  userId: z.string().uuid(),
});

export const sessionActionRequestSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(trackingActionType),
});
```

### [routes.ts](backend/src/server/routes.ts)
Use dependency injection to setup tracking module
```typescript
const mongoTrackingSessionRepository = trackingSessionRepository();

const trackingServiceInstance = trackingService(mongoTrackingSessionRepository);
const trackingControllerInstance = trackingController(trackingServiceInstance);
```

### [trackingSession.ts](backend/src/domain/tracking/trackingSession.ts) [trackingAction.ts](backend/src/domain/tracking/trackingAction.ts)
Exposes shared domain types for tracking module
```typescript
export type TrackingSession = {
  userId: string;
  activeSessionId: string;
};
```
```typescript
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
```

### [trackingSession.repository.ts](backend/src/domain/tracking/trackingSession.repository.ts)
Expose domain interface of how to interact with pageSession domain type
```typescript
interface TrackingSessionRepository {
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
```

### [trackingSession.repository.ts](backend/src/db/mongo/trackingSession.repository.ts)
Example of tracking domain interaction with mongodb adapter. Thanks to using the domain interface, we can easily create any replace it with any other adapter eg. different database or http adapter
```typescript
const trackingSessionRepository = (): TrackingSessionRepository => ({
  async findByUserId(userId) {},
  async createSession(userId) {},
  async refreshSession(userId) {},
  async createAction(userId, sessionId, action, origin) {},
});
```

### [tracking.controller.ts](backend/src/server/tracking/tracking.controller.ts)
Handle http requests, response and run business logic from tracking service/repository
```typescript
const trackingController = (trackingService: TrackingService) => ({
  async saveSession(req: Request, res: Response) {},
  async refreshSession(req: Request, res: Response) {},
  async trackAction(req: Request, res: Response) {},
});
```

## Analytics service [/analytics](/analytics)
Simple Http web server serving analytic metrics and running cron job to analyze data from tracking service

### [uniqueUsers.metric.ts](analytics/src/metrics/uniqueUsers.metric.ts) [uniqueUsersWithObjectInView.metric.ts](analytics/src/metrics/uniqueUsersWithObjectInView.metric.ts)
Collect the metric of unique users tracked and unique users that scrolled to image

```typescript
const uniqueUsersMetric = async (dataCollection: Collection) => {
  try {
    return dataCollection.countDocuments();
  } catch (error) {
    return null;
  }
};
```
```typescript
const uniqueUsersWithObjectInViewMetric = async (
  dataCollection: Collection
) => {
  try {
    return dataCollection.countDocuments({
      "actions.type": "objectInView",
    });
  } catch (error) {
    return null;
  }
};
```

### [index.ts](analytics/src/index.ts)
Run cron job to analyze tracking service data, save metric with timestamp for historical data, save the most recent metric to memcache
```typescript
cron.schedule("*/1 * * * *", async () => {
  try {
    ...

    const res = await Promise.all([
      uniqueUsersMetric(trackingData),
      uniqueUsersWithObjectInViewMetric(trackingData),
    ]);

    ...

    await analyticsDataClient
      .db("analytics-service-data")
      .collection("metrics")
      .insertOne(metrics);

    cacheClient.set(CACHE_KEY, JSON.stringify(metrics));
  } catch (error) {
    console.error("Failed to calculate metrics", error);
  }
});
```
Serve metrics from cache
```typescript
app.get("/", (req, res) => {
  cacheClient.get(CACHE_KEY, (err, value) => {
    ...

    if (value) {
      res.send(JSON.parse(value.toString()));
      return;
    }

    res.status(503).send({ message: "No data available" });
  });
});
```

## Client [/frontend](/frontend)
### [trackingSessionProvider.tsx](frontend/app/trackingSessionProvider.tsx)
Provides app context with function to fire a network call with tracking event data
```typescript
const TrackingSessionContext = createContext<
  TrackingActionDispatch | undefined
>(undefined);
```
```typescript
const TrackingSessionProvider = ({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) => {
  const [sessionId, setSessionId] = useState<string | undefined>();
  const trackActionDispatch = useCallback(trackAction(userId), [userId]);

  useEffect(() => {
    const retrieveSession = async () => {
      ...
    };

    retrieveSession();
  }, []);

  return (
    <TrackingSessionContext.Provider value={trackActionDispatch}>
      {children}
    </TrackingSessionContext.Provider>
  );
};
```
```typescript
const useTrackingActionDispatch = () => {
  const trackActionDispatch = use(TrackingSessionContext);

  if (!trackActionDispatch) {
    throw new Error(
      "useTrackingActionDispatch must be used within a TrackingSessionProvider"
    );
  }

  return trackActionDispatch;
}
```

### [page.tsx](frontend/app/page.tsx)
Root page of client app, pre-rendered on server with fake user data
```typescript
const getFakeUser = async () => {
  const res = await fetch("https://random-data-api.com/api/v2/users", {
    // will cache user fake data for 60 seconds even when tab closes and sessionStorage lost
    next: { revalidate: 60 },
  });

  return res.json();
};

const Page = async () => {
  const data = await getFakeUser();

  return (
    <TrackingSessionProvider userId={data.uid}>
      // track page visit
      <WithTrackingBehavior actionType="pageVisit" behavior={trackPageVisit}>
        <main>
          ...

          <div>
            {[...Array(10)].map((_, i) => (
              <DummyText key={i} />
            ))}
          </div>

          // track when image in view
          <WithTrackingBehavior
            actionType="objectInView"
            behavior={trackInView}
          >
            <img alt="avatar" src={data.avatar} />
          </WithTrackingBehavior>

          <div>
            {[...Array(10)].map((_, i) => (
              <DummyText key={i} />
            ))}
          </div>
        </main>
      </WithTrackingBehavior>
    </TrackingSessionProvider>
  );
};
```
Compose tracking behavior for document element. actionType = user tracking event (what to track), behavior = user tracking action (when to track)
```typescript
<WithTrackingBehavior actionType="objectInView" behavior={trackInView} >
    ...
</WithTrackingBehavior>
```

### [trackingBehavior.tsx](frontend/app/trackingBehavior.tsx)
Use shared type to extend functionality of [WithTrackingBehavior.tsx](frontend/app/WithTrackingBehavior.tsx) component with making direct changes
```
type TrackingBehavior = (args: {
  ref: TrackingActionObject;
  actionType: TrackingActionType;
  trackAction: TrackingActionDispatch;
}) => void;
```
```typescript
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
```

### [analytics/page.tsx](frontend/app/analytics/page.tsx)
Pre-rendered analytics page with metric data from analytics service
```typescript
const getAnalytics = async () => {
  const res = await fetch(process.env.ANALYTICS_SERVICE_URL, {
    next: { revalidate: 60 },
  });

  if (res.status !== 200) {
    return null;
  }

  return res.json();
};

const Page = async () => {
  const analytics = await getAnalytics();

  return (
    ...
  );
```
