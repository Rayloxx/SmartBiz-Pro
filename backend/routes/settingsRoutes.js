const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get settings
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM business_settings LIMIT 1');
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching settings' });
    }
});

// Update settings
router.put('/', async (req, res) => {
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
            WHERE id = (SELECT id FROM business_settings LIMIT 1)
            RETURNING *`,
            [business_name, tax_pin, admin_email, phone_number, office_address, base_currency, vat_rate, email_alerts]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating settings' });
    }
});

module.exports = router;
