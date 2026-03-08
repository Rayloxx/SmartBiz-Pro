const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all expenses
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM expenses ORDER BY expense_date DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching expenses' });
    }
});

// Add new expense
router.post('/', async (req, res) => {
    const { category, description, amount, reference_code } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO expenses (category, description, amount) VALUES ($1, $2, $3) RETURNING *',
            [category, description, amount]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error recording expense' });
    }
});

module.exports = router;
