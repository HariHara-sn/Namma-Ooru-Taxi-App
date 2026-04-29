use mongodb::{
    bson::{doc, Document},
    Client, Collection, error::Error
};

pub struct MongoClient {
    client: Client,
}

impl MongoClient {
    // Connects to the database and returns a MongoClient instance
    pub async fn connect() -> Result<Self, Error> {
        let uri = std::env::var("MONGO_URL").expect("MONGO_URL must be set");
        let client = Client::with_uri_str(&uri).await?;
        println!("Connected to Mongo DB");
        Ok(MongoClient { client })
    }

    // Returns the database instance
    pub fn get_database(&self) -> mongodb::Database {
        self.client.database("locationtracking")
    }
}
