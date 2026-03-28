const Razorpay = require('razorpay');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const { createNotification } = require('../utils/notification');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
    try {
        const { amount } = req.body; // Amount in INR rupees

        if (!amount || amount < 100) {
            return res.status(400).json({ success: false, message: 'Minimum amount goes here is ₹100' });
        }

        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}_${req.user.id}`
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Failed to initiate payment' });
    }
};

// ─── VERIFY PAYMENT ───────────────────────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const userId = req.user.id; // Corrected variable

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
        return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    const transaction = await sequelize.transaction();

    try {
        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
        }

        // Add to wallet
        await sequelize.query(
            `UPDATE users SET wallet_balance = wallet_balance + :amount WHERE id = :userId`,
            { replacements: { amount, userId }, type: QueryTypes.UPDATE, transaction }
        );

        // Save transaction
        await sequelize.query(
            `INSERT INTO billing_transactions 
            (user_id, amount, transaction_type, description, payment_method, status, razorpay_order_id)
            VALUES (:userId, :amount, 'credit', 'Wallet Top-up', 'razorpay', 'completed', :razorpay_order_id)`,
            { replacements: { userId, amount, razorpay_order_id }, type: QueryTypes.INSERT, transaction }
        );

        await transaction.commit();

        // TRIGGER IN BILLING AFTER TOP-UP
        await createNotification(
            userId,
            'payment_success',
            'Money Added Successfully',
            `₹${amount} has been added to your wallet via Razorpay.`,
            '/billing'
        );

        // Return updated balance
        const [userDb] = await sequelize.query(
            'SELECT wallet_balance FROM users WHERE id = :userId',
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        res.status(200).json({
            success: true,
            message: 'Money added successfully',
            new_balance: parseFloat(userDb.wallet_balance) || 0
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Failed to verify payment' });
    }
};

// ─── GET TRANSACTIONS ─────────────────────────────────────────────────────────
exports.getTransactions = async (req, res) => {
    const userId = req.user.id;
    const { type = 'All', sort = 'Newest', page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT * FROM billing_transactions WHERE user_id = :userId';
        const replacements = { userId, limit: parseInt(limit), offset: parseInt(offset) };

        if (type !== 'All') {
            if (type === 'Credits') {
                query += " AND transaction_type = 'credit' AND description NOT LIKE '%Refund%'";
            } else if (type === 'Debits') {
                query += " AND transaction_type = 'debit'";
            } else if (type === 'Refunds') {
                query += " AND transaction_type = 'credit' AND description LIKE '%Refund%'";
            }
        }

        if (sort === 'Oldest') {
            query += ' ORDER BY created_at ASC';
        } else {
            query += ' ORDER BY created_at DESC';
        }

        query += ' LIMIT :limit OFFSET :offset';

        const transactions = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });

        // Get total counts
        let countQuery = 'SELECT COUNT(*) as total FROM billing_transactions WHERE user_id = :userId';
        if (type !== 'All') {
            if (type === 'Credits') countQuery += " AND transaction_type = 'credit' AND description NOT LIKE '%Refund%'";
            else if (type === 'Debits') countQuery += " AND transaction_type = 'debit'";
            else if (type === 'Refunds') countQuery += " AND transaction_type = 'credit' AND description LIKE '%Refund%'";
        }

        const [countResult] = await sequelize.query(countQuery, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        // Get Summary Stats
        const [statsResult] = await sequelize.query(`
            SELECT 
                SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END) as total_spent,
                SUM(CASE WHEN transaction_type = 'credit' AND description LIKE '%Refund%' THEN amount ELSE 0 END) as total_refunds
            FROM billing_transactions 
            WHERE user_id = :userId AND status = 'completed'
        `, { replacements: { userId }, type: QueryTypes.SELECT });


        res.status(200).json({
            success: true,
            transactions,
            total_count: countResult.total,
            total_spent: parseFloat(statsResult.total_spent) || 0,
            total_refunds: parseFloat(statsResult.total_refunds) || 0
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
    }
};

// ─── GET WALLET BALANCE ───────────────────────────────────────────────────────
exports.getWalletBalance = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user] = await sequelize.query(
            'SELECT wallet_balance FROM users WHERE id = :userId',
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            balance: parseFloat(user.wallet_balance) || 0
        });
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch wallet balance' });
    }
};

// ─── DOWNLOAD INVOICE ─────────────────────────────────────────────────────────
exports.downloadInvoice = async (req, res) => {
    const { transaction_id } = req.params;
    const userId = req.user.id;

    try {
        const [transaction] = await sequelize.query(
            'SELECT * FROM billing_transactions WHERE transaction_id = :transaction_id AND user_id = :userId',
            { replacements: { transaction_id, userId }, type: QueryTypes.SELECT }
        );

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        const [user] = await sequelize.query(
            'SELECT full_name, phone FROM users WHERE id = :userId',
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${transaction_id}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('NYAYA \u2696', { align: 'left', continued: true })
            .fontSize(16).text('TAX INVOICE', { align: 'right' });
        doc.moveDown();

        // Invoice Details
        doc.fontSize(10).text(`Invoice #: ${transaction.transaction_id}`);
        doc.text(`Date: ${new Date(transaction.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`);
        doc.moveDown();

        // Billed To
        doc.fontSize(12).text('Billed To:');
        doc.fontSize(10).text(`${user.full_name}`);
        doc.text(`${user.phone || 'N/A'}`);
        doc.moveDown();

        // Service Details
        doc.fontSize(12).text('Service Details:');
        doc.fontSize(10).text(`Description: ${transaction.description}`);
        // If it's a call/appointment, we'd ideally fetch advocate name/duration based on a linked reference. 
        // For simplicity, we just show the description and amount.
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Math for GST (assuming amount includes GST for simplicity, or we compute it. Let's compute Base + 18% GST = Total)
        // If total = amount, Base = amount / 1.18, GST = amount - Base.
        const totalAmount = parseFloat(transaction.amount);
        const baseAmount = totalAmount / 1.18;
        const gstAmount = totalAmount - baseAmount;

        doc.text('Subtotal:', { align: 'left', continued: true }).text(`INR ${baseAmount.toFixed(2)}`, { align: 'right' });
        doc.text('GST (18%):', { align: 'left', continued: true }).text(`INR ${gstAmount.toFixed(2)}`, { align: 'right' });
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('Total:', { align: 'left', continued: true }).text(`INR ${totalAmount.toFixed(2)}`, { align: 'right' });
        doc.font('Helvetica');
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        doc.fontSize(10).text(`Payment: ${transaction.payment_method || 'Wallet'}`);
        doc.text(`Status: \u2705 ${transaction.status.toUpperCase()}`);

        doc.moveDown(3);
        doc.fontSize(8).text('DPDPA 2023 Compliant', { align: 'center', color: 'gray' });

        doc.end();

    } catch (error) {
        console.error('Error generating invoice:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Failed to generate invoice' });
        }
    }
};

// ─── RAISE DISPUTE ────────────────────────────────────────────────────────────
exports.raiseDispute = async (req, res) => {
    const { transaction_id, reason, description } = req.body;
    const userId = req.user.id;

    if (!transaction_id || !reason || !description || description.length < 20) {
        return res.status(400).json({ success: false, message: 'Valid transaction ID, reason, and a description of at least 20 characters are required.' });
    }

    try {
        // Verify transaction exists and belongs to user
        const [transaction] = await sequelize.query(
            'SELECT * FROM billing_transactions WHERE transaction_id = :transaction_id AND user_id = :userId',
            { replacements: { transaction_id, userId }, type: QueryTypes.SELECT }
        );

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found.' });
        }

        // Verify it was within 7 days
        const txnDate = new Date(transaction.created_at);
        const daysDifference = (Date.now() - txnDate.getTime()) / (1000 * 3600 * 24);

        if (daysDifference > 7) {
            return res.status(400).json({ success: false, message: 'Disputes can only be raised within 7 days of the transaction.' });
        }

        // Insert Dispute
        await sequelize.query(
            `INSERT INTO disputes(user_id, transaction_id, reason, description, status) 
              VALUES(: userId, : transaction_id, : reason, : description, 'open')`,
            { replacements: { userId, transaction_id, reason, description }, type: QueryTypes.INSERT }
        );

        // Update transaction status
        await sequelize.query(
            `UPDATE billing_transactions SET status = 'disputed' WHERE transaction_id = : transaction_id`,
            { replacements: { transaction_id }, type: QueryTypes.UPDATE }
        );

        res.status(201).json({
            success: true,
            message: 'Dispute raised successfully. Admin will review within 48 hours.'
        });

    } catch (error) {
        console.error('Error raising dispute:', error);
        res.status(500).json({ success: false, message: 'Failed to raise dispute' });
    }
};
