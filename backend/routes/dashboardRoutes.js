const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET dashboard metrics
router.get('/', async (req, res) => {
    try {
        const bId = req.user.business_id;
        const revenueRes = await db.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE business_id = $1', [bId]);
        const profitRes = await db.query('SELECT COALESCE(SUM(profit), 0) as total FROM sales WHERE business_id = $1', [bId]);
        const expenseRes = await db.query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE business_id = $1', [bId]);
        const salesCountRes = await db.query('SELECT COUNT(*) as count FROM sales WHERE business_id = $1', [bId]);
        const inventoryValueRes = await db.query('SELECT COALESCE(SUM(price * stock_quantity), 0) as total FROM products WHERE business_id = $1', [bId]);
        const lowStockRes = await db.query('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= 20 AND business_id = $1', [bId]);
        const lowMaterialRes = await db.query('SELECT COUNT(*) as count FROM raw_materials WHERE stock_quantity <= reorder_level AND business_id = $1', [bId]);

        // Cashier specific scoping
        const mySalesRes = await db.query(
            "SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM sale_transactions WHERE business_id = $1 AND cashier_id = $2 AND created_at >= DATE_TRUNC('day', NOW())",
            [bId, req.user.id]
        );

        // Get weekly revenue trend
        const weeklyRes = await db.query(`
            SELECT
                TO_CHAR(DATE_TRUNC('day', sale_date), 'Dy') as day_name,
                SUM(total_amount) as revenue,
                SUM(profit) as profit
            FROM sales
            WHERE sale_date >= NOW() - INTERVAL '7 days' AND business_id = $1
            GROUP BY DATE_TRUNC('day', sale_date), TO_CHAR(DATE_TRUNC('day', sale_date), 'Dy')
            ORDER BY DATE_TRUNC('day', sale_date) ASC
        `, [bId]);

        res.json({
            revenue: Number(revenueRes.rows[0].total),
            profit: Number(profitRes.rows[0].total),
            expenses: Number(expenseRes.rows[0].total),
            netProfit: Number(profitRes.rows[0].total) - Number(expenseRes.rows[0].total),
            salesCount: Number(salesCountRes.rows[0].count),
            inventoryValue: Number(inventoryValueRes.rows[0].total),
            lowStockItems: Number(lowStockRes.rows[0].count),
            lowMaterialItems: Number(lowMaterialRes.rows[0].count),
            weeklyTrend: weeklyRes.rows,
            mySalesToday: Number(mySalesRes.rows[0].total),
            mySalesCount: Number(mySalesRes.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching dashboard data' });
    }
});

module.exports = router;
