use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Activity {
    pub name: String,
    pub values: Vec<String>,
    pub activity_type: u8,
}

pub fn get_activities() -> Vec<Activity> {
    vec![
        Activity {
            name: String::from("invehicle"),
            values: vec![String::from("IN_VEHICLE")],
            activity_type: 1,
        },
        Activity {
            name: String::from("bicycle"),
            values: vec![String::from("ON_BICYCLE")],
            activity_type: 2,
        },
        Activity {
            name: String::from("onfoot"),
            values: vec![String::from("ON_FOOT")],
            activity_type: 3,
        },
        Activity {
            name: String::from("running"),
            values: vec![String::from("RUNNING")],
            activity_type: 4,
        },
        Activity {
            name: String::from("rest"),
            values: vec![String::from("STILL")],
            activity_type: 5,
        },
        Activity {
            name: String::from("tilting"),
            values: vec![String::from("TILTING")],
            activity_type: 6,
        },
        Activity {
            name: String::from("unknown"),
            values: vec![String::from("UNKNOWN")],
            activity_type: 0,
        },
        Activity {
            name: String::from("walking"),
            values: vec![String::from("WALKING")],
            activity_type: 7,
        },
    ]
}
