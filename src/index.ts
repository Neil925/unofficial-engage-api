import express from 'express';
import EngageScraper from './handlers/ScraperHandler.js';
import { RequestBody } from './types.js';
import DatabaseHander from './handlers/DatabaseHandler.js';
import 'dotenv/config';

async function main() {
    const app = express();
    const port = 3000;

    const scraper = new EngageScraper();
    DatabaseHander.singelton = new DatabaseHander();
    const dataHandler = DatabaseHander.singelton;

    const refresh = Number.parseInt(process.env.REFRESH_PER_DAY);

    if (!refresh)
        throw new Error(`REFRESH_PER_DAY value of ${process.env.REFRESH_PER_DAY} is invalid.`);

    if (!await dataHandler.initialize())
        throw Error("Database initilization failed.");

    console.log("Database initialized succesfully.");

    app.use(express.json()) // for parsing application/json
    app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

    app.get('/events', async (req, res) => res.send(await dataHandler.queryEvents(req.body)));

    app.param('club', (req, res, next, value) => {
        req.club = value;
        next();
    });

    app.get('/:club/events', async (req, res) => res.send(await dataHandler.queryEvents(req.body, req.club)));

    app.get('/:club/members', async (req, res) => res.send("Work in progres"));

    app.listen(port, () => console.log(`Unoffical Engage API now running on port ${port}.`));

    console.log("Running first check.");
    let data = await scraper.getEvents({});
    await dataHandler.insertEvents(data);
    console.log("First check ran succesfully.");

    setInterval(async () => {
        console.log("Interval check started.");
        await scraper.getEvents({});
    }, (1000 * 60 * 60 * 24) / refresh);
}

main();