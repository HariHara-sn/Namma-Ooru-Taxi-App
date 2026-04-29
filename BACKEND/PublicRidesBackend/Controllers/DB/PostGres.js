const { Pool } = require('pg');

class Database {
    constructor() {
        this._pool = new Pool({
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            host: process.env.POSTGRES_HOST,
            port: process.env.POSTGRES_PORT,
            database: process.env.POSTGRES_DATABASE,
        });
        this.connected = false;

        this._pool.connect()
            .then(client => {
                client.release();
            })
            .catch(err => console.error('Error connecting to TimescaleDB', err));

        this._pool.on('connect', () => {
            console.log('Connected to TimescaleDB');
            this.connected = true;
        });

        this._pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            // process.exit(-1);
        });
    }

    async get(query, params = []) {
        try {
            const result = await this.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        }
    }


    query(queryText, params) {
        return this._pool.query(queryText, params);
    }

    async insert(table, data) {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const valuePlaceholders = fields.map((_, idx) => `$${idx + 1}`).join(', ');

        let queryText = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${valuePlaceholders}) RETURNING *`;

        // Special handling for 'location' field if it exists
        if (data.location) {
            const locationIndex = fields.indexOf('location') + 1;
            queryText = queryText.replace(`$${locationIndex}`, `ST_GeomFromText($${locationIndex}, 4326)`);
        }

        return this.query(queryText, values);
    }

    update(table, data, condition) {
        const updates = Object.keys(data).map((key, idx) => `${key} = $${idx + 1}`);
        const values = Object.values(data);
        const conditionString = Object.keys(condition).map((key) => `${key} = ?`).join(' AND ');

        const queryText = `UPDATE ${table} SET ${updates.join(', ')} WHERE ${conditionString}`;
        return this.query(queryText, values);
    }

    delete(table, condition) {
        const conditionString = Object.keys(condition).map((key) => `${key} = ?`).join(' AND ');
        const queryText = `DELETE FROM ${table} WHERE ${conditionString}`;
        return this.query(queryText);
    }

    close() {
        return this._pool.end();
    }

}

module.exports = new Database(); // Export a singleton instance
