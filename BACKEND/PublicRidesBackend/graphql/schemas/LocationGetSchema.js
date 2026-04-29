const { buildSchema } = require("graphql")

/*
    This is the schema for the location get request
    key SERIAL PRIMARY KEY,
    id TEXT NOT NULL,
    sessionId TEXT,
    time TIMESTAMPTZ NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    speed DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    altitude DOUBLE PRECISION,
    altitudeAccuracy DOUBLE PRECISION,
    bearing DOUBLE PRECISION,
    battery DOUBLE PRECISION
*/

const getRecentLocationsSchema = buildSchema(`
  type Location {
    id: String!
    time: String!
    latitude: Float!
    longitude: Float!
    speed: Float
    accuracy: Float
    altitude: Float
    altitudeAccuracy: Float
    bearing: Float
    heading: Float
    battery: Float
    engineOn: Boolean
    activity: String
  }

  type CompressedLocation {
    sessionId: String
    sessionName: String
    startTime: String
    endTime: String
    data: [[Int]]
    simdata: [[Int]]
    splittedSessions: [[Float]]
    sessionTypes: [Int]
    dataBase64: String
  }

  type Query {
    getRecentLocations(deviceId: String!, deviceImei: String, sessionId: String, startTime: Float!, endTime: Float!): LocationsResult!
  }

  type LocationsResult {
    raw: [Location]!
    compressed: [CompressedLocation]!
  }
`)

module.exports = { getRecentLocationsSchema };