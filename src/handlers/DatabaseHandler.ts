import { PrismaClient } from "../../generated/prisma/index.js";
import type { EventData, RequestBody } from "../types.ts";

/**
 * DatabaseHandler class for managing interactions with SQLite database.
 */
export default class DatabaseHander {
  prisma: PrismaClient | undefined;
  static singelton: DatabaseHander;
  /**
   * Creates the .sql file if it does not exist already. The database is constructed from the
   * EngageDbFE.sql file contents stored in the dataSql variable.
   * If the database already exists, then it will just open it for reading and writing.
   * @returns {boolean} True if initialization is successful, false otherwise.
   */
  public initialize(): boolean {
    try {
      this.prisma = new PrismaClient();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  /**
   * Inserts events into the database in bulk.
   * @param {EventData[]} data - An array of EventData objects to be inserted.
   */
  public async insertEvents(data: EventData[]) {
    if (!this.prisma) {
      throw new Error();
    }

    console.log(`Inserting ${data.length} events to database.`);
    for (const event of data) {
      const timestamp = Math.floor(event.date.getTime() / 1000); // Fix: getTime(), not getUTCSeconds()

      await this.prisma.events.upsert({
        where: { id: event.id },
        update: {},
        create: {
          id: event.id,
          title: event.title,
          event_date: timestamp,
          location: event.location,
          img: event.img,
        },
      });

      for (const club of event.clubs) {
        await this.prisma.clubs.upsert({
          where: { club_id: club.club_id },
          update: {},
          create: { club_id: club.club_id, club_name: club.club_name },
        });

        await this.prisma.events_has_clubs.upsert({
          where: {
            events_id_club_id: {
              events_id: event.id,
              club_id: club.club_id,
            },
          },
          update: {},
          create: {
            club_id: club.club_id,
            events_id: event.id,
          },
        });
      }
    }
  }

  /**
   * Returns events from the database to be served to the user.
   * @param {RequestBody} request - The request body.
   * @param {string} [club] - The optional club parameter.
   * @returns {Promise<EventData[]>} An array of event data.
   */
  public async queryEvents(
    request: RequestBody,
    club?: string,
  ): Promise<EventData[]> {
    const { after, before } = request;
    const events = await this.prisma!.events.findMany({
      where: {
        AND: [
          after ? { event_date: { gte: after } } : {},
          before ? { event_date: { lte: before } } : {},
          club ? { events_has_clubs: { some: { club_id: club } } } : {},
        ],
      },
      include: { events_has_clubs: { include: { clubs: true } } },
      orderBy: { event_date: "desc" },
    });

    const result: EventData[] = events.map((event) => ({
      id: event.id,
      title: event.title,
      date: new Date(event.event_date * 1000),
      location: event.location,
      img: event.img,
      clubs: event.events_has_clubs.map((rel) => ({
        club_id: rel.club_id,
        club_name: rel.clubs.club_name ?? undefined,
      })),
    } as EventData));

    return result;
  }

  /**
   * Gets only the IDs of all events. Used to filter for already collected events.
   * @returns {Promise<any[]>} An array of event IDs.
   */
  public async getIds(): Promise<number[]> {
    let res = await this.prisma!.events.findMany({ select: { id: true } });
    return res.map((x) => x.id);
  }
}
