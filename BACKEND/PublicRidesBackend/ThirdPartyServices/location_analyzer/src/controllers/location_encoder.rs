use crate::models::distance::DistanceData;
use crate::models::location::LocationDataBulk;
use chrono::{DateTime, Datelike, NaiveDateTime, Timelike, Utc};
use geoutils::Location;

use lz4_flex::compress_prepend_size;
use rmp_serde::to_vec as to_msgpack;

const MAX_TIME_DIFFERENCE: f64 = 900.0 * 1000.0; // 15 minutes in milliseconds
const TIME_CONSIDERED_PAUSE: f64 = 10.0 * 60.0 * 1000.0; // 10 minutes in milliseconds

/// Represents a session splitter for managing and splitting location data into sessions.
struct SessionSplitter {
    sessions: Vec<Vec<f64>>, // Stores the sessions as vectors of floating-point numbers.
    start_time: f64,         // The start time of the current session.
    current_index: f64,      // The current index in the session.
    session_start: f64,      // The start index of the current session.
    prev_time: f64,          // The previous time point in the session.
    current_time: f64,       // The current time point in the session.
    session_distance: f64,   // The total distance covered in the current session.
    prev_point: Vec<f64>,    // The previous geographic point in the session.
    prev_distance: f64,
    max_speed: f64,
    min_speed: f64,
    average_speed: f64,
    max_altitude: f64,
    min_altitude: f64,
    average_altitude: f64,
    session_types: Vec<i16>,

    /* Distance Calculations */
    overlapping_days_utc: Vec<String>,
    day_intervals: Vec<Vec<f64>>,

    paused: bool,
    pause_start_time: f64,
    pause_start_index: f64,
}

impl SessionSplitter {
    /// Constructs a new `SessionSplitter`.
    ///
    /// # Returns
    /// * `Self` - A new instance of `SessionSplitter`.
    pub fn new() -> Self {
        Self {
            sessions: Vec::new(),
            start_time: 0.0,
            current_index: 0.0,
            session_start: 0.0,
            prev_time: 0.0,
            current_time: 0.0,
            session_distance: 0.0,
            prev_point: Vec::new(),
            prev_distance: 0.0,
            max_speed: 0.0,
            min_speed: f64::MAX,
            average_speed: 0.0,
            max_altitude: 0.0,
            min_altitude: f64::MAX,
            average_altitude: 0.0,
            /*
               1  -- IDLE
               0  -- Travel
            */
            session_types: Vec::new(),
            overlapping_days_utc: Vec::new(),
            day_intervals: vec![vec![0.0; 24]],

            paused: false,
            pause_start_time: 0.0,
            pause_start_index: 0.0,
        }
    }

    /// Adds a new point to the current session or starts a new session if necessary.
    ///
    /// # Arguments
    /// * `time` - The time of the current point.
    /// * `lat` - The latitude of the current point.
    /// * `lon` - The longitude of the current point.
    /// * `speed` - The speed of the current point.
    /// * `altitude` - The altitude of the current point.
    pub fn add(&mut self, time: f64, lat: f64, lon: f64, speed: f64, altitude: f64) -> i16 {
        let new_point: Vec<f64> = vec![lat, lon];
        self.current_time = time;
        let mut session_type = 0;

        /* For the initial point of the session */
        if self.start_time == 0.0 {
            self.start_time = time;
            self.session_start = self.current_index;
            self.max_speed = speed;
            self.min_speed = speed;
            self.average_speed = speed;
            self.max_altitude = altitude;
            self.min_altitude = altitude;
            self.average_altitude = altitude;
            self.current_index += 1.0;

            self.prev_point = new_point;
            self.prev_time = time;
            return 1;
        }
        let mut distance: f64 = 0.0;

        /* Handle adding 1st point to the session */
        if !self.prev_point.is_empty() {
            distance = self.calculate_distance(&self.prev_point, &new_point);
            self.prev_time = time;
        }

        let (date_string, hour_interval): (String, i16) = self.get_datestring_day(time);
        if !self.overlapping_days_utc.contains(&date_string) {
            self.overlapping_days_utc.push(date_string.clone());
            self.day_intervals.push(vec![0.0; 24]);
        }
        if let Some(date_string_index) = self
            .overlapping_days_utc
            .iter()
            .position(|x| x == &date_string)
        {
            self.day_intervals[date_string_index][hour_interval as usize] += distance;
        }

        self.session_distance += distance;
        self.prev_distance = distance;
        self.max_speed = speed.max(self.max_speed);
        self.min_speed = speed.min(self.min_speed);
        self.average_speed = ((self.average_speed * (self.current_index - self.session_start))
            + speed)
            / (self.current_index - self.session_start + 1.0);
        self.max_altitude = altitude.max(self.max_altitude);
        self.min_altitude = altitude.min(self.min_altitude);
        self.average_altitude =
            ((self.average_altitude * (self.current_index - self.session_start)) + altitude)
                / (self.current_index - self.session_start + 1.0);
        self.prev_point = new_point;
        self.prev_time = time;
        self.current_index += 1.0;
        return 1;
    }

    /// Calculates the distance between two geographic points.
    ///
    /// # Arguments
    /// * `prev_point` - The previous geographic point.
    /// * `new_point` - The new geographic point.
    ///
    /// # Returns
    /// * `f64` - The distance between the two points in meters.
    fn calculate_distance(&self, prev_point: &Vec<f64>, new_point: &Vec<f64>) -> f64 {
        let prev_location = Location::new(prev_point[0], prev_point[1]);
        let current_location = Location::new(new_point[0], new_point[1]);
        prev_location
            .distance_to(&current_location)
            .unwrap()
            .meters()
            / 1000.0
    }

    fn get_datestring_day(&self, time: f64) -> (String, i16) {
        let utc_datetime = DateTime::<Utc>::from_utc(
            NaiveDateTime::from_timestamp((time / 1000.0) as i64, 0),
            Utc,
        );
        let hour_interval = utc_datetime.hour();
        let month = utc_datetime.month();
        let year: i32 = utc_datetime.year();
        let day = utc_datetime.day();
        let date_string = format!("{:02}/{:02}/{:02}", year, month, day);
        return (date_string, hour_interval as i16);
    }

    /// Ends the current session and stores its data.
    pub fn end(&mut self) {
        self.sessions.push(vec![
            self.session_start,
            self.current_index,
            self.start_time,
            self.current_time,
            self.max_speed,
            self.min_speed,
            self.average_speed,
            self.max_altitude,
            self.min_altitude,
            self.average_altitude,
        ]);
        self.session_types.push(0);
    }
}
pub struct LocationEncoder {}

impl LocationEncoder {
    /// Constructs a new `LocationEncoder`.
    ///
    /// # Returns
    /// * `Self` - A new instance of `LocationEncoder`.
    pub fn new() -> Self {
        Self {}
    }

    /// Simplifies the given location data by filtering out locations that have not changed significantly.
    ///
    /// This method iterates through the provided `LocationDataBulk` and only retains the locations
    /// where there is a significant change in latitude, longitude, speed, altitude, or battery level
    /// compared to the previous location. The thresholds for these changes are hardcoded.
    ///
    /// # Arguments
    /// * `locations` - A reference to the `LocationDataBulk` containing the original location data.
    ///
    /// # Returns
    /// * `LocationDataBulk` - A new `LocationDataBulk` instance containing only the simplified location data.
    pub fn get_utc_distance_intervals(
        &self,
        locations: &LocationDataBulk,
        device_id: &String,
    ) -> Vec<DistanceData> {
        let mut simplified_locations = LocationDataBulk {
            lats: Vec::new(),
            lons: Vec::new(),
            speeds: Vec::new(),
            accuracies: Vec::new(),
            altitudes: Vec::new(),
            altitude_accuracies: Vec::new(),
            bearings: Vec::new(),
            batteries: Vec::new(),
            times: Vec::new(),
            map_matched_lats: Vec::new(),
            map_matched_lons: Vec::new(),
            distances: Vec::new(),
            engine_states: Vec::new(),
            activities: Vec::new()
        };

        let mut session_splitter = SessionSplitter::new();

        for (i, lat) in locations.lats.iter().enumerate() {
            let lon = locations.lons[i];
            let speed = locations.speeds[i];
            let altitude = locations.altitudes[i];

            session_splitter.add(
                locations.times[i],
                lat.clone(),
                lon.clone(),
                speed.clone(),
                altitude.clone(),
            );
        }
        session_splitter.end();
        let overlapping_days_utc: Vec<String> = session_splitter.overlapping_days_utc;
        let day_intervals: Vec<Vec<f64>> = session_splitter.day_intervals;
        let distance_data_vec: Vec<DistanceData> = overlapping_days_utc
            .iter()
            .enumerate()
            .map(|(i, x)| DistanceData {
                id: device_id.clone(),
                date: x.clone(),
                distances: day_intervals[i].clone(),
            })
            .collect();
        let total_distance: f64 = simplified_locations.distances.iter().sum();
        return distance_data_vec;
    }

    /// Compresses the location data fields using MessagePack serialization followed by LZ4 compression.
    ///
    /// This method iterates through each field (latitude, longitude, speed, etc.) in the provided `LocationDataBulk`,
    /// serializes the field data into MessagePack format, compresses the serialized data using LZ4 compression,
    /// and then encodes the compressed data into Base64 format. The compressed data is collected into a vector
    /// and returned. This process reduces the size of the location data, making it more efficient for storage
    /// and transmission.
    ///
    /// # Arguments
    /// * `locations` - A reference to the `LocationDataBulk` containing the original location data.
    ///
    /// # Returns
    /// * `Vec<Vec<u8>>` - A vector containing the compressed data for each field in the `LocationDataBulk`.
    pub fn compress_location_data(&self, locations: &LocationDataBulk) -> Vec<Vec<u8>> {
        let mut compressed_data_vec = Vec::new();

        let fields = vec![
            &locations.lats,
            &locations.lons,
            &locations.speeds,
            &locations.accuracies,
            &locations.altitudes,
            &locations.altitude_accuracies,
            &locations.bearings,
            &locations.batteries,
            &locations.times,
            &locations.map_matched_lats,
            &locations.map_matched_lons,
            &locations.distances,
            &locations.engine_states,
            &locations.activities
        ];

        for field in fields {
            let bytes = to_msgpack(field).expect("Failed to serialize field");
            let compressed = compress_prepend_size(&bytes);
            let _base64_compressed = base64::encode(&compressed);
            let _decompressed =
                lz4_flex::decompress_size_prepended(&compressed).expect("Failed to decompress");
            compressed_data_vec.push(compressed);
        }

        compressed_data_vec
    }
}
