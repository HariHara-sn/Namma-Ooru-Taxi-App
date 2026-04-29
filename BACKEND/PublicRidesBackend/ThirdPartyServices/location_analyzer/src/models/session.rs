use crate::database_client::DatabaseClient;
use chrono::{DateTime, Utc};
use std::sync::Arc;
use tokio_postgres::Error;

pub struct SessionData {
    pub id: String,
    pub session_id: String,
    pub session_name: Option<String>,
    pub device_type: String,
    pub device_name: String,
    pub status: String,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub session_type: String,
    pub process_retry_count: i32
}

pub struct Session {
    db_client: Arc<DatabaseClient>,
}

impl Session {
    // Constructor to create a new SessionManager instance
    pub fn new(db_client: &Arc<DatabaseClient>) -> Self {
        Self {
            db_client: Arc::clone(db_client),
        }
    }

    // Example method to insert a new session into the session table
    pub async fn get_completed_sessions(&self) -> Result<Vec<SessionData>, Error> {
        let processed: bool = false;
        let statement = "SELECT * FROM \"sessions\" WHERE \"processed\" = $1";
        let db_client_obj = self.db_client.get_client();
        let rows = db_client_obj.query(statement, &[&processed]).await?;
        let mut session_list: Vec<SessionData> = Vec::new();

        for row in rows {
            let data: SessionData = SessionData {
                id: row.get("id"),
                session_id: row.get("sessionId"),
                session_name: row.get("sessionName"),
                device_type: row.get("deviceType"),
                device_name: row.get("deviceName"),
                status: row.get("status"),
                start_time: row.get("startTime"),
                end_time: row.get("endTime"),
                session_type: row.get("sessionType"),
                process_retry_count: row.get("processRetryCount")
            };
            session_list.push(data);
        }
        Ok(session_list)
    }

    pub async fn add_session_retry_count(&self, session_id: &str) -> Result<(), Error> {
        let statement = "UPDATE \"sessions\" SET \"processRetryCount\" = \"processRetryCount\" + 1 WHERE \"sessionId\" = $1";
        let db_client_obj = self.db_client.get_client();
        db_client_obj.execute(statement, &[&session_id]).await?;
        Ok(())
    }

    pub async fn update_session_status(
        &self,
        session_id: &str,
        end_time: &DateTime<Utc>,
    ) -> Result<(), Error> {
        let status: String = "completed".to_string();
        let statement = "UPDATE \"sessions\" SET \"processed\" = $1, \"endTime\" = $2, \"status\" = $3 WHERE \"sessionId\" = $4";
        let db_client_obj = self.db_client.get_client();
        db_client_obj
            .execute(statement, &[&true, &end_time, &status, &session_id])
            .await?;
        Ok(())
    }

    pub async fn delete_session(&self, session_id: &str) -> Result<(), Error> {
        let statement = "DELETE FROM \"sessions\" WHERE \"sessionId\" = $1";
        let db_client_obj = self.db_client.get_client();
        db_client_obj.execute(statement, &[&session_id]).await?;
        Ok(())
    }
}
