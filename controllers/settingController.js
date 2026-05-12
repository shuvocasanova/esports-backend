const prisma = require('../config/db');

// Fields returned by the live API (flat — no wrapper object)
const formatSettings = (s) => ({
    id:                            s.id,
    referral_registration_status:  s.referral_registration_status,
    referral_registration_bonus:   s.referral_registration_bonus,
    referral_deposit_bonus_status: s.referral_deposit_bonus_status,
    referral_deposit_bonus:        s.referral_deposit_bonus,
    trade_amount_limit:            s.trade_amount_limit,
    deposit_limit:                 s.deposit_limit,
    withdrawal_limit:              s.withdrawal_limit,
    notice:                        s.notice,
    hero_bg_color:                 s.hero_bg_color,
    hero_text_color:               s.hero_text_color,
    btn_bg_color:                  s.btn_bg_color,
    btn_text_color:                s.btn_text_color,
    email:                         s.email,
    whatsapp:                      s.whatsapp,
});

/**
 * GET /api/v1/settings
 * Returns settings as a flat object (frontend uses setFormData(data) directly)
 */
const getSettings = async (req, res) => {
    try {
        let settings = await prisma.settings.findFirst();
        if (!settings) {
            settings = await prisma.settings.create({ data: {} });
        }
        res.json(formatSettings(settings));
    } catch (error) {
        console.error('getSettings error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /api/v1/settings
 * Upsert — updates the single settings row (or creates it)
 */
const updateSettings = async (req, res) => {
    try {
        const {
            referral_registration_status,
            referral_registration_bonus,
            referral_deposit_bonus_status,
            referral_deposit_bonus,
            trade_amount_limit,
            deposit_limit,
            withdrawal_limit,
            notice,
            hero_bg_color,
            hero_text_color,
            btn_bg_color,
            btn_text_color,
        } = req.body;

        const data = {
            ...(referral_registration_status  !== undefined && { referral_registration_status }),
            ...(referral_registration_bonus   !== undefined && { referral_registration_bonus }),
            ...(referral_deposit_bonus_status !== undefined && { referral_deposit_bonus_status }),
            ...(referral_deposit_bonus        !== undefined && { referral_deposit_bonus }),
            ...(trade_amount_limit            !== undefined && { trade_amount_limit }),
            ...(deposit_limit                 !== undefined && { deposit_limit }),
            ...(withdrawal_limit              !== undefined && { withdrawal_limit }),
            ...(notice                        !== undefined && { notice }),
            ...(hero_bg_color                 !== undefined && { hero_bg_color }),
            ...(hero_text_color               !== undefined && { hero_text_color }),
            ...(btn_bg_color                  !== undefined && { btn_bg_color }),
            ...(btn_text_color                !== undefined && { btn_text_color }),
            ...(req.body.email                !== undefined && { email:    req.body.email }),
            ...(req.body.whatsapp             !== undefined && { whatsapp: req.body.whatsapp }),
        };

        let settings = await prisma.settings.findFirst();
        if (!settings) {
            settings = await prisma.settings.create({ data });
        } else {
            settings = await prisma.settings.update({ where: { id: settings.id }, data });
        }
        res.json(formatSettings(settings));
    } catch (error) {
        console.error('updateSettings error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/v1/settings/stats
 * Used by Sidebar to show pending deposit/withdrawal badge counts.
 */
const getStats = async (req, res) => {
    try {
        const [pendingDepositsCount, pendingWithdrawalsCount] = await Promise.all([
            prisma.transaction.count({ where: { type: 'deposit',    status: 'pending' } }),
            prisma.transaction.count({ where: { type: 'withdrawal', status: 'pending' } }),
        ]);
        res.json({ pendingDepositsCount, pendingWithdrawalsCount });
    } catch (error) {
        console.error('getStats error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getSettings, updateSettings, getStats };
