const prisma = require('../config/db');
const sharp = require('sharp');

/**
 * Helper to compress image buffer and return standard JPEG Base64 Data URI
 */
const fileToBase64 = async (file) => {
    if (!file || !file.buffer) return null;
    try {
        const compressed = await sharp(file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 70 })
            .toBuffer();
        return `data:image/jpeg;base64,${compressed.toString('base64')}`;
    } catch (error) {
        console.error('[fileToBase64] compression error:', error);
        return null;
    }
};

/**
 * Format loan package JSON response keys
 */
const formatPackage = (p) => ({
    id: p.id,
    period_days: p.period_days,
    interest_rate: p.interest_rate,
    min_amount: p.min_amount,
    max_amount: p.max_amount,
    status: p.status,
    created_at: p.createdAt,
    updated_at: p.updatedAt
});

/**
 * Format loan application JSON response keys
 */
const formatLoan = (l) => ({
    id: l.id,
    user_id: l.user_id,
    package_id: l.package_id,
    full_name: l.full_name,
    home_address: l.home_address,
    phone: l.phone,
    loan_amount: l.loan_amount,
    loan_period: l.loan_period,
    interest_rate: l.interest_rate,
    total_repay: l.total_repay,
    status: l.status,
    credit_front: l.credit_front,
    credit_back: l.credit_back,
    id_card: l.id_card,
    reject_reason: l.reject_reason,
    created_at: l.createdAt,
    updated_at: l.updatedAt,
    user_name: l.user?.name || null,
    user_uuid: l.user?.uuid || null
});

// ── User Package Endpoints ─────────────────────────────────────

const getLoanPackages = async (req, res) => {
    try {
        const packages = await prisma.loanPackage.findMany({
            where: { status: 1 },
            orderBy: { period_days: 'asc' }
        });
        res.json(packages.map(formatPackage));
    } catch (error) {
        console.error('getLoanPackages error:', error);
        res.status(500).json({ error: error.message });
    }
};

// ── Admin Package Endpoints ────────────────────────────────────

const getLoanPackagesAdmin = async (req, res) => {
    try {
        const packages = await prisma.loanPackage.findMany({
            orderBy: { period_days: 'asc' }
        });
        res.json(packages.map(formatPackage));
    } catch (error) {
        console.error('getLoanPackagesAdmin error:', error);
        res.status(500).json({ error: error.message });
    }
};

const createLoanPackage = async (req, res) => {
    try {
        const { period_days, interest_rate, min_amount, max_amount, status } = req.body;
        if (!period_days || !interest_rate) {
            return res.status(400).json({ error: 'Period and interest rate are required' });
        }

        const created = await prisma.loanPackage.create({
            data: {
                period_days: parseInt(period_days),
                interest_rate: String(interest_rate),
                min_amount: min_amount ? String(min_amount) : '100',
                max_amount: max_amount ? String(max_amount) : '50000',
                status: status !== undefined ? parseInt(status) : 1
            }
        });
        res.status(201).json(formatPackage(created));
    } catch (error) {
        console.error('createLoanPackage error:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateLoanPackage = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { period_days, interest_rate, min_amount, max_amount, status } = req.body;

        const updateData = {};
        if (period_days !== undefined) updateData.period_days = parseInt(period_days);
        if (interest_rate !== undefined) updateData.interest_rate = String(interest_rate);
        if (min_amount !== undefined) updateData.min_amount = String(min_amount);
        if (max_amount !== undefined) updateData.max_amount = String(max_amount);
        if (status !== undefined) updateData.status = parseInt(status);

        await prisma.loanPackage.update({
            where: { id },
            data: updateData
        });

        res.json({ message: 'Package updated' });
    } catch (error) {
        console.error('updateLoanPackage error:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteLoanPackage = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.loanPackage.delete({
            where: { id }
        });
        res.json({ message: 'Package deleted successfully' });
    } catch (error) {
        console.error('deleteLoanPackage error:', error);
        res.status(500).json({ error: error.message });
    }
};

// ── User Application Endpoints ─────────────────────────────────

const submitLoan = async (req, res) => {
    try {
        const { user_id, package_id, full_name, home_address, phone, loan_amount } = req.body;
        const files = req.files;

        if (!user_id || !package_id || !full_name || !home_address || !phone || !loan_amount) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const parsedAmount = parseFloat(loan_amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: 'Please enter a valid loan amount' });
        }

        // Fetch package to verify limits
        const pkg = await prisma.loanPackage.findUnique({
            where: { id: parseInt(package_id) }
        });
        if (!pkg || pkg.status !== 1) {
            return res.status(400).json({ error: 'Selected loan package is not active' });
        }

        if (parsedAmount < parseFloat(pkg.min_amount)) {
            return res.status(400).json({ error: `Minimum amount is ${pkg.min_amount} USDT` });
        }
        if (parsedAmount > parseFloat(pkg.max_amount)) {
            return res.status(400).json({ error: `Maximum amount is ${pkg.max_amount} USDT` });
        }

        // Verify documents are uploaded
        if (!files || !files.credit_front || !files.credit_back || !files.id_card) {
            return res.status(400).json({ error: 'Please upload all 3 required documents' });
        }

        // Compress and convert to Base64
        const creditFrontBase64 = await fileToBase64(files.credit_front[0]);
        const creditBackBase64 = await fileToBase64(files.credit_back[0]);
        const idCardBase64 = await fileToBase64(files.id_card[0]);

        if (!creditFrontBase64 || !creditBackBase64 || !idCardBase64) {
            return res.status(500).json({ error: 'Image compression/conversion failed' });
        }

        // Calculate total repay amount: principal * (1 + rate / 100)
        const rate = parseFloat(pkg.interest_rate);
        const totalRepay = (parsedAmount * (1 + rate / 100)).toFixed(2);

        const loan = await prisma.loan.create({
            data: {
                user_id: parseInt(user_id),
                package_id: pkg.id,
                full_name,
                home_address,
                phone,
                loan_amount: parsedAmount.toFixed(2),
                loan_period: pkg.period_days,
                interest_rate: pkg.interest_rate,
                total_repay: totalRepay.toString(),
                credit_front: creditFrontBase64,
                credit_back: creditBackBase64,
                id_card: idCardBase64,
                status: 'pending'
            }
        });

        res.status(201).json({
            message: 'Loan application submitted successfully',
            loan: formatLoan(loan)
        });
    } catch (error) {
        console.error('submitLoan error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getMyLoans = async (req, res) => {
    try {
        const userId = parseInt(req.query.user_id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Valid user_id is required' });
        }

        const loans = await prisma.loan.findMany({
            where: { user_id: userId },
            include: { user: true },
            orderBy: { id: 'desc' }
        });

        res.json(loans.map(formatLoan));
    } catch (error) {
        console.error('getMyLoans error:', error);
        res.status(500).json({ error: error.message });
    }
};

// ── Admin Loan Management Endpoints ────────────────────────────

const getAllLoans = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 25 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const whereClause = {};

        // Filter by status if specified and not 'all'
        if (status && status !== 'all') {
            whereClause.status = status;
        }

        // Search filter (searches in user UUID, full name, phone, or name)
        if (search) {
            whereClause.OR = [
                { full_name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { user: { uuid: { contains: search, mode: 'insensitive' } } },
                { user: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const totalLoans = await prisma.loan.count({ where: whereClause });
        const totalPages = Math.ceil(totalLoans / limitNum);

        const loans = await prisma.loan.findMany({
            where: whereClause,
            include: { user: true },
            orderBy: { id: 'desc' },
            skip: (pageNum - 1) * limitNum,
            take: limitNum
        });

        res.json({
            loans: loans.map(formatLoan),
            totalPages: totalPages === 0 ? 1 : totalPages
        });
    } catch (error) {
        console.error('getAllLoans error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getLoanById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const loan = await prisma.loan.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!loan) {
            return res.status(404).json({ error: 'Loan application not found' });
        }

        res.json(formatLoan(loan));
    } catch (error) {
        console.error('getLoanById error:', error);
        res.status(500).json({ error: error.message });
    }
};

const approveLoan = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const loan = await prisma.loan.findUnique({
            where: { id }
        });

        if (!loan) {
            return res.status(404).json({ error: 'Loan application not found' });
        }
        if (loan.status === 'approved') {
            return res.status(400).json({ error: 'Loan is already approved' });
        }

        const loanAmount = parseFloat(loan.loan_amount);

        // Fetch user and wallet inside a transaction to credit funds atomically
        const [updatedWallet, updatedUser, updatedLoan] = await prisma.$transaction(async (tx) => {
            // Find user
            const user = await tx.user.findUnique({
                where: { id: loan.user_id }
            });
            if (!user) {
                throw new Error('User account not found');
            }

            // Find or create USDT TRC20 wallet (coin ID 518)
            let wallet = await tx.wallet.findFirst({
                where: { user_id: loan.user_id, coin_id: '518' }
            });

            if (!wallet) {
                wallet = await tx.wallet.create({
                    data: {
                        user_id: loan.user_id,
                        coin_id: '518',
                        coin_name: 'Tether',
                        coin_symbol: 'USDT',
                        wallet_network: 'TRC20',
                        wallet_address: `usdt_${loan.user_id}`,
                        coin_amount: '0.0000000',
                        usd_amount: '0.00',
                        status: 'active'
                    }
                });
            }

            // Increment balances
            const newCoinAmount = (parseFloat(wallet.coin_amount) + loanAmount).toFixed(7);
            const newBalance = (parseFloat(user.balance) + loanAmount).toFixed(7);

            // Update wallet
            const uWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: { coin_amount: newCoinAmount }
            });

            // Update user balance
            const uUser = await tx.user.update({
                where: { id: user.id },
                data: { balance: newBalance }
            });

            // Update loan status
            const uLoan = await tx.loan.update({
                where: { id: loan.id },
                data: { status: 'approved' }
            });

            return [uWallet, uUser, uLoan];
        });

        res.json({
            message: 'Loan approved successfully',
            loan: formatLoan(updatedLoan)
        });
    } catch (error) {
        console.error('approveLoan error:', error);
        res.status(500).json({ error: error.message });
    }
};

const rejectLoan = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { reject_reason } = req.body;

        const loan = await prisma.loan.findUnique({
            where: { id }
        });

        if (!loan) {
            return res.status(404).json({ error: 'Loan application not found' });
        }

        const updated = await prisma.loan.update({
            where: { id },
            data: {
                status: 'rejected',
                reject_reason: reject_reason || 'Documents could not be verified'
            }
        });

        res.json({
            message: 'Loan rejected successfully',
            loan: formatLoan(updated)
        });
    } catch (error) {
        console.error('rejectLoan error:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteLoan = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.loan.delete({
            where: { id }
        });
        res.json({ message: 'Loan deleted successfully' });
    } catch (error) {
        console.error('deleteLoan error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getLoanPackages,
    getLoanPackagesAdmin,
    createLoanPackage,
    updateLoanPackage,
    deleteLoanPackage,
    submitLoan,
    getMyLoans,
    getAllLoans,
    getLoanById,
    approveLoan,
    rejectLoan,
    deleteLoan
};
