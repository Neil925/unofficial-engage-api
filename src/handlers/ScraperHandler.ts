import puppeteer from "puppeteer";
import DatabaseHander from "./DatabaseHandler.js";
import delay from "../helpers/delay.js";
import type { Club, EventData, RequestBody } from "../types.js";

/**
 * ScraperHandler class for pulling events from Engage using Puppeteer.
 */
export default class ScraperHandler {
  /**
   * Instance of a Puppeteer browser.
   * @type {puppeteer.Browser}
   */
  private browser: puppeteer.Browser | undefined;
  /**
   * The main browser page.
   * @type {puppeteer.Page}
   */
  private page: puppeteer.Page | undefined;
  /**
   * The base URL for the Engage website.
   * @type {string}
   */
  private readonly url = "https://valenciacollege.campuslabs.com/engage";

  /**
   * A shared instance of ScraperHandler for convenient access throughout the project.
   * @type {ScraperHandler}
   */
  public static singelton: ScraperHandler;

  /**
   * Starts the Puppeteer browser.
   * @throws {Error} Throws an error if Scraper initialization fails.
   */
  public async startBrowser() {
    try {
      this.browser = await puppeteer.launch({ headless: true });
      this.page = await this.browser.newPage();
    } catch (error) {
      throw new Error(`Scraper initialization failed: ${error}`);
    }

    console.log("Engage scraper started succesfully.");
  }

  /**
   * Closes the Puppeteer browser.
   */
  public async closeBrowser() {
    if (!this.page || !this.browser) {
      return;
    }

    await this.browser.close();
    this.page = undefined;

    console.log("Browser succesfully closed.");
  }

  /**
   * Gets the events requested or the generic future events that auto refresh.
   * @param {RequestBody} req - The request body.
   * @param {string} [club] - The optional club parameter.
   * @returns {Promise<EventData[]>} An array of event data.
   */
  public async getEvents(
    req: RequestBody,
    club?: string,
  ): Promise<EventData[]> {
    if (!this.page) {
      await this.startBrowser();
    }

    if (!this.page) {
      throw new Error();
    }

    console.log("Getting events...");

    if (!club) {
      await this.page.goto(`${this.url}/events`);

      await this.page.waitForSelector("button > div > div > span");

      while (await this.page.$("button > div > div > span")) {
        try {
          await this.page.click("button > div > div > span");
        } catch (error) {
          break;
        }
      }
    } else {
      await this.page.goto(`${this.url}/organization/${club}/events`);
      await this.page.waitForSelector("button > div > div > span");

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

  /**
   * Filters for the event HTML elements that actually need to be checked.
   * @returns {Promise<number[]>} An array of event IDs that need to be checked.
   * @private
   */
  private async needsCheck(): Promise<number[]> {
    const elements = await this.page!.$$("a");
    const ids = await DatabaseHander.singelton.getIds();
    let result: number[] = [];

    for (const element of elements) {
      let href = await element.evaluate((x) => x.href);

      if (!href.includes("/event/")) {
        continue;
      }

      let id = Number.parseInt(href.match(/(?<=event\/).*/gm)![0]);

      if (!ids.some((x) => x == id)) {
        result.push(id);
      }
    }

    return result;
  }

  /**
   * Collects data from a single event.
   * @param {number} id - The ID of the event.
   * @returns {Promise<EventData>} The event data.
   * @private
   */
  private async checkEvent(id: number): Promise<EventData> {
    if (!this.page) {
      throw new Error();
    }

    var event: any = {
      id: id,
      title: null,
      date: null,
      location: null,
      img: null,
      clubs: [],
    };

    await this.page.goto(`${this.url}/event/${id}`);
    await this.page.waitForSelector("h1");
    await this.page.waitForSelector("strong");

    event.title = await this.page.$eval("h1", (x) => x.textContent);

    let strong = await this.page.$$("strong");

    event.date = new Date(
      Date.parse(
        await strong[0].evaluate((x) =>
          x.parentElement!.querySelector("p")!.textContent!.replace("at ", "")
            .replace(
              " to",
              "",
            )
        ),
      ),
    );

    event.location = await strong[1].evaluate((x) =>
      x.parentElement.querySelector("p").textContent
    );

    let imageSelector = await this.page.$(
      "aria/Image Uploaded for Event Cover Photo",
    );

    event.img = await imageSelector?.evaluate((x) =>
      (x as HTMLDivElement)
        .style.backgroundImage.match(/(?<=url\(\")(.*)(?=\"\))/gm)[0]
    ) ??
      null;

    for (const el of await this.page.$$("a")) {
      let href = await el.evaluate((x) => x.href);

      if (!href.includes("organization")) {
        continue;
      }

      let club: Club = {
        club_id: href.match(/(?<=organization\/).*/gm)[0],
        club_name: await el.$eval("h3", (x) => x.textContent.trim()),
      };

      event.clubs.push(club);
    }

    return event;
  }
}
