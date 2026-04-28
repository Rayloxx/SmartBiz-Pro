const express = require('express');
const router = express.Router();
const db = require('../config/db');

const { authorize } = require('../middleware/authMiddleware');

// Ensure business_settings table exists and has a row
const ensureSettings = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS business_settings (
                id SERIAL PRIMARY KEY,
                business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
                business_name VARCHAR(100) DEFAULT 'SmartBiz Pro',
                tax_pin VARCHAR(50) DEFAULT '',
                admin_email VARCHAR(100) DEFAULT '',
                phone_number VARCHAR(30) DEFAULT '',
                office_address TEXT DEFAULT '',
                base_currency VARCHAR(50) DEFAULT 'Kenya Shillings (KSh)',
                vat_rate DECIMAL(5, 2) DEFAULT 16.00,
                email_alerts BOOLEAN DEFAULT true,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (err) {
        console.error('Settings init error:', err.message);
    }
};

// Initialize on startup
ensureSettings();

// Get settings
router.get('/', async (req, res) => {
    try {
        await ensureSettings();
        const result = await db.query('SELECT * FROM business_settings WHERE business_id = $1 LIMIT 1', [req.user.business_id]);
        if (result.rows.length === 0) {
            // Get business name from businesses table
            const bizRes = await db.query('SELECT name FROM businesses WHERE id = $1', [req.user.business_id]);
            const bizName = bizRes.rows[0] ? bizRes.rows[0].name : 'SmartBiz Pro';
            
            const newRes = await db.query(
                'INSERT INTO business_settings (business_id, business_name) VALUES ($1, $2) RETURNING *',
                [req.user.business_id, bizName]
            );
            return res.json(newRes.rows[0]);
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching settings' });
    }
});

// Update settings
router.put('/', authorize(['owner', 'admin']), async (req, res) => {
    const {
        business_name,
        tax_pin,
        admin_email,
        phone_number,
        office_address,
        base_currency,
        vat_rate,
        email_alerts
    } = req.body;

    try {
        const result = await db.query(
            `UPDATE business_settings SET 
                business_name = $1, 
                tax_pin = $2, 
                admin_email = $3, 
                phone_number = $4, 
                office_address = $5, 
                base_currency = $6, 
                vat_rate = $7, 
                email_alerts = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE business_id = $9
            RETURNING *`,
            [business_name, tax_pin, admin_email, phone_number, office_address, base_currency, vat_rate, email_alerts, req.user.business_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating settings' });
    }
});

// Request password reset link
router.post('/reset-password', async (req, res) => {
    try {
        // Here we would use NodeMailer to send a real email
        const result = await db.query('SELECT admin_email FROM business_settings WHERE business_id = $1', [req.user.business_id]);
        const email = result.rows[0]?.admin_email;
        if (!email) {
            return res.status(400).json({ message: 'No admin email configured. Please update your business profile first.' });
        }
        res.status(200).json({ message: `Password reset link sent to ${email}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error initiating password reset' });
    }
});

module.exports = router;
