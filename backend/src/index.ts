import express, { Request } from "express";
import routes from "./server/routes";
import morgan from "morgan";
import cors from "cors";
import mongoose from "mongoose";

const app = express();

morgan.token("body", (req: Request) => {
  return JSON.stringify(req.body);
});
const logger = morgan(":method :url :body :status :response-time ms");

app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["POST"],
  })
);

app.use("/api", routes);

const TRACKING_DATA_DB_URI = process.env.TRACKING_DATA_DB_URI as string;

mongoose.connect(TRACKING_DATA_DB_URI).catch((err) => {
  console.error(err);
  process.exit(1);
});

app.listen(8080, () => console.log("Server is running on port 8080"));
