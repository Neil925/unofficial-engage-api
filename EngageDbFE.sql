-- -----------------------------------------------------
-- Table `clubs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `clubs` (
  `club_id` VARCHAR(255) NOT NULL,
  `club_name` VARCHAR(255) NULL,
  PRIMARY KEY (`club_id`));


-- -----------------------------------------------------
-- Table `events`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `events` (
  `id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `event_date` DATETIME(255) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `img` VARCHAR(255) NULL,
  PRIMARY KEY (`id`));
  
CREATE UNIQUE INDEX IF NOT EXISTS `id_UNIQUE` on `events` (`id` ASC);


-- -----------------------------------------------------
-- Table `events_has_clubs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `events_has_clubs` (
  `events_id` INT NOT NULL,
  `club_id` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`events_id`, `club_id`),
  CONSTRAINT `fk_events_has_clubs_events`
    FOREIGN KEY (`events_id`)
    REFERENCES `events` (`id`),
  CONSTRAINT `fk_events_has_clubs_clubs1`
    FOREIGN KEY (`club_id`)
    REFERENCES `clubs` (`club_id`));

CREATE INDEX IF NOT EXISTS `fk_events_has_clubs_clubs1_idx` on `events_has_clubs` (`club_id` ASC);
CREATE INDEX IF NOT EXISTS `fk_events_has_clubs_events_idx` on `events_has_clubs` (`events_id` ASC);

-- -----------------------------------------------------
-- Table `club_roster`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `club_roster` (
  `club_id` VARCHAR(255) NULL,
  `name` VARCHAR(45) NOT NULL,
  `type` VARCHAR(45) NOT NULL,
  `position` VARCHAR(45) NULL,
  PRIMARY KEY (`club_id`),
  CONSTRAINT `fk_club_roster_clubs1`
    FOREIGN KEY (`club_id`)
    REFERENCES `clubs` (`club_id`));

CREATE VIEW EVENTS_VIEW AS
SELECT events.*,
       json_group_array(json_object('club_id', clubs.club_id, 'club_name', clubs.club_name)) AS clubs
FROM events
LEFT JOIN events_has_clubs AS e ON e.events_id = events.id
LEFT JOIN clubs ON clubs.club_id = e.club_id
GROUP BY events.id;
