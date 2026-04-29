use std::collections::HashMap;
use std::sync::Arc;
use tokio::time::{interval, Duration};
mod controllers;
mod database_client;
mod models;
mod mongo_client;
mod utils;

/* Controllers */
use crate::controllers::location_encoder::LocationEncoder;
use crate::controllers::map_matching::MapMatcher;

/* DB clients */
use crate::database_client::DatabaseClient;
use crate::mongo_client::MongoClient;

use crate::models::distance::{DistanceData, DistanceStats};
use crate::models::location::{
    CompletedLocation, EncodedLocationData, LiveLocation, LocationDataBulk,
};
use crate::models::session::{Session, SessionData};
use crate::utils::generate_uuid;

fn run_cron(
    db_client: Arc<DatabaseClient>,
    mongo_client: Arc<MongoClient>,
) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        let mut interval = interval(Duration::from_secs(10));
        let session_obj: Session = Session::new(&db_client);
        let live_location_obj: LiveLocation = LiveLocation::new(&db_client);
        let location_encoder_obj: LocationEncoder = LocationEncoder::new();
        let completed_location_obj: CompletedLocation = CompletedLocation::new(&db_client);
        let map_matching_obj: MapMatcher = MapMatcher::new();
        let distance_stat_obj: DistanceStats = DistanceStats::new(&db_client, &mongo_client);

        let today_utc = chrono::Utc::now().format("%d/%m/%Y").to_string();

        let completed_sessions: Vec<SessionData> = session_obj
            .get_completed_sessions()
            .await
            .expect("Failed to get completed sessions");
        if completed_sessions.len() == 0 {
            return;
        }
        for mut session in completed_sessions {
            // if session.id != "867440064878366" {
            //     continue;
            // }
            let session_id_clone = session.id.clone();
            let process_start_time = chrono::Utc::now();
            let unique_id: String = generate_uuid();
            let session_id: String = session.session_id;
            let session_type: String = session.session_type;
            if session_type == "TEMP" {
                let session_date = session_id.split('|').next().unwrap_or("");
                if session_date == today_utc {
                    continue;
                }
                // LATER handle condition if session is before x days skip it -- data corruptions or mistructures
                // get End time of the session from the session_date of format DD/MM/YYYY, end time in utc
                let end_time_str = format!("{} {}", session_date, "23:59:59");
                let end_time =
                    chrono::NaiveDateTime::parse_from_str(&end_time_str, "%d/%m/%Y %H:%M:%S")
                        .expect("Failed to parse end time");
                let end_time_utc = chrono::DateTime::<chrono::Utc>::from_utc(end_time, chrono::Utc);
                session.end_time = Some(end_time_utc);
            } else {
                if session_type != "TEMP" && session.status != "completed" {
                    continue;
                }
            }

            println!("Processing session {}", session.id);

            let (mut locations, map_match_splits, time_distance_map): (
                LocationDataBulk,
                Vec<Vec<i32>>,
                HashMap<chrono::NaiveDate, Vec<f64>>,
            ) = live_location_obj
                .get_locations_from_session(session_id.as_str())
                .await
                .expect("Failed to get locations from session");

            if locations.lats.len() == 0 {
                println!("No locations found for session: {}", session_id);
                session_obj
                    .delete_session(&session_id)
                    .await
                    .expect("Failed to delete session");
                continue;
            }
            let mut map_match_done: bool = false;
           
            let compressed_locations: Vec<Vec<u8>> =
                location_encoder_obj.compress_location_data(&locations);

            let distance_datas: Vec<DistanceData> =
                location_encoder_obj.get_utc_distance_intervals(&locations, &session.id);

            let encoded_location_data = EncodedLocationData {
                id: unique_id,
                device_id: session.id,
                processing_time: 10,
                processed_on: process_start_time,
                session_id: session_id,
                start_time: session.start_time.unwrap(),
                end_time: session.end_time.unwrap(),
                data: compressed_locations,
            };
            let session_id: &str = &encoded_location_data.session_id.clone();
            distance_stat_obj
                .insert_multiple(distance_datas, time_distance_map, session_id_clone)
                .await
                .expect("Failed to insert distance stats");
            println!("Completed processing session: {}", session_id);
            completed_location_obj
                .insert_completed_locations(&encoded_location_data, map_match_done)
                .await
                .expect("Failed to insert completed locations");
            live_location_obj
                .delete_locations_from_session(session_id)
                .await
                .expect("Failed to delete locations from session");
            session_obj
                .update_session_status(session_id, &encoded_location_data.end_time)
                .await
                .expect("Failed to update session status");
        }
    })
}

async fn recursive_looper() -> Result<(), Box<dyn std::error::Error>> {
    let db_client: DatabaseClient = DatabaseClient::connect().await.map_err(|e| {
        eprintln!("Failed to connect to the database: {:?}", e);
        Box::new(e) as Box<dyn std::error::Error>
    })?;
    let mongo_client: MongoClient = MongoClient::connect().await.map_err(|e| {
        eprintln!("Failed to connect to the database: {:?}", e);
        Box::new(e) as Box<dyn std::error::Error>
    })?;
    let db_client: Arc<DatabaseClient> = Arc::new(db_client);
    let mongo_client: Arc<MongoClient> = Arc::new(mongo_client);

    loop {
        if let Err(e) = run_cron(db_client.clone(), mongo_client.clone()).await {
            eprintln!("Error running cron job: {:?}", e);
        }
        tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;
    }
}

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();

    loop {
        if let Err(e) = recursive_looper().await {
            eprintln!(
                "Error encountered in recursive_looper, retrying...: {:?}",
                e
            );
        }
    }
    // if let Err(e) = handle.await {
    //     eprintln!("Task panicked: {:?}", e);
    // }
}
