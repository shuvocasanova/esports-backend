const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ 
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,       // Keep connections alive a bit longer
    connectionTimeoutMillis: 10000, // Wait up to 10s to get a connection
    keepAlive: true,                // Send TCP keepalive packets to prevent silent drops
    keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
    // Log the error but do NOT crash — the pool will reconnect automatically.
    // Without this handler the error would bubble up as an unhandledRejection
    // and crash the server mid-request (causing blank screens on mobile clients).
    console.error('[DB Pool] Unexpected idle client error (pool will reconnect):', err.message);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;

