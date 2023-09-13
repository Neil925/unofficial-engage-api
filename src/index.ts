import express from 'express';
import EngageScraper from './puppeteer/EngageScraper.js';
import { RequestBody } from './types.js';
import DatabaseHander from './DatabaseHandler.js';

async function main() {
    const app = express();
    const port = 3000;

    const scraper = new EngageScraper();
    const dataHandler = new DatabaseHander();

    if (!await dataHandler.initialize())
        throw Error("Database initilization failed.");

    console.log("Database initialized succesfully.");

    app.use(express.json()) // for parsing application/json
    app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

    app.get('/events', async (req, res) => {
        // let result = await scraper.getEvents(req.body as RequestBody);
        // dataHandler.insertEvents(result);
        let result = await dataHandler.queryEvents(req);
        res.send(result);
    });

    app.param('club', (req, res, next, value) => {
        req.club = value;
        next();
    });

    app.get('/:club/events', async (req, res) => {
        res.send(await scraper.getEvents(req.body as RequestBody, req.club))
    });

    app.get('/:club/members', async (req, res) => res.send("Work in progres"));

    app.listen(port, () => console.log(`Unoffical Engage API now running on port ${port}.`));

    console.log("Running first check.");
    let data = await scraper.getEvents({});
    await dataHandler.insertEvents(data);
    console.log("First check ran succesfully.");

    // setInterval(async () => {
    //     console.log("Interval started.");
    //     await scraper.getEvents({});
    // }, 1000 * 60 * 5);
}

main();