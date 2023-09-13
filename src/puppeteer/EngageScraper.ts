import puppeteer from 'puppeteer';
import { EventData, RequestBody } from '../types.js';

export default class EngageScraper {
    browser: puppeteer.Browser;
    page: puppeteer.Page;
    url = "https://valenciacollege.campuslabs.com";

    public async initialize(): Promise<boolean> {
        try {
            this.browser = await puppeteer.launch({ headless: true });
            this.page = await this.browser.newPage();
            console.log("Engage scraper intialized succesfully.");
            return true;
        } catch (error) {
            console.error(`Scraper initialization failed: ${error}`);
            return false;
        }
    }

    public async getEvents(req: RequestBody, club?: string) {
        if (club)
            await this.page.goto(`${this.url}/engage/organization/${club}/events`);
        else
            await this.page.goto(`${this.url}/engage/events`);

        await this.page.waitForSelector('a');

        return this.collectEventdata();
    }

    private async collectEventdata() {
        const elements = await this.page.$$("a");
        var result: EventData[] = [];

        for (const element of elements) {
            let href = await element.evaluate(x => x.href);


            if (!href.includes("/event/"))
                continue;

            let id = Number.parseInt(href.match(/(?<=event\/).*/gm)[0]);

            let imageSelector = await element.$("aria/Image Uploaded for Event Cover Photo");

            let img =
                await imageSelector?.evaluate(x => (x as HTMLDivElement)
                    .style.backgroundImage.match(/(?<=url\(\")(.*)(?=\"\))/gm)[0])
                ?? null;

            let title = await element.$eval("h3", x => x.textContent);

            let svgs = await element.$$("svg");
            let when = await svgs[0].evaluate(x => x.parentElement.textContent);

            let dateString = when
                .split(", ")[1]
                .replace("at", new Date().getFullYear().toString())
                .replace("AM", " AM")
                .replace("PM", " PM");

            let date = Date.parse(dateString);
            let location = await svgs[1].evaluate(x => x.parentElement.textContent);

            let club: string;

            if (svgs.length == 3)
                club = "Miltiple Hosts";
            else
                club = await element.$eval("img", x => x.parentElement.lastChild.textContent);

            let newData: EventData = {
                id: id,
                img: img,
                title: title,
                date: date,
                location: location,
                club: club
            }

            console.debug(newData);
            result.push(newData);
        }

        return result;
    }
}