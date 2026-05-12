const prisma = require('../config/db');

// Response shape matches live API exactly: {id, timer, profit, mini_usdt}
const formatTimer = (t) => ({
    id:        t.id,
    timer:     t.timer,
    profit:    t.profit,
    mini_usdt: t.mini_usdt,
});

/**
 * GET /api/v1/timerprofits
 * Returns all timer profit configs ordered by id ascending.
 */
const getAllTimerProfits = async (req, res) => {
    try {
        const timers = await prisma.timerProfit.findMany({ orderBy: { id: 'asc' } });
        res.json(timers.map(formatTimer));
    } catch (error) {
        console.error('getAllTimerProfits error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/v1/timerprofits
 * Creates a new timer profit entry.
 * Request body: { timer, profit, mini_usdt }
 * Response: { id, timer, profit, mini_usdt }
 */
const createTimerProfit = async (req, res) => {
    try {
        const { timer, profit, mini_usdt } = req.body;
        const created = await prisma.timerProfit.create({
            data: { timer, profit: String(profit), mini_usdt: String(mini_usdt) },
        });
        res.status(201).json(formatTimer(created));
    } catch (error) {
        console.error('createTimerProfit error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /api/v1/timerprofits/:id
 * Updates an existing timer profit entry.
 * Called from UpdateTimer.jsx
 */
const updateTimerProfit = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { timer, profit, mini_usdt } = req.body;
        const updated = await prisma.timerProfit.update({
            where: { id },
            data: {
                ...(timer     !== undefined && { timer }),
                ...(profit    !== undefined && { profit:    String(profit) }),
                ...(mini_usdt !== undefined && { mini_usdt: String(mini_usdt) }),
            },
        });
        res.json(formatTimer(updated));
    } catch (error) {
        console.error('updateTimerProfit error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/v1/timerprofits/:id
 * Response: { message: "Timer profit deleted successfully" }
 */
const deleteTimerProfit = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.timerProfit.delete({ where: { id } });
        res.json({ message: 'Timer profit deleted successfully' });
    } catch (error) {
        console.error('deleteTimerProfit error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAllTimerProfits, createTimerProfit, updateTimerProfit, deleteTimerProfit };
