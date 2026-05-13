const express = require('express');
const prisma = require('./config/db');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static uploads
app.use('/api/v1/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
prisma.$connect()
    .then(() => console.log('PostgreSQL connected via Prisma'))
    .catch(err => console.error('Prisma connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const walletsRoutes = require('./routes/wallets');
const depositsRoutes = require('./routes/deposits');
const withdrawsRoutes = require('./routes/withdraws');
const marketRoutes = require('./routes/market');
const messagesRoutes = require('./routes/messages');
const userbalanceRoutes = require('./routes/userbalance');
const tradeorderRoutes = require('./routes/tradeorder');
const timerprofitsRoutes = require('./routes/timerprofits');
const resetRoutes = require('./routes/reset');
const permissionsRoutes = require('./routes/permissions');
const faqRoutes = require('./routes/faqRoutes');
const { settleExpiredOrders } = require('./utils/orderSettler');

app.use('/api/v1/users', authRoutes); // /create, /login, /wallet/:wallet
app.use('/api/v1/users', userRoutes); // / (list), /:id (update/get)
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/wallets', walletsRoutes);
app.use('/api/v1/deposits', depositsRoutes);
app.use('/api/v1/withdraws', withdrawsRoutes);
app.use('/api/v1/market', marketRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/conversation', messagesRoutes);
app.use('/api/v1/userbalance', userbalanceRoutes);
app.use('/api/v1/tradeorder', tradeorderRoutes);
app.use('/api/v1/timerprofits', timerprofitsRoutes);
app.use('/api/v1/reset', resetRoutes);
app.use('/api/v1/permissions', permissionsRoutes);
app.use('/api/v1/chat-faqs', faqRoutes);

app.get('/', (req, res) => {
    res.send('Tradespot API Running');
});

// Create HTTP server for Socket.IO
const http = require('http');
const server = http.createServer(app);

// Socket.IO setup
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
    });
});

// Make io available to routes
app.set('io', io);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // ── Trade Order Settlement Cron (every 10 seconds) ──
    setInterval(() => {
        settleExpiredOrders(prisma, io);
    }, 10000);
}); // Server is listening

