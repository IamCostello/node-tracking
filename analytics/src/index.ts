import cors from "cors";
import express from "express";
import { MongoClient } from "mongodb";
import morgan from "morgan";
import cron from "node-cron";
import { uniqueUsersWithObjectInViewMetric } from "./metrics/uniqueUsersWithObjectInView.metric";
import { uniqueUsersMetric } from "./metrics/uniqueUsers.metric";
import memjs from "memjs";

const ANALYTICS_CACHE_URI = process.env.ANALYTICS_CACHE_URI || "";
const ANALYTICS_DATA_DB_URI = process.env.ANALYTICS_DATA_DB_URI || "";
const TRACKING_DATA_DB_URI = process.env.TRACKING_DATA_DB_URI || "";
const CACHE_KEY = "metrics";

const app = express();

const trackingDataClient = new MongoClient(TRACKING_DATA_DB_URI);
const analyticsDataClient = new MongoClient(ANALYTICS_DATA_DB_URI);
const cacheClient = memjs.Client.create(ANALYTICS_CACHE_URI);

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET"],
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  cacheClient.get(CACHE_KEY, (err, value) => {
    if (err) {
      res.status(500).send();
      return;
    }

    if (value) {
      res.send(JSON.parse(value.toString()));
      return;
    }

    res.status(503).send({ message: "No data available" });
  });
});

cron.schedule("*/1 * * * *", async () => {
  try {
    const trackingData = trackingDataClient
      .db("tracking-service-data")
      .collection("trackingsessions");

    const res = await Promise.all([
      uniqueUsersMetric(trackingData),
      uniqueUsersWithObjectInViewMetric(trackingData),
    ]);

    const metrics = {
      timeStamp: new Date().toISOString(),
      uniqueUsers: res[0],
      uniqueUsersWithObjectInView: res[1],
    };

    await analyticsDataClient
      .db("analytics-service-data")
      .collection("metrics")
      .insertOne(metrics);

    cacheClient.set(CACHE_KEY, JSON.stringify(metrics));
  } catch (error) {
    console.error("Failed to calculate metrics", error);
  }
});

const main = async () => {
  try {
    await trackingDataClient.connect();
    await analyticsDataClient.connect();

    app.listen(8081, () => console.log("Server is running on port 8081"));
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
};

main().catch(console.error);
