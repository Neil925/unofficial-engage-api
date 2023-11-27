import express from 'express';
import 'dotenv/config';
import EngageScraper from './handlers/ScraperHandler.js';
import DatabaseHander from './handlers/DatabaseHandler.js';
import TaskQueueHandler from './handlers/TaskQueueHandler.js';

//The application starts here. All needed variables are initialized and API paths defined.
async function main() {
    const app = express();
    const port = 3000;

    //Initialize Handlers
    EngageScraper.singelton = new EngageScraper();
    const scraper = new EngageScraper();

    TaskQueueHandler.singelton = new TaskQueueHandler();
    const taskQueue = TaskQueueHandler.singelton;

    DatabaseHander.singelton = new DatabaseHander();
    const dataHandler = DatabaseHander.singelton;
    //End Intiialize Handlers

    const refresh = Number.parseInt(process.env.REFRESH_PER_DAY);

    if (!refresh || (refresh != -1 && (refresh < 0 || refresh > 48)))
        throw new Error(`REFRESH_PER_DAY value of ${process.env.REFRESH_PER_DAY} is invalid.`);

    if (!await dataHandler.initialize())
        throw Error("Database initilization failed.");

    console.log("Database initialized succesfully.");

    app.use(express.json()) // for parsing application/json
    app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

    app.get('/events', async (req, res) => {
        if (req.pastEvents) {
            res.status(500).send("Past event checking is only valid for club routes!");
            return;
        }

        res.send(await dataHandler.queryEvents(req.body))
    });

    app.param('club', (req, res, next, value) => {
        req.club = value;
        next();
    });

    app.get('/:club/events', async (req, res) => res.send(await dataHandler.queryEvents(req.body, req.club)));

    app.get('/:club/members', async (req, res) => res.send("Discontinued"));

    app.post('/prep/events', async (req, res) => {
        if (req.body.pastEvents) {
            res.status(500).send("Past event checking is only valid for club routes!");
            return;
        }

        res.send("Event data collection will now start.");
        console.log("Running events prep.");

        taskQueue.addToQueue(async () => {
            let data = await scraper.getEvents(req.body);
            await dataHandler.insertEvents(data);
        });
    });

    app.post('/prep/:club/events', async (req, res) => {
        res.send("Club event data collection will now start.");
        console.log("Running club events prep.");

        if (req.body.pastEvents)
            console.log(`Checking for ${req.club}'s past events.`);

        taskQueue.addToQueue(async () => {
            let data = await scraper.getEvents(req.body, req.club);
            await dataHandler.insertEvents(data);
        });
    });

    app.listen(port, () => console.log(`Unoffical Engage API now running on port ${port}.`));

    if (refresh == -1)
        return;

    setInterval(async () => {
        console.log("Interval check started.");
        await scraper.getEvents({});
    }, (1000 * 60 * 60 * 24) / refresh);
}

main();