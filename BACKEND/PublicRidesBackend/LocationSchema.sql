


-- Table to manage tracking sessions and their status 

CREATE TABLE "sessions"(
    "key" SERIAL PRIMARY KEY,
    "id" TEXT NOT NULL, -- Device ID
    "sessionId" TEXT NOT NULL, -- DD/MM/YYYY|DeviceID
    "sessionType" TEXT, -- "TEMP" or "REAL" -> TEMP for GPS hardware
    "sessionName" TEXT,
    "startTime" TIMESTAMPTZ, -- start time of the session 
    "endTime" TIMESTAMPTZ, -- endtime of the session
    "deviceType" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT FALSE,
    "status" TEXT NOT NULL DEFAULT 'live' CHECK ("status" IN ('live', 'completed')),
    "processRetryCount" INTEGER NOT NULL DEFAULT 0
);

-- Table to manage location data

CREATE TABLE "liveLocations" (
    "key" SERIAL,
    "id" TEXT NOT NULL, -- Device ID
    "sessionId" TEXT,
    "time" TIMESTAMPTZ NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL CHECK ("latitude" >= -90 AND "latitude" <= 90),
    "longitude" DOUBLE PRECISION NOT NULL CHECK ("longitude" >= -180 AND "longitude" <= 180),
    "speed" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "altitudeAccuracy" DOUBLE PRECISION,
    "bearing" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION DEFAULT NULL,
    "battery" DOUBLE PRECISION DEFAULT NULL,
    "isCharging" BOOLEAN DEFAULT NULL,
    "engineOn" BOOLEAN DEFAULT NULL,
    "activity" TEXT DEFAULT NULL
);


-- Table to manage completed location data

CREATE TABLE "completedLocations"(
    "key" SERIAL PRIMARY KEY,
    "id" TEXT NOT NULL, -- Device ID
    "processingTime" INTEGER,
    "processedOn" TIMESTAMPTZ,
    "sessionId" TEXT,
    "startTime" TIMESTAMPTZ,
    "endTime" TIMESTAMPTZ,
    "data" BYTEA[],
    "dataBase64" TEXT NOT NULL DEFAULT '',
    "simdata" BYTEA[] NOT NULL DEFAULT '{}',
    "compressionScheme" VARCHAR(255) NOT NULL DEFAULT 'lz4',
    "splittedSessions"  JSONB NOT NULL DEFAULT '[]',
    "sessionTypes"  JSONB NOT NULL DEFAULT '[]',
    "mapMatched" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE "distanceStats"(
    "key" SERIAL PRIMARY KEY,
    "id" TEXT NOT NULL, -- Device ID
    "date" DATE,
    "distances" JSONB NOT NULL DEFAULT '[]',
    UNIQUE ("id", "date")
);

-- Convert the 'locations' table into a hypertable for efficient time-series data management
CREATE UNIQUE INDEX liveLocations_key_time_unique ON "liveLocations" ("key", "time");
SELECT create_hypertable('locations', 'time');
SELECT set_chunk_time_interval('"liveLocations"', INTERVAL '2 hours');
