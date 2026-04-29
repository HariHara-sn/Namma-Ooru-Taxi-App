use crate::database_client::DatabaseClient;
use chrono::{DateTime, Timelike, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;
use tokio_postgres::types::Json;
use tokio_postgres::Error;
use base64::encode;
use geoutils::Location;
use chrono::Duration;
use std::collections::HashMap;

use super::activity::{Activity, get_activities};


use super::distance::DistanceData;
#[derive(Serialize, Deserialize, Debug)]
pub struct LocationData {
    pub id: String,
    pub session_id: String,
    pub latitude: f64,
    pub longitude: f64,
    pub speed: Option<f64>,
    pub accuracy: Option<f64>,
    pub altitude: Option<f64>,
    pub altitude_accuracy: Option<f64>,
    pub bearing: Option<f64>,
    pub battery: Option<f64>,
    // pub time : DateTime<Utc>,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct LocationDataBulk {
    pub lats: Vec<f64>,
    pub lons: Vec<f64>,
    pub speeds: Vec<f64>,
    pub accuracies: Vec<f64>,
    pub altitudes: Vec<f64>,
    pub altitude_accuracies: Vec<f64>,
    pub bearings: Vec<f64>,
    pub batteries: Vec<f64>,
    pub times: Vec<f64>, // Changed from Vec<f64> to Vec<DateTime<Utc>>
    pub map_matched_lats: Vec<f64>,
    pub map_matched_lons: Vec<f64>,
    pub distances: Vec<f64>,
    pub engine_states: Vec<f64>,
    pub activities: Vec<f64>
}

pub struct EncodedLocationData {
    pub id: String,
    pub device_id: String,
    pub processing_time: i32,
    pub processed_on: DateTime<Utc>,
    pub session_id: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub data: Vec<Vec<u8>>,
}
pub struct LiveLocation {
    db_client: Arc<DatabaseClient>,
}

pub struct CompletedLocation {
    db_client: Arc<DatabaseClient>,
}

impl LiveLocation {
    pub fn new(db_client: &Arc<DatabaseClient>) -> Self {
        Self {
            db_client: Arc::clone(db_client),
        }
    }

    pub async fn delete_locations_from_session(&self, session_id: &str) -> Result<String, Error> {
        let statement = "DELETE FROM \"liveLocations\" WHERE \"sessionId\" = $1";
        let db_client_obj = self.db_client.get_client();
        db_client_obj.execute(statement, &[&session_id]).await?;
        Ok("Deleted".to_string())
    }

    pub async fn get_locations_from_session(
        &self,
        session_id: &str,
    ) -> Result<(LocationDataBulk, Vec<Vec<i32>>, HashMap<chrono::NaiveDate, Vec<f64>>), Error> {
        let statement = "SELECT * FROM \"liveLocations\" WHERE \"sessionId\" = $1 ORDER BY \"time\" ASC";
        let db_client_obj = self.db_client.get_client();
        println!("QUERY INITIATED");
        let rows = db_client_obj.query(statement, &[&session_id]).await?;
        println!("QUERY RESULT");
        let mut lats: Vec<f64> = Vec::new();
        let mut lons: Vec<f64> = Vec::new();
        let mut speeds: Vec<f64> = Vec::new();
        let mut accuracies: Vec<f64> = Vec::new();
        let mut altitudes: Vec<f64> = Vec::new();
        let mut altitude_accuracies: Vec<f64> = Vec::new();
        let mut bearings: Vec<f64> = Vec::new();
        let mut batteries: Vec<f64> = Vec::new();
        let mut times: Vec<f64> = Vec::new(); // Changed from Vec<f64> to Vec<DateTime<Utc>>
        let mut engine_states: Vec<f64> = Vec::new();
        let mut activities: Vec<f64> = Vec::new();

        let mut prev_time: Option<DateTime<Utc>> = None;
        let mut prev_lat: Option<f64> = None;
        let mut prev_lon: Option<f64> = None;
        let mut index: usize = 0;
        let mut map_match_splits: Vec<Vec<i32>> = Vec::new();
        let mut split_start: usize = 0;

        let mut time_distance_map: HashMap<chrono::NaiveDate, Vec<f64>> = HashMap::new();
        let mut paused: bool = false;
        let activities_struc = get_activities();

        for row in rows {
            let lat: f64 = row.get("latitude");
            let lon: f64 = row.get("longitude");
            let mut speed: f64 = row.get("speed");
            let accuracy: f64 = row.get::<_, Option<f64>>("accuracy").unwrap_or(0.0);
            let altitude: f64 = row.get::<_, Option<f64>>("altitude").unwrap_or(0.0);
            let altitude_accuracy: f64 =
                row.get::<_, Option<f64>>("altitudeAccuracy").unwrap_or(0.0);
            let bearing: f64 = row.get::<_, Option<f64>>("heading").unwrap_or(0.0);
            let battery: f64 = row.get::<_, Option<f64>>("battery").unwrap_or(0.0);
            let engine_status: f64 = if row.get::<_, Option<bool>>("engineOn").unwrap_or(false) { 1.0 } else { 0.0 };
            let activity: String = row.get::<_, Option<String>>("activity").unwrap_or("UNKNOWN".to_string());
            let speed_km = speed * 1.852; 
            let activity = activities_struc
            .iter()
            .find(|a: &&Activity| a.values.contains(&activity))
            .unwrap_or_else(|| &activities_struc[0]);

            let prev_location = Location::new(prev_lat.unwrap_or(lat), prev_lon.unwrap_or(lon));
            let current_location = Location::new(lat, lon);
            let distance_km = prev_location
                .distance_to(&current_location)
                .unwrap()
                .meters()
                / 1000.0;

            let time: DateTime<Utc> = row.get("time");
            let time_difference: i64 = if let Some(prev_time) = prev_time {
                    time.timestamp_millis() - prev_time.timestamp_millis()
                } else {
                    0
                };
            let caluclated_speed = if time_difference != 0 {
                distance_km / (time_difference as f64 / 3600000.0)
            } else {
                0.0
            };
            let mut add_distance : bool = true;

            if caluclated_speed > 180.0{
                add_distance = false;
                println!("Speed: {}", caluclated_speed);
            }
            if distance_km>0.1 && caluclated_speed > speed_km * 3.0{
                add_distance = false;
                println!("Speedkm: {} {} {} {}", distance_km ,speed_km, caluclated_speed, time_difference);
            }

            println!("Distance: {}", distance_km);
            println!("Speed: {}", caluclated_speed);
            /* Current Time index calc */

            let utc_date= time.date_naive();
            let half_hour_index = (time.time().hour() * 12) as usize + (time.time().minute() / 5) as usize;
            let day_entry = time_distance_map.entry(utc_date).or_insert_with(|| vec![0.0; 288]);
    

            /* Prev Time index calc */

            let prev_half_hour_index = (prev_time.unwrap_or(time).time().hour() * 12) as usize + (prev_time.unwrap_or(time).time().minute() / 5) as usize;

            if(distance_km<0.03 || speed_km<0.2){
                if(paused==false){
                    paused = true;
                    if add_distance{
                        if(prev_half_hour_index==half_hour_index){
                            day_entry[half_hour_index] += distance_km;
                        }else{
                            /* Average the distance_km and spread the distance from prev_half_hour_index to half_hour_index */
                            if(prev_half_hour_index>half_hour_index){
                                day_entry[half_hour_index] += distance_km;
                            }else{
                                let total_indices_between = half_hour_index - prev_half_hour_index;
                                let avg_distance = distance_km / total_indices_between as f64;
                                for i in prev_half_hour_index..half_hour_index {
                                    day_entry[i] += avg_distance;
                                }
                            }
                        }
                    }
                }

            }else{
                paused = false;
                if add_distance{
                    if(prev_half_hour_index==half_hour_index){
                        day_entry[half_hour_index] += distance_km;
                    }else{
                        /* Average the distance_km and spread the distance from prev_half_hour_index to half_hour_index */
                        if(prev_half_hour_index>half_hour_index){
                            day_entry[half_hour_index] += distance_km;
                        }else{
                            let total_indices_between = half_hour_index - prev_half_hour_index;
                            let avg_distance = distance_km / total_indices_between as f64;
                            for i in prev_half_hour_index..half_hour_index {
                                day_entry[i] += avg_distance;
                            }
                        }
                    }
                }else{
                    println!("skipped");
                }
                // day_entry[half_hour_index] += distance_km;
            }


            if(distance_km>0.5){
                if(split_start==lats.len()){
                    map_match_splits.push(vec![split_start as i32,split_start as i32]);
                    split_start = lats.len();
                }else{
                    let split_end = if(lats.len()>1){lats.len()-1}else{lats.len()};
                    map_match_splits.push(vec![split_start as i32,split_end as i32]);
                    split_start = lats.len();
                }
            }

            lats.push(lat);
            lons.push(lon);
            speeds.push(speed);
            accuracies.push(accuracy);
            altitudes.push(altitude);
            altitude_accuracies.push(altitude_accuracy);
            bearings.push(bearing);
            batteries.push(battery);
            times.push(time.timestamp_millis() as f64); // Changed to push time in milliseconds as f64
            engine_states.push(engine_status);
            index = index + 1;
            activities.push(activity.activity_type as f64);
            if(add_distance){
                prev_lat = Some(lat);
                prev_lon = Some(lon);
                prev_time = Some(time);
            }
        }

        println!("QUERY COMPLETED");

        let location_data_bulk: LocationDataBulk = LocationDataBulk {
            lats,
            lons,
            speeds,
            accuracies,
            altitudes,
            altitude_accuracies,
            bearings,
            batteries,
            times,
            map_matched_lats: Vec::new(),
            map_matched_lons: Vec::new(),
            distances: Vec::new(),
            engine_states: engine_states,
            activities: activities
        };
        Ok((location_data_bulk, map_match_splits, time_distance_map))
    }
}

impl CompletedLocation {
    pub fn new(db_client: &Arc<DatabaseClient>) -> Self {
        Self {
            db_client: Arc::clone(db_client),
        }
    }

    pub async fn insert_completed_locations(
        &self,
        data: &EncodedLocationData,
        map_matched: bool,
    ) -> Result<String, Error> {
        let statement: &str = 
            "INSERT INTO \"completedLocations\" 
        (\"id\", \"processingTime\", \"processedOn\", \"sessionId\", \"startTime\", \"endTime\", \"data\" , \"dataBase64\", \"mapMatched\") 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)";
        let db_client_obj = self.db_client.get_client();
        let mut combined_base64_string = String::new();
        for (index, row) in data.data.iter().enumerate() {
            combined_base64_string.push_str(&encode(row.clone()));
            if index < data.data.len() - 1 {
                combined_base64_string.push('|');
            }
        }
        db_client_obj
            .execute(
                statement,
                &[
                    &data.device_id,
                    &data.processing_time,
                    &data.processed_on,
                    &data.session_id,
                    &data.start_time,
                    &data.end_time,
                    &data.data,
                    &combined_base64_string,
                    &map_matched
                ],
            )
            .await?;
        Ok("Completed".to_string())
    }
}
