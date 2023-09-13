import express from 'express';
import EngageScraper from './puppeteer/EngageScraper.js';
import { RequestBody } from './types.js';

async function main() {
    const app = express();
    const port = 3000;

    var scraper = new EngageScraper();

    if (!await scraper.initialize())
        throw Error("Initilization failed.");

    app.use(express.json()) // for parsing application/json
    app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

    // app.get('/', async (req, res) => {
    //     res.send("Hello Wrold!");
    // });

    app.get('/events', async (req, res) => res.send(await scraper.getEvents(req.body as RequestBody)));

    app.param('club', (req, res, next, value) => {
        req.club = value;
        next();
    });

    app.get('/:club/events', async (req, res) => res.send(await scraper.getEvents(req.body as RequestBody, req.club)));

    app.get('/:club/members', async (req, res) => res.send("Work in progres"));

    app.listen(port, () => console.log(`Unoffical Engage API now running on port ${port}.`));
}


main();