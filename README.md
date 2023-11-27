# The Unofficial Engage API
---
## Description:
The Unofficial Engage API provides a way to pull event data from the Engage website without having to use Engage's developer API. The API can only show events that are public and accessible to anyone. It accomplishes this by scraping the publicly available data from the Engage website. All information pulled from the Engage website is then stored in a SQLite Database.

### Features:
1. Pull all visible events from Engage for all clubs and groups.
2. Pull all visible events from Engage for a specific club or group.
3. Set an interval to automatically refresh and pull new events from Engage.

### Installation:
To install the Unofficial Engage API, follow these steps:
1. Clone the repository: `git clone https://github.com/Neil925/unofficial-engage-api`
2. Install dependencies: `npm install`
3. Set up the required configuration; use the `example.env` to set up your env file.

### Configurations:
The Unofficial Engage API can be configured with the `.env` file. Use the `example.env` provided to configure your environment.

- `REFRESH_PER_DAY` - Number of times the scraper refreshes per day. Configure this value to control the interval for pulling new events.

### Interval:
The interval is used to determine when the scraper refreshes and pulls all new events posted on the Engage website. The number of refreshes that happen per day can be configured in the `.env`.

### API Routes:
#### `/prep/events`
- **METHOD:** POST
- **Description:** Run the scraper and collect all events from all clubs and groups, then store this information in the database.

#### `/prep/:club/events`
- **Method:** POST
- **Description:** Run the scraper and collect all events from a specific club or group, then store this information in the database.

#### `/events`
- **Method:** GET
- **Description:** Retrieve all events stored in the database. Note that this route will NOT filter between past and future events; users need to handle that themselves with the request body.

#### `/:club/events`
- **Method:** GET
- **Description:** Retrieve all events stored in the database that are related to the specified club. Note that this route will NOT filter between past and future events; users need to handle that themselves with the request body.

### Data Format & Structure:
The API returns event data in JSON format, and the structure is as follows:
- `id`: a number representing the ID in the database.
- `title`: a string representing the title of the event.
- `date`: the date of the event.
- `location`: a string representing the location of the event.
- `img`: a string representing a link to the image of the event.
- `clubs`: an array that holds information on the club(s) hosting the event.
