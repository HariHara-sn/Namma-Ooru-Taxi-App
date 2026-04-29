use crate::models::location::LocationDataBulk;
use polyline::encode_coordinates;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json;
use std::error::Error;
use std::fs::OpenOptions;
use std::io::prelude::*;
#[derive(Serialize, Deserialize, Debug)]
pub struct ServerResponse {
    pub units: String,
    pub edges: Vec<serde_json::Value>,
    pub matched_points: Vec<MatchedPoint>,
    pub alternate_paths: Vec<serde_json::Value>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MatchedPoint {
    pub lon: f64,
    pub lat: f64,
    #[serde(rename = "type")]
    point_type: String,
}

pub struct MapMatcher {}

impl MapMatcher {
    pub fn new() -> Self {
        Self {}
    }

    pub fn append_line_to_file(&self, file_path: &str, line: &str) -> std::io::Result<()> {
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(file_path)?;

        writeln!(file, "{}", line)?;

        Ok(())
    }

    pub async fn start(
        &self,
        locations: &LocationDataBulk,
        map_match_splits: &Vec<Vec<i32>>,
    ) -> Result<(Vec<Vec<f64>>, bool), Box<dyn Error>> {
        let mut output_lats: Vec<f64> = Vec::new();
        let mut output_lons: Vec<f64> = Vec::new();
        let mut all_failed: bool = true;

        for split in map_match_splits {
            let start_index = split[0] as usize;
            let end_index = split[1] as usize;

            let sliced_location = LocationDataBulk {
                lats: locations.lats[start_index..=end_index].to_vec(),
                lons: locations.lons[start_index..=end_index].to_vec(),
                speeds: vec![],
                accuracies: vec![],
                altitudes: vec![],
                altitude_accuracies: vec![],
                bearings: vec![],
                batteries: vec![],
                times: vec![],
                map_matched_lats: vec![],
                map_matched_lons: vec![],
                distances: vec![],
                engine_states: vec![],
                activities: vec![],
            };

            match self.run(&sliced_location).await {
                Ok(response) => {
                    let (map_matched_lons, map_matched_lats): (Vec<f64>, Vec<f64>) = response
                        .matched_points
                        .iter()
                        .map(|point| (point.lon, point.lat))
                        .unzip();
                    output_lats.extend(map_matched_lats);
                    output_lons.extend(map_matched_lons);
                    all_failed = false;
                }
                Err(err) => {
                    output_lats.extend(locations.lats[start_index..=end_index].to_vec());
                    output_lons.extend(locations.lons[start_index..=end_index].to_vec());
                }
            };
        }
        let output = vec![output_lats, output_lons];
        Ok((output,all_failed))
    }

    pub async fn run(
        &self,
        locations: &LocationDataBulk,
    ) -> Result<ServerResponse, Box<dyn Error>> {
        println!("Calling Map MAtching");
        let coordinates: Vec<[f64; 2]> = locations
            .lats
            .iter()
            .zip(locations.lons.iter())
            .map(|(lat, lon)| [*lat, *lon])
            .collect();

        let polyline: String =
            encode_coordinates(&coordinates[..], 6).map_err(|e| e.to_string())?;
        let payload = serde_json::json!({
            "encoded_polyline": polyline,
            "shape_match": "map_snap",
            "costing": "auto",
            "durations": "f",
            "filters": {
                "attributes": ["matched.point", "matched.type"],
                "action": "include"
            }
        });
        let payload_str = serde_json::to_string(&payload)?;
        // self.append_line_to_file("map_matching_payload.txt", &payload_str)?;
        let client: Client = Client::new();
        let map_matching_url: String = std::env::var("MAP_MATCHING_URL")?;
        let res = client.post(&map_matching_url).json(&payload).send().await?;
        let server_response = res.json::<ServerResponse>().await?;
        Ok(server_response)
    }
}
