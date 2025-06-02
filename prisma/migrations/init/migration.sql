-- CreateTable
CREATE TABLE "clubs" (
    "club_id" TEXT NOT NULL PRIMARY KEY,
    "club_name" TEXT
);

-- CreateTable
CREATE TABLE "events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "event_date" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "img" TEXT
);

-- CreateTable
CREATE TABLE "events_has_clubs" (
    "events_id" INTEGER NOT NULL,
    "club_id" TEXT NOT NULL,

    PRIMARY KEY ("events_id", "club_id"),
    CONSTRAINT "events_has_clubs_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs" ("club_id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "events_has_clubs_events_id_fkey" FOREIGN KEY ("events_id") REFERENCES "events" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateIndex
CREATE UNIQUE INDEX "clubs_club_id_key" ON "clubs"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_id_key" ON "events"("id");

-- CreateIndex
CREATE INDEX "fk_events_has_clubs_events_idx" ON "events_has_clubs"("events_id");

-- CreateIndex
CREATE INDEX "fk_events_has_clubs_clubs1_idx" ON "events_has_clubs"("club_id");

