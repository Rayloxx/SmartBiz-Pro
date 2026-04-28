const db = require('./config/db');

async function migrate() {
    try {
        await db.query('BEGIN');
        
        // 1. Update sales table
        await db.query(`
            ALTER TABLE sales 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PAID',
            ADD COLUMN IF NOT EXISTS mpesa_transaction_code VARCHAR(50)
        `);

        // 2. Create mpesa_transactions table
        await db.query(`
            CREATE TABLE IF NOT EXISTS mpesa_transactions (
                id SERIAL PRIMARY KEY,
                transaction_code VARCHAR(50) UNIQUE,
                phone VARCHAR(20),
                amount DECIMAL(10, 2),
                business_id INTEGER REFERENCES businesses(id),
                status VARCHAR(20) DEFAULT 'UNMATCHED',
                linked_sale_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query('COMMIT');
        console.log('Migration for Real-time Payments successful');
        process.exit(0);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
