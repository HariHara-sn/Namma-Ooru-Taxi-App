/*
CREATE TABLE "distanceStats"(
    "key" SERIAL PRIMARY KEY,
    "id" TEXT NOT NULL, -- Device ID
    "date" DATE,
    "distances" JSONB NOT NULL DEFAULT '[]'
)
*/

use crate::database_client::DatabaseClient;
use crate::mongo_client::MongoClient;
use mongodb::{
    bson::{doc, Document},
    Client, Collection, error::Error as MongoError
};
use serde_json::json;
use std::{collections::HashMap, str::FromStr};
use std::sync::Arc;
use tokio_postgres::types::Json;
use tokio_postgres::Error;

#[derive(Debug)]
pub struct DistanceData {
    pub id: String,
    pub date: String,
    pub distances: Vec<f64>,
}

pub struct DistanceStats {
    db_client: Arc<DatabaseClient>,
    mongo_client: Arc<MongoClient>,
}

impl DistanceStats {
    pub fn new(db_client: &Arc<DatabaseClient>, mongo_client: &Arc<MongoClient>) -> Self {
        Self {
            db_client: Arc::clone(db_client),
            mongo_client: Arc::clone(mongo_client),
        }
    }

    pub async fn update_device_odometer(
        &self,
        distance: f64,
        device_id: &str,
    ) -> Result<(), MongoError> {
        let mongo_db: mongodb::Database = self.mongo_client.get_database();
        let mongo_collection: Collection<Document> = mongo_db
            .collection("devices");
        let filter = if device_id.len() == 24 && device_id.chars().all(|c| c.is_digit(16)) {
            doc! {"_id": mongodb::bson::oid::ObjectId::from_str(&device_id).unwrap()}
        } else {
            doc! {"_id": device_id}
        };
        // let filter: mongodb::bson::Document = doc! {"_id": object_id};
        let update: mongodb::bson::Document = doc! {"$inc": {"totalDistance": distance}};
        mongo_collection
            .update_one(filter, update, None)
            .await
            .map_err(|e| MongoError::from(e))?;
        Ok(())
    }

    pub async fn insert_multiple(&self, data: Vec<DistanceData>, time_distance_map: HashMap<chrono::NaiveDate, Vec<f64>>, imei: String) -> Result<(), Error> {
        let statement: &str = r#"INSERT INTO "distanceStats" (id, date, distances) VALUES ($1, TO_DATE($2, 'YYYY/MM/DD'), $3) ON CONFLICT (id, date) DO UPDATE SET distances = "distanceStats".distances || $3::jsonb"#;
        let db_client_obj = &self.db_client.get_client();
        // for distance_data in data.iter() {
        //     let json_d: serde_json::Value = json!(&distance_data.distances);
        //     let distances_json: Json<serde_json::Value> = Json(json_d);
        //     db_client_obj
        //         .execute(
        //             statement,
        //             &[&distance_data.id, &distance_data.date, &distances_json],
        //         )
        //         .await?;
        // }
        for (date, distances) in time_distance_map.iter() {
            let distance_data = DistanceData {
                id: imei.clone(),
                date: date.to_string(),
                distances: distances.clone(),
            };
            let json_d: serde_json::Value = json!(&distance_data.distances);
            let distances_json: Json<serde_json::Value> = Json(json_d);
            db_client_obj
                .execute(
                    statement,
                    &[&distance_data.id, &distance_data.date, &distances_json],
                )
                .await?;
        }
        Ok(())
    }
}
