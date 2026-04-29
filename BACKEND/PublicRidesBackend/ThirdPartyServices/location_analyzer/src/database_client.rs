// database_client.rs

use tokio_postgres::{Client, NoTls, Error};
use std::env;

pub struct DatabaseClient {
    client: Client,
}

impl DatabaseClient {
    // Connects to the database and returns a DatabaseClient instance
    pub async fn connect() -> Result<Self, Error> {
        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
        let (client, connection) = tokio_postgres::connect(&database_url, NoTls).await?;

        // Spawn the connection in the background
        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("Connection error: {}", e);
            }
        });

        println!("Successfully connected to the database at {}", database_url);
        Ok(DatabaseClient { client })
    }

    pub fn get_client(&self) -> &Client {
        &self.client
    }

}
