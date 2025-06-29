import express from "express";
import swaggerUi from "swagger-ui-express";
import cors from "cors";

import swaggerDocument from "../swagger.json" with { type: "json" };

import EngageScraper from "./handlers/ScraperHandler.js";
import DatabaseHander from "./handlers/DatabaseHandler.js";
import TaskQueueHandler from "./handlers/TaskQueueHandler.js";

const SECRET_KEY = process.env.SECRET_KEY;

/**
 * The main function that starts the application.
 * Initializes all necessary variables and defines API paths.
 */
async function main() {
  const app = express();
  const port = process.env.PORT ?? "3000";

  //Initialize Handlers
  EngageScraper.singelton = new EngageScraper();
  const scraper = EngageScraper.singelton;

  TaskQueueHandler.singelton = new TaskQueueHandler();
  const taskQueue = TaskQueueHandler.singelton;

  DatabaseHander.singelton = new DatabaseHander();
  const dataHandler = DatabaseHander.singelton;
  //End Intiialize Handlers

  const refresh = process.env.REFRESH_PER_DAY
    ? Number.parseInt(process.env.REFRESH_PER_DAY)
    : -1;

  if (!refresh || (refresh != -1 && (refresh < 0 || refresh > 48))) {
    throw new Error(
      `REFRESH_PER_DAY value of ${process.env.REFRESH_PER_DAY} is invalid.`,
    );
  }

  if (!dataHandler.initialize()) {
    throw Error("Database initilization failed.");
  }

  console.log("Database initialized succesfully.");

  app.use(express.json()); // for parsing application/json
  app.use(cors());
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get("/", async (_req, res) => {
    res.send("Hello!");
  });

  /**
   * Express route to return all events in the database.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  app.get("/events", async (req: any, res) => {
    if (req.pastEvents) {
      res.status(500).send(
        "Past event checking is only valid for club routes!",
      );
      return;
    }

    res.send(await dataHandler.queryEvents(req.params));
  });

  app.param("club", (req: any, _res, next, value) => {
    req.club = value;
    next();
  });

  /**
   * Express route to retrieve all events for a specific club.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  app.get(
    "/:club/events",
    async (req: any, res) => {
      res.send(await dataHandler.queryEvents(req.params, req.club));
    },
  );

  /**
   * Express route to retrieve all members for a specific club. (discontinued)
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  app.get("/:club/members", async (_req, res) => {
    res.send("Discontinued");
  });

  /**
   * Express route to run scraper and store events in database.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  app.post("/prep/events", verifyBearerToken, async (req: any, res) => {
    if (req.pastEvents) {
      res.status(500).send(
        "Past event checking is only valid for club routes!",
      );
      return;
    }

    res.send("Event data collection will now start.");
    console.log("Running events prep.");

    taskQueue.addToQueue(async () => {
      let data = await scraper.getEvents(req.body);
      await dataHandler.insertEvents(data);
    });
  });

  /**
   * Express route to run scraper and store events in database for a specific club.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  app.post("/prep/:club/events", verifyBearerToken, async (req: any, res) => {
    res.send("Club event data collection will now start.");
    console.log("Running club events prep.");

    if (req.pastEvents) {
      console.log(`Checking for ${req.club}'s past events.`);
    }

    taskQueue.addToQueue(async () => {
      let data = await scraper.getEvents(req.body, req.club);
      await dataHandler.insertEvents(data);
    });
  });

  /**
   * Starts the express application.
   */
  app.listen(
    port,
    () => console.log(`Unoffical Engage API now running on port ${port}.`),
  );

  if (refresh == -1) {
    return;
  }

  /**
   * Sets interval for scraper refresh.
   */
  setInterval(async () => {
    console.log("Interval check started.");
    await scraper.getEvents({});
  }, (1000 * 60 * 60 * 24) / refresh);
}

function verifyBearerToken(
  req,
  res,
  next,
) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header",
    });
  }

  const token = authHeader.split(" ")[1];

  if (token !== SECRET_KEY) {
    return res.status(403).json({ error: "Invalid token" });
  }

  next();
}

main();
