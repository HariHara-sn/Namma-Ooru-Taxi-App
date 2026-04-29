

Location Analyzer is a cronjob which will run continously and fetch completed sessions from database , process them and compress it into efficient structure and move to a new table to reduce workload and improve performance


SETUP

1. Install RUST and setup development environment
2. Create a .env file and add the following variables
    DATABASE_URL=postgres://postgres:postgres@localhost:5432/locationtracking
3. To run the location_analyzer
    run -> "cargo run" from the root folder



