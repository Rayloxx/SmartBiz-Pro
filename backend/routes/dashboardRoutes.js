const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get dashboard metrics
router.get('/', async (req, res) => {
    try {
        const revenueRes = await db.query('SELECT SUM(total_amount) as total FROM sales');
        const profitRes = await db.query('SELECT SUM(profit) as total FROM sales');
        const expenseRes = await db.query('SELECT SUM(amount) as total FROM expenses');
        const salesCountRes = await db.query('SELECT COUNT(*) as count FROM sales');
        const inventoryValueRes = await db.query('SELECT SUM(price * stock_quantity) as total FROM products');

        res.json({
            revenue: Number(revenueRes.rows[0].total || 0),
            profit: Number(profitRes.rows[0].total || 0),
            expenses: Number(expenseRes.rows[0].total || 0),
            netProfit: Number(profitRes.rows[0].total || 0) - Number(expenseRes.rows[0].total || 0),
            salesCount: Number(salesCountRes.rows[0].count || 0),
            inventoryValue: Number(inventoryValueRes.rows[0].total || 0)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching dashboard data' });
    }
});

module.exports = router;
