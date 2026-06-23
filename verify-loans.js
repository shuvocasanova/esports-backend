const prisma = require('./config/db');
const {
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
} = require('./controllers/loanController');

const testUserId = 1; // Seeded superadmin user

// Helper to mock express req/res
const createMockRes = () => {
    const res = {
        statusCode: 200,
        headers: {},
        body: null,
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        setHeader: function(key, val) {
            this.headers[key] = val;
            return this;
        },
        json: function(data) {
            this.body = data;
            return this;
        },
        send: function(data) {
            this.body = data;
            return this;
        }
    };
    return res;
};

async function verifyLoans() {
    try {
        console.log('=== STARTING LOAN FEATURE VERIFICATION ===');

        // Clear existing records to ensure clean testing environment
        await prisma.loan.deleteMany({});
        await prisma.loanPackage.deleteMany({});
        console.log('Cleared previous loan records and packages.');

        // Initialize User balance and USDT wallet
        const user = await prisma.user.findUnique({ where: { id: testUserId } });
        if (!user) {
            throw new Error(`Test User ID ${testUserId} not found in DB`);
        }
        await prisma.user.update({
            where: { id: testUserId },
            data: { balance: '1000.0000000' } // set clean baseline
        });

        let wallet = await prisma.wallet.findFirst({
            where: { user_id: testUserId, coin_id: '518' }
        });
        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: {
                    user_id: testUserId,
                    coin_id: '518',
                    coin_name: 'Tether',
                    coin_symbol: 'USDT',
                    wallet_network: 'TRC20',
                    wallet_address: 'TRoUN267tVLHRMRViCDcur98yZfLroEXmL',
                    coin_amount: '1000.0000000',
                    usd_amount: '1000.00'
                }
            });
        } else {
            wallet = await prisma.wallet.update({
                where: { id: wallet.id },
                data: { coin_amount: '1000.0000000' }
            });
        }
        console.log('Reset test user balances: Main User Balance = 1000.00, USDT Wallet Balance = 1000.00');

        // 1. Create Loan Packages (Admin)
        console.log('\n--- 1. Testing Package Creation & Updates ---');
        const reqCreate1 = {
            body: {
                period_days: '30',
                interest_rate: '5.00',
                min_amount: '100',
                max_amount: '5000',
                status: 1
            }
        };
        const resCreate1 = createMockRes();
        await createLoanPackage(reqCreate1, resCreate1);
        const pkg1 = resCreate1.body;
        console.log('Created package 1:', pkg1);

        const reqCreate2 = {
            body: {
                period_days: '60',
                interest_rate: '8.00',
                min_amount: '500',
                max_amount: '10000',
                status: 0 // Inactive
            }
        };
        const resCreate2 = createMockRes();
        await createLoanPackage(reqCreate2, resCreate2);
        const pkg2 = resCreate2.body;
        console.log('Created package 2 (Inactive):', pkg2);

        // Test list packages for user (only active status = 1 should show)
        const resListUser = createMockRes();
        await getLoanPackages({}, resListUser);
        console.log(`Active packages visible to users: ${resListUser.body.length} (Expected: 1)`);
        if (resListUser.body.length !== 1) {
            throw new Error('User active package listing filter failed!');
        }

        // Test update package
        const reqUpdate = {
            params: { id: pkg2.id },
            body: { status: 1 } // Activate it
        };
        const resUpdate = createMockRes();
        await updateLoanPackage(reqUpdate, resUpdate);
        
        const resListUser2 = createMockRes();
        await getLoanPackages({}, resListUser2);
        console.log(`Active packages visible to users after activation: ${resListUser2.body.length} (Expected: 2)`);
        if (resListUser2.body.length !== 2) {
            throw new Error('Updating loan package status failed!');
        }

        // 2. Submit Loan Application (User)
        console.log('\n--- 2. Testing Loan Application Submission (Direct Base64 Conversion) ---');
        
        // Dummy 1x1 pixel PNG buffers to test multer fields image conversion
        const dummyPngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        const mockFiles = {
            credit_front: [{ buffer: dummyPngBuffer, originalname: 'front.png' }],
            credit_back: [{ buffer: dummyPngBuffer, originalname: 'back.png' }],
            id_card: [{ buffer: dummyPngBuffer, originalname: 'id.png' }]
        };

        const reqSubmit = {
            body: {
                user_id: testUserId.toString(),
                package_id: pkg1.id.toString(),
                full_name: 'John Doe',
                home_address: '123 Main St, Springfield',
                phone: '+1 555 123 4567',
                loan_amount: '2000' // Within 100-5000 range
            },
            files: mockFiles
        };
        const resSubmit = createMockRes();
        await submitLoan(reqSubmit, resSubmit);
        
        if (resSubmit.statusCode !== 201) {
            throw new Error(`Loan submission failed with status code ${resSubmit.statusCode}: ${JSON.stringify(resSubmit.body)}`);
        }

        const submittedLoan = resSubmit.body.loan;
        console.log(`Loan submitted successfully! Loan ID: ${submittedLoan.id}`);
        console.log(`Interest rate applied: ${submittedLoan.interest_rate}%, Loan Period: ${submittedLoan.loan_period} days`);
        console.log(`Total repay amount: ${submittedLoan.total_repay} USDT (Expected: 2100.00 USDT)`);
        console.log('Credit Front preview:', submittedLoan.credit_front.substring(0, 50) + '...');

        if (submittedLoan.total_repay !== '2100.00' || !submittedLoan.credit_front.startsWith('data:image')) {
            throw new Error('Loan calculations or Base64 document conversions are incorrect!');
        }

        // 3. Test Retrieve My Loans & Admin Filter/Search
        console.log('\n--- 3. Testing Loan Retrieval & Admin Searches ---');
        const reqMyLoans = { query: { user_id: testUserId.toString() } };
        const resMyLoans = createMockRes();
        await getMyLoans(reqMyLoans, resMyLoans);
        console.log(`User retrieved ${resMyLoans.body.length} loans (Expected: 1)`);

        const reqAllLoansSearch = { query: { search: 'John' } };
        const resAllLoansSearch = createMockRes();
        await getAllLoans(reqAllLoansSearch, resAllLoansSearch);
        console.log(`Admin search for 'John' returned: ${resAllLoansSearch.body.loans.length} matches`);
        if (resAllLoansSearch.body.loans.length !== 1) {
            throw new Error('Admin loan search parsing failed!');
        }

        // 4. Test Loan Rejection (Admin)
        console.log('\n--- 4. Testing Loan Rejection ---');
        const reqReject = {
            params: { id: submittedLoan.id },
            body: { reject_reason: 'Documents are blurred' }
        };
        const resReject = createMockRes();
        await rejectLoan(reqReject, resReject);
        console.log(`Loan rejected. Status: ${resReject.body.loan.status}. Reason: "${resReject.body.loan.reject_reason}"`);
        if (resReject.body.loan.status !== 'rejected' || resReject.body.loan.reject_reason !== 'Documents are blurred') {
            throw new Error('Loan rejection path failed!');
        }

        // 5. Test Loan Approval & Wallet Balance Credit (Admin)
        console.log('\n--- 5. Testing Loan Approval & Atomic Balance Credit ---');
        
        // Submit a second loan application to approve
        const reqSubmit2 = {
            body: {
                user_id: testUserId.toString(),
                package_id: pkg1.id.toString(),
                full_name: 'John Doe',
                home_address: '123 Main St, Springfield',
                phone: '+1 555 123 4567',
                loan_amount: '3000'
            },
            files: mockFiles
        };
        const resSubmit2 = createMockRes();
        await submitLoan(reqSubmit2, resSubmit2);
        const secondLoan = resSubmit2.body.loan;

        const reqApprove = { params: { id: secondLoan.id } };
        const resApprove = createMockRes();
        await approveLoan(reqApprove, resApprove);
        
        console.log('Approve handler response status:', resApprove.statusCode);
        console.log(`Loan approved. Status: ${resApprove.body.loan.status}`);

        // Verify database balances updated atomically
        const updatedUser = await prisma.user.findUnique({ where: { id: testUserId } });
        const updatedWallet = await prisma.wallet.findFirst({
            where: { user_id: testUserId, coin_id: '518' }
        });

        console.log(`Post-approval Main Balance: ${updatedUser.balance} USDT (Expected: 4000.00)`);
        console.log(`Post-approval USDT Wallet Balance: ${updatedWallet.coin_amount} USDT (Expected: 4000.00)`);

        if (parseFloat(updatedUser.balance) !== 4000.0 || parseFloat(updatedWallet.coin_amount) !== 4000.0) {
            throw new Error('USDT wallet or main user balance was not updated correctly upon approval!');
        }

        console.log('\n✅ ALL LOAN VERIFICATION CHECKS PASSED SUCCESSFULLY!');
        await prisma.$disconnect();
    } catch (error) {
        console.error('\n❌ VERIFICATION TEST FAILED:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

verifyLoans();
