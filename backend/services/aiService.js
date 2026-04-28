const db = require('../config/db');

// Simple linear regression helper
function calculateLinearRegression(dataPoints) {
    // dataPoints = [{x: 1, y: 100}, {x: 2, y: 150}, ...]
    const n = dataPoints.length;
    if (n === 0) return { slope: 0, intercept: 0 };
    if (n === 1) return { slope: 0, intercept: dataPoints[0].y };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    dataPoints.forEach(point => {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumX2 += point.x * point.x;
    });

    const denominator = (n * sumX2 - sumX * sumX);
    if (denominator === 0) return { slope: 0, intercept: sumY / n };

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

async function predictSales(businessId, daysToPredict = 7) {
    // Fetch last 30 days of sales
    const query = `
        SELECT DATE(created_at) as date, SUM(total_amount) as daily_total
        FROM sale_transactions
        WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    `;
    const res = await db.query(query, [businessId]);

    // Format data for regression
    const dataPoints = res.rows.map((row, index) => ({
        x: index + 1,
        y: Number(row.daily_total)
    }));

    const { slope, intercept } = calculateLinearRegression(dataPoints);

    // Predict upcoming days
    const predictions = [];
    const baseline = dataPoints.length;
    
    for (let i = 1; i <= daysToPredict; i++) {
        const predictedY = (slope * (baseline + i)) + intercept;
        // Don't predict negative sales
        const safeVolume = Math.max(0, predictedY);
        
        predictions.push({
            day: `Day +${i}`,
            predictedAmount: parseFloat(safeVolume.toFixed(2))
        });
    }

    return predictions;
}

// Predict low stock before it happens
async function generateInventoryAlerts(businessId) {
    // We look at sales velocity over the last 14 days
    const query = `
        SELECT p.id, p.name, p.stock_quantity, p.reorder_level, 
               COALESCE(SUM(s.quantity), 0) as sold_last_14_days
        FROM products p
        LEFT JOIN sales s ON p.id = s.product_id
        LEFT JOIN sale_transactions t ON s.transaction_id = t.id AND t.created_at >= NOW() - INTERVAL '14 days'
        WHERE p.business_id = $1
        GROUP BY p.id, p.name, p.stock_quantity, p.reorder_level
    `;
    const res = await db.query(query, [businessId]);
    
    const alerts = [];
    res.rows.forEach(product => {
        const dailyVelocity = product.sold_last_14_days / 14;
        const daysUntilEmpty = dailyVelocity > 0 ? product.stock_quantity / dailyVelocity : Infinity;
        
        if (product.stock_quantity <= product.reorder_level) {
            alerts.push({
                productId: product.id,
                productName: product.name,
                type: 'CRITICAL_LOW_STOCK',
                message: `Stock is at or below reorder level (${product.stock_quantity} left).`
            });
        }
        else if (daysUntilEmpty < 7 && dailyVelocity > 0) {
            // Predictive alert
            alerts.push({
                productId: product.id,
                productName: product.name,
                type: 'PREDICTIVE_DEPLETION',
                message: `High velocity! Likely to run out in ${Math.round(daysUntilEmpty)} days.`
            });
        }
    });

    return alerts;
}

async function generateBusinessInsights(businessId) {
    // Try to use OpenAI API if key exists, otherwise local fallback
    const openAiKey = process.env.OPENAI_API_KEY;

    // Gather some stats
    const statsRes = await db.query(`
        SELECT COUNT(*) as total_sales, SUM(total_amount) as revenue
        FROM sale_transactions
        WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
    `, [businessId]);
    const revenue = statsRes.rows[0].revenue || 0;
    const count = statsRes.rows[0].total_sales || 0;

    if (openAiKey && openAiKey !== 'YOUR_OPENAI_API_KEY') {
        try {
            const { Configuration, OpenAIApi } = require('openai');
            const configuration = new Configuration({ apiKey: openAiKey });
            const openai = new OpenAIApi(configuration);
            
            const prompt = `Act as a business insights engine. The business made ${count} sales totaling KES ${revenue} in the last 7 days. Provide 3 short action-oriented bullet points giving business advice based on these numbers.`;
            
            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{role: "user", content: prompt}],
            });
            const answer = completion.data.choices[0].message.content;
            return answer.split('\n').filter(line => line.trim() !== '');
        } catch (e) {
            console.error('OpenAI Error, falling back to local.', e.message);
        }
    }

    // Local heuristic fallback
    const insights = [];
    if (revenue > 50000) {
        insights.push("🚀 Great momentum! Consider offering a bulk-buy discount to boost average order value further.");
    } else if (revenue > 0) {
        insights.push("💡 Sales are steady but could grow. Suggest bundling slow-moving items with popular products.");
    } else {
        insights.push("⚠️ No sales detected in the last 7 days. Time to run a promotion or reach out to existing customers.");
    }

    return insights;
}

module.exports = {
    predictSales,
    generateInventoryAlerts,
    generateBusinessInsights
};
