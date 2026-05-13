const prisma = require('../config/db');

/**
 * Maps Prisma TradeOrder record to the exact API response shape.
 * Key transforms:
 *  - createdAt  → created_at
 *  - updatedAt  → updated_at
 *  - profit_level (String|null) → Number (as seen in live response)
 */
const formatOrder = (order) => ({
    id: order.id,
    order_id: order.order_id,
    order_type: order.order_type,
    order_position: order.order_position,
    user_id: order.user_id,
    user_wallet: order.user_wallet,
    wallet_coin_id: order.wallet_coin_id,
    trade_coin_id: order.trade_coin_id,
    trade_coin_symbol: order.trade_coin_symbol,
    amount: order.amount,
    wallet_amount: order.wallet_amount,
    profit_amount: order.profit_amount,
    purchase_price: order.purchase_price,
    delivery_price: order.delivery_price,
    wallet_profit_amount: order.wallet_profit_amount,
    delivery_time: order.delivery_time,
    profit_level: order.profit_level != null ? Number(order.profit_level) : null,
    is_profit: order.is_profit,
    status: order.status,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    user_uuid: order.user_uuid,
    asigned_employee: order.asigned_employee,
    wallet_coin_name: order.wallet_coin_name,
    coin_symbol: order.coin_symbol || 'USDT',
});

/**
 * GET /api/v1/tradeorder/user/:userId
 * Returns trade orders for a specific user, filtered by status (running/finished).
 */
const getUserTradeOrders = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { status } = req.query;

        const whereClause = { user_id: userId };
        if (status) {
            whereClause.status = status;
        }

        const orders = await prisma.tradeOrder.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });

        res.json(orders.map(formatOrder));
    } catch (error) {
        console.error('getUserTradeOrders error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/v1/tradeorder
 * Returns all trade orders ordered oldest-first (matching live response ordering).
 */
const getAllTradeOrders = async (req, res) => {
    try {
        const orders = await prisma.tradeOrder.findMany({
            orderBy: { createdAt: 'asc' },
        });
        res.json(orders.map(formatOrder));
    } catch (error) {
        console.error('getAllTradeOrders error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/v1/tradeorder/:id
 * Deletes a trade order by its integer primary key.
 */
const deleteTradeOrder = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.tradeOrder.delete({ where: { id } });
        res.json({ success: true, message: 'Trade order deleted' });
    } catch (error) {
        console.error('deleteTradeOrder error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /api/v1/tradeorder/:id
 * Partial update – supports toggling is_profit and updating status.
 * Called from Trading.jsx → handleProfitUpdate()
 */
const updateTradeOrder = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { is_profit, status } = req.body;

        const data = {};
        if (is_profit !== undefined) data.is_profit = Number(is_profit);
        if (status !== undefined)    data.status    = status;

        const updated = await prisma.tradeOrder.update({ where: { id }, data });
        const formatted = formatOrder(updated);

        // Emit Socket.IO event
        const io = req.app.get('io');
        if (io) {
            io.emit('updateTradeStatus', formatted);
        }

        res.json(formatted);
    } catch (error) {
        console.error('updateTradeOrder error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/v1/tradeorder
 * Creates a new trade order from the frontend Business component.
 */
const createTradeOrder = async (req, res) => {
    try {
        const { 
            order_id, order_type, order_position, user_id, user_wallet,
            wallet_coin_id, trade_coin_id, trade_coin_symbol, amount,
            wallet_amount, profit_amount, purchase_price, wallet_profit_amount,
            delivery_time, profit_level, is_profit 
        } = req.body;

        // Fetch user to get current UUID and employee
        const user = await prisma.user.findUnique({
            where: { id: parseInt(user_id) }
        });

        const order = await prisma.tradeOrder.create({
            data: {
                order_id: order_id.toString(),
                order_type,
                order_position,
                user_id: parseInt(user_id),
                user_wallet,
                wallet_coin_id: wallet_coin_id?.toString(),
                trade_coin_id: trade_coin_id?.toString(),
                trade_coin_symbol,
                amount: amount.toString(),
                wallet_amount: wallet_amount?.toString(),
                profit_amount: profit_amount?.toString(),
                purchase_price: purchase_price?.toString(),
                wallet_profit_amount: wallet_profit_amount?.toString(),
                delivery_time,
                profit_level: profit_level?.toString(),
                is_profit: is_profit ? parseInt(is_profit) : 0,
                status: 'running', // New trades start as running
                user_uuid: user?.uuid || '',
                asigned_employee: user?.employee || 'user',
                wallet_coin_name: 'Tether' // Defaulting based on frontend behavior
            }
        });

        const formatted = formatOrder(order);

        // Emit Socket.IO event
        const io = req.app.get('io');
        if (io) {
            io.emit('newTradeOrder', formatted);
        }

        res.status(201).json(formatted);
    } catch (error) {
        console.error('createTradeOrder error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAllTradeOrders, deleteTradeOrder, updateTradeOrder, createTradeOrder, getUserTradeOrders };
