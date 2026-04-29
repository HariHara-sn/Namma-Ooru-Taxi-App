# Running in Development - Steps

# Running the Tracking Engine

1. Install PostgreSQL:
   - Download and install PostgreSQL from the official website.
   - Set up the necessary user, password, host, and database configurations.

2. Create PostgreSQL Database and Tables:
   - Create a new database in PostgreSQL for the application.
   - Create the required tables for the application to function properly. -> Check LocationSchema.sql

3. Configure Timescale and PostGIS Extension:
   - Enable the Timescale and PostGIS extensions in your PostgreSQL database.
   - Follow the official documentation for detailed instructions on how to configure these extensions.

4. Install MongoDB:
   - Download and install MongoDB from the official website.
   - Set up MongoDB with the necessary configurations.

5. Run `npm install`:
   - Execute `npm install` in the root directory of the project to install all dependencies.

6. Configure .env:
   - Create a `.env` file in the root directory of the project.
   - Add the following environment variables to the `.env` file:
     ```
     PASSWORD_HASH_SECRET='password_hash_secret'
     DEVICE_IDENTITY_SECRET = 'device_identity_secret'
     JWT_SECRET = 'jwt_secret'
     PASSWORD_RESEST_SECRET='fdslkfsdkfksd'
     DEVICE_SHARE_LINK_SECRET = 'device_share_link_secret'
     JWT_REFRESH_SECRET = 'fdsfsdfsdfs'
     
     MONGO_URL='mongodb://localhost:27017'
     MONGO_DATABASE='locationtracking'

     POSTGRES_USER='postgres'
     POSTGRES_PASSWORD='postgres'
     POSTGRES_HOST='localhost'
     POSTGRES_PORT=5432
     POSTGRES_DATABASE='locationtracking'

     REDIS_HOST = 'localhost'
     REDIS_PORT = 6379
     REDIS_PASSWORD = ''

     MAIL_HOST=smtp.dreamhost.com
     MAIL_PORT=465
     MAIL_FROM=gpstracker@virtualmaze.co.in
     MAIL_PASS='password_here'

     FRONTEND_URL = 'https://tracker.vmmaps.com'

     E2E_ACCESS_KEY='IU5TZBPSC5QCDDT0KV9P'
     E2E_SECRET_KEY='7DIUAM5CPEA4Y63XSMLWCUQFE0DVXN49SCNDMRWC'
     E2E_BUCKET_NAME='not-publicrides'
     E2E_BASE='objectstore.e2enetworks.net'

      BACKUP_DIR = "/home/vmadmin/mysqlbackup/"  # Local backup directory
      MONGO_DUMP_PATH = "C:\\Program Files\\MongoDB\\Tools\\bin\\mongodump.exe" # this file available in mongoDB tools without this .exe mongoDB dumb not executed
      REMOTE_USER = "vmserver"
      REMOTE_HOST = "olin.virtualmaze.in"
      REMOTE_PORT = 3391
      REMOTE_DIR = "/home/vmserver/VMVendorsBackup"
      EMAIL_FROM = "admin@virtualmaze.co.in"
      EMAIL_TO = "aswin@virtualmaze.com"
      EMAIL_CC = ["aswinchithambaram@gmail.com", "ajinr@virtualmaze.com"]
      EMAIL_PASS = "VMSystem12$"
      SMTP_SERVER = "smtp.dreamhost.com"
      SMTP_PORT = 587

7. Start the Application:
   - Run `node main.js` to start the application.

# Starting the Rust location_analyzer Cron Job

This section guides you through the process of setting up and starting the Rust-based `location_analyzer` cron job, which is essential for analyzing location data efficiently.

1. **Install Rust:**
   - Begin by installing Rust on your system. You can download it from the official Rust website. Follow the installation instructions provided there to ensure Rust is correctly set up on your machine.

2. **Navigate to the Project Directory:**
   - Change your current directory to the `location_analyzer` service within the TrackingEngine project. You can do this by executing the following command in your terminal:
     ```
     cd TrackingEngine/ThirdPartyServices/location_analyzer
     ```

3. **Create a .env File:**
   - In the `location_analyzer` directory, create a new file named `.env`. This file will store environment variables required for the cron job to connect to the database and access other services.

4. **Configure the .env File:**
   - Open the newly created `.env` file in a text editor of your choice. Add the following environment variables to the file, which include the database URL and the map matching service URL:
     ```
     DATABASE_URL=postgres://username:password@localhost:port/dbName
     MAP_MATCHING_URL=https://neapi.vmmaps.com/ne/api?op=trace_attributes
     ```
   - Make sure to replace the placeholders with your actual database credentials and URLs.

5. **Running the Cron Job:**
   - With Rust installed and the environment variables configured, you are now ready to start the `location_analyzer` cron job. Run the following command in your terminal to initiate the cron job:
     ```
     cargo run
     ```
   - This command compiles the Rust project and executes the cron job, which will begin analyzing location data as per its configuration.

By following these steps, you have successfully set up and started the `location_analyzer` cron job, which plays a crucial role in the TrackingEngine's ability to process and analyze location data efficiently.

# Starting the Test Cases for the APIs

This section guides you through the process of setting up and starting the test cases for the APIs in the `TRACKENGINE`.

1. **Install Dependencies**
   - Begin by installing dependencies such as mocha, chai, and supertest. Use this command for dependencies not in package.json: `npm install mocha chai supertest`.

2. **Create Test Case Files**
   - Test cases are created based on the module. For example, `DeviceController.spec.mjs` contains the test cases for the corresponding `DeviceController.js` module APIs.

3. **Inserting Testing Data**
   - The necessary test datasets are available in the `../testData` folder. Other data are manually created in the code.

4. **Configure the Test Cases**
   - Set up a test script in package.json:
     ```json
     "scripts": {
       "tests": "mocha"
     }
     ```

5. **Running the Test Cases**
   - Then run tests with:
     ```sh
     npm run tests
     ```
5. **cloneing Fare Engine submodule**
git submodule update --init --recursive
