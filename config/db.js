const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ 
    connectionString,
    max: 10,
    idleTimeoutMillis: 15000,       // Close idle connections after 15 seconds to prevent stale Neon sockets
    connectionTimeoutMillis: 5000,  // Fast timeout if the server drops connection
});

pool.on('error', (err) => {
    // Handle unexpected idle connection errors gracefully
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
