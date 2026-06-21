const { Pool } = require('pg');
require('dotenv').config();

async function test() {
    const connectionString = process.env.DATABASE_URL;
    console.log('Connecting to:', connectionString.split('@')[1]); // print host without credentials
    
    console.log('Testing default Pool...');
    const pool1 = new Pool({ connectionString });
    try {
        const client = await pool1.connect();
        const res = await client.query('SELECT NOW()');
        console.log('Default Pool Success:', res.rows[0]);
        client.release();
    } catch (err) {
        console.error('Default Pool Failed:', err.message);
    }
    await pool1.end();

    console.log('\nTesting Pool with SSL rejectUnauthorized: false...');
    const pool2 = new Pool({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        const client = await pool2.connect();
        const res = await client.query('SELECT NOW()');
        console.log('SSL Pool Success:', res.rows[0]);
        client.release();
    } catch (err) {
        console.error('SSL Pool Failed:', err.message);
    }
    await pool2.end();
}

test();
