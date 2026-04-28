const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const mpesaService = require('../services/mpesaService');
const mpesaController = require('../controllers/mpesaController');
const kraService = require('../services/kraService');
const db = require('../config/db');
const { authorize } = require('../middleware/authMiddleware');

// ==========================================
// AI FEATURES ENDPOINTS
// ==========================================
router.get('/ai/predict-sales', authorize(['owner', 'admin', 'manager']), async (req, res) => {
    try {
        const businessId = req.user.business_id;
        const days = Number(req.query.days) || 7;
        const predictions = await aiService.predictSales(businessId, days);
        res.status(200).json({ success: true, predictions });
    } catch (error) {
        console.error('AI Predict Sales Error:', error);
        res.status(500).json({ success: false, message: 'Failed to predict sales' });
    }
});

router.get('/ai/inventory-alerts', authorize(['owner', 'admin', 'manager', 'inventory_staff']), async (req, res) => {
    try {
        const businessId = req.user.business_id;
        const alerts = await aiService.generateInventoryAlerts(businessId);
        res.status(200).json({ success: true, alerts });
    } catch (error) {
        console.error('AI Inventory Alerts Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate inventory alerts' });
    }
});

router.get('/ai/insights', authorize(['owner', 'admin']), async (req, res) => {
    try {
        const businessId = req.user.business_id;
        const insights = await aiService.generateBusinessInsights(businessId);
        res.status(200).json({ success: true, insights });
    } catch (error) {
        console.error('AI Insights Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate business insights' });
    }
});

// ==========================================
// M-PESA DARAJA V3.0 ENDPOINTS
// ==========================================
router.post('/mpesa/stkpush', authorize(['owner', 'admin', 'cashier']), async (req, res) => {
    const { phone_number, amount, reference, sale_id } = req.body;
    if (!phone_number || !amount) {
        return res.status(400).json({ success: false, message: 'Phone number and amount are required' });
    }
    
    try {
        const result = await mpesaService.initiateSTKPush(phone_number, amount, reference, sale_id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/mpesa/callback', mpesaController.processMpesaCallback);

router.get('/mpesa/status/:requestId', authorize(['owner', 'admin', 'cashier']), async (req, res) => {
    try {
        const result = await mpesaService.checkTransactionStatus(req.params.requestId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Match Payment logic extracted properly
async function matchPaymentToSale(amount, code, phone) {
    await db.query('BEGIN');
    try {
        const matchRes = await db.query(`
            SELECT * FROM sale_transactions 
            WHERE status = 'AWAITING_PAYMENT' AND total_amount = $1 AND created_at >= NOW() - INTERVAL '15 minutes'
            ORDER BY created_at DESC LIMIT 1
        `, [amount]);

        if (matchRes.rows.length > 0) {
            const saleTx = matchRes.rows[0];
            await db.query(
                "UPDATE sale_transactions SET status = 'PAID', mpesa_code = $1 WHERE id = $2",
                [code, saleTx.id]
            );
            await db.query(
                "UPDATE mpesa_transactions SET status = 'MATCHED', linked_sale_id = $1 WHERE transaction_code = $2",
                [saleTx.id, code]
            );
        }
        await db.query('COMMIT');
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Reconciliation internal fail:', err);
    }
}

// ==========================================
// KRA eTIMS ENDPOINTS
// ==========================================
router.post('/kra/generate-invoice', authorize(['owner', 'admin', 'cashier']), async (req, res) => {
    const { saleId } = req.body;
    const businessId = req.user.business_id;

    if (!saleId) {
        return res.status(400).json({ success: false, message: 'Sale ID is required' });
    }

    try {
        const payload = await kraService.generateInvoicePayload(saleId, businessId);
        res.status(200).json({ success: true, data: payload });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/kra/send-invoice', authorize(['owner', 'admin', 'cashier']), async (req, res) => {
    const { saleId } = req.body;
    const businessId = req.user.business_id;

    if (!saleId) {
        return res.status(400).json({ success: false, message: 'Sale ID is required' });
    }

    try {
        const result = await kraService.sendInvoiceToKRA(saleId, businessId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
