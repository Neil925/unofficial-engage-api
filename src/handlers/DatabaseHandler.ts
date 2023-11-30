import sqlite3 from 'sqlite3';
import { Database, ISqlite, open } from 'sqlite';
import sqlTemplateString from 'sql-template-strings';
import { EventData, RequestBody } from '../types.js';
import fs from 'fs';

const SQL = sqlTemplateString.default;

/**
 * DatabaseHandler class for managing interactions with SQLite database.
 */
export default class DatabaseHander {
    /**
     * A shared instance of DatabaseHandler for convenient access throughout the project.
     * @type {DatabaseHander}
     */
    public static singelton: DatabaseHander;

    /**
     * The SQLite database.
     * @type {Database<sqlite3.Database, sqlite3.Statement>}
     */
    private db: Database<sqlite3.Database, sqlite3.Statement>;
    /**
     * The text content of the SQL file that automatically constructs the data structure.
     * @type {string}
     */
    protected dataSql = fs.readFileSync('EngageDbFE.sql').toString();

    /**
     * Creates the .sql file if it does not exist already. The database is constructed from the
     * EngageDbFE.sql file contents stored in the dataSql variable.
     * If the database already exists, then it will just open it for reading and writing.
     * @returns {Promise<boolean>} True if initialization is successful, false otherwise.
     */
    public async initialize(): Promise<boolean> {
        try {
            if (fs.existsSync('./database.db')) {
                this.db = await open({
                    filename: 'database.db',
                    driver: sqlite3.Database
                });

                return true;
            }

            new sqlite3.Database('database.db', err => {
                if (err)
                    console.error(`Database creation failed: ${err}`);
            });

            this.db = await open({
                filename: 'database.db',
                driver: sqlite3.Database
            });

            await this.db.exec(this.dataSql);
        } catch (error) {
            console.error(error);
            return false;
        }

        return true;
    }

    /**
    * Inserts events into the database in bulk.
    * @param {EventData[]} data - An array of EventData objects to be inserted.
    */
    public async insertEvents(data: EventData[]) {
        console.log(`Inserting ${data.length} events to database.`);
        for (const event of data) {
            await this.db.run(SQL`INSERT INTO events ("id", "title", "event_date", "location", "img") VALUES (${event.id}, ${event.title}, ${event.date} , ${event.location}, ${event.img})`);

            for (const club of event.clubs) {
                if (!await this.db.get(SQL`SELECT * FROM clubs WHERE club_id = ${club.club_id}`)) {
                    await this.db.run(SQL`INSERT INTO clubs ("club_id", "club_name") VALUES (${club.club_id}, ${club.club_name})`);
                }

                await this.db.run(SQL`INSERT INTO events_has_clubs ("events_id", "club_id") VALUES (${event.id}, ${club.club_id})`);
            }
        }
    }

    /**
     * Returns events from the database to be served to the user.
     * @param {RequestBody} request - The request body.
     * @param {string} [club] - The optional club parameter.
     * @returns {Promise<EventData[]>} An array of event data.
     */
    public async queryEvents(request: RequestBody, club?: string): Promise<EventData[]> {
        let query = SQL`SELECT * FROM EVENTS_VIEW`;

        if (club && request.pastEvents)
            request.before = Date.now();

        let cond = 0;

        cond += club ? 1 : 0;
        cond += request.after ? 1 : 0;
        cond += request.before ? 1 : 0;

        query.append(`${cond ? " WHERE " : ';'}`);

        if (club) {
            query.append(`EXISTS (SELECT 1 FROM json_each(clubs) WHERE json_each.value LIKE '%${club}%')`);
            query.append(cond > 1 ? ' AND ' : '');
        }

        if (request.after) {
            query.append(`event_date > ${request.after}`);
            query.append(request.before ? " AND " : ';');
        }

        if (request.before)
            query.append(`event_date < ${request.before};`);

        let result = await this.db.all(query);

        for (const event of result)
            event.clubs = JSON.parse(event.clubs);

        return result as EventData[];
    }

    /**
     * Gets only the IDs of all events. Used to filter for already collected events.
     * @returns {Promise<any[]>} An array of event IDs.
     */
    public async getIds(): Promise<any[]> {
        return await this.db.all(`SELECT id FROM events`);
    }
}