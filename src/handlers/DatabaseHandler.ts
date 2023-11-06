import sqlite3 from 'sqlite3';
import { Database, ISqlite, open } from 'sqlite';
import sqlTemplateString from 'sql-template-strings';
import { EventData, RequestBody } from '../types.js';
import fs from 'fs';

const SQL = sqlTemplateString.default;

export default class DatabaseHander {
    public static singelton: DatabaseHander;

    db: Database<sqlite3.Database, sqlite3.Statement>;
    protected dataSql = fs.readFileSync('EngageDbFE.sql').toString();

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

            this.db.exec(this.dataSql);
        } catch (error) {
            console.error(error);
            return false;
        }

        return true;
    }

    public async insertEvents(data: EventData[]) {
        console.log(`Inserting ${data.length} events to database.`);
        for (const event of data) {
            await this.db.run(SQL`INSERT INTO events ("id", "title", "date", "location", "img") VALUES (${event.id}, ${event.title}, ${event.date} , ${event.location}, ${event.img})`);

            for (const club of event.clubs) {
                if (!await this.db.get(SQL`SELECT * FROM clubs WHERE club_id = ${club.club_id}`)) {
                    await this.db.run(SQL`INSERT INTO clubs ("club_id", "club_name") VALUES (${club.club_id}, ${club.club_name})`);
                }

                await this.db.run(SQL`INSERT INTO events_has_clubs ("events_id", "club_id") VALUES (${event.id}, ${club.club_id})`);
            }
        }
    }

    public async queryEvents(request: RequestBody, club?: string): Promise<EventData[]> {
        let result = await this.db.all("SELECT * FROM EVENTS_VIEW");

        for (const event of result)
            event.clubs = JSON.parse(event.clubs);

        return result as EventData[];
    }

    public async getIds(): Promise<any[]> {
        return await this.db.all(`SELECT id FROM events`);
    }
}