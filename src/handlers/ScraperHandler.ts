import puppeteer from 'puppeteer';
import { Club, EventData, RequestBody } from '../types.js';
import DatabaseHander from './DatabaseHandler.js';
import delay from '../helpers/delay.js';

export default class ScraperHandler {
    //Instance of a puppeteer browser.
    private browser: puppeteer.Browser;
    //The main Browser Page
    private page: puppeteer.Page;
    private readonly url = "https://valenciacollege.campuslabs.com/engage";
    
    //A shared instance of itself for convinient access throughout the project.
    public static singelton: ScraperHandler;

    //Starts the puppeteer browser
    public async startBrowser() {
        try {
            this.browser = await puppeteer.launch({ headless: "new" });
            this.page = await this.browser.newPage();
        } catch (error) {
            throw new Error(`Scraper initialization failed: ${error}`);
        }

        console.log("Engage scraper started succesfully.");
    }

    //Closes the puppeteer browser
    public async closeBrowser() {
        await this.browser.close();
        this.page = null;
    }

    //Gets the events requested or the generic future events that auto refresh.
    public async getEvents(req: RequestBody, club?: string) {
        console.log("Getting events...");

        if (!this.page)
            await this.startBrowser();

        if (!club) {
            await this.page.goto(`${this.url}/events`);

            await this.page.waitForSelector('button > div > div > span');

            while (await this.page.$("button > div > div > span")) {
                try {
                    await this.page.click("button > div > div > span");
                } catch (error) {
                    break;
                }
            }
        }
        else {
            await this.page.goto(`${this.url}/organization/${club}/events`);
            await this.page.waitForSelector('button > div > div > span');

            if (req.pastEvents) {
                await this.page.click("button > div > div > span");
                await delay(1500);
            }
        }

        let result: EventData[] = [];

        for (const id of await this.needsCheck()) {
            result.push(await this.checkEvent(id));
            console.log(`Event ${id} created.`);
        }

        return result;
    }

    //Filters for the event html elements that actually need to be checked.
    private async needsCheck() {
        const elements = await this.page.$$("a");
        const ids = await DatabaseHander.singelton.getIds();
        let result: number[] = [];

        for (const element of elements) {
            let href = await element.evaluate(x => x.href);

            if (!href.includes("/event/"))
                continue;

            let id = Number.parseInt(href.match(/(?<=event\/).*/gm)[0]);

            if (!ids.some(x => x.id == id))
                result.push(id);
        }

        return result;
    }

    //Collects data from a single event.
    private async checkEvent(id: number): Promise<EventData> {
        var event: EventData = {
            id: id,
            title: null,
            date: null,
            location: null,
            img: null,
            clubs: []
        }

        await this.page.goto(`${this.url}/event/${id}`);
        await this.page.waitForSelector('h1');
        await this.page.waitForSelector('strong');

        event.title = await this.page.$eval('h1', x => x.textContent);

        let strong = await this.page.$$('strong');

        event.date = new Date(
            Date.parse(await strong[0].evaluate(x => x.parentElement
                .querySelector('p').textContent.replace('at ', '').replace(' to', ''))));

        event.location = await strong[1].evaluate(x => x.parentElement.querySelector('p').textContent);

        let imageSelector = await this.page.$("aria/Image Uploaded for Event Cover Photo");

        event.img = await imageSelector?.evaluate(x => (x as HTMLDivElement)
            .style.backgroundImage.match(/(?<=url\(\")(.*)(?=\"\))/gm)[0])
            ?? null;

        for (const el of await this.page.$$('a')) {
            let href = await el.evaluate(x => x.href);

            if (!href.includes('organization'))
                continue;

            let club: Club = {
                club_id: href.match(/(?<=organization\/).*/gm)[0],
                club_name: await el.$eval('h3', x => x.textContent.trim())
            };

            event.clubs.push(club);
        }

        return event;
    }
}