const db = require('./config/db');

async function migrate() {
    try {
        await db.query('BEGIN');
        
        // 1. Create sale_transactions table
        await db.query(`
            CREATE TABLE IF NOT EXISTS sale_transactions (
                id SERIAL PRIMARY KEY,
                business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
                total_amount DECIMAL(10, 2) NOT NULL,
                payment_method VARCHAR(50),
                status VARCHAR(20) DEFAULT 'PAID',
                mpesa_code VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Add sale_transaction_id to sales table
        await db.query(`
            ALTER TABLE sales 
            ADD COLUMN IF NOT EXISTS transaction_id INTEGER REFERENCES sale_transactions(id) ON DELETE CASCADE
        `);

        await db.query('COMMIT');
        console.log('Advanced Sale Transactions Schema Migration successful');
        process.exit(0);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
