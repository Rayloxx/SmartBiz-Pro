const db = require('./config/db');

async function migrate() {
    try {
        console.log('Running migrations...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS business_settings (
                id SERIAL PRIMARY KEY,
                business_name VARCHAR(100) DEFAULT 'SmartBiz Holdings Ltd',
                tax_pin VARCHAR(50) DEFAULT 'P05100088X',
                admin_email VARCHAR(100) DEFAULT 'admin@smartbiz.co.ke',
                phone_number VARCHAR(50) DEFAULT '+254 700 000 000',
                office_address TEXT DEFAULT 'Upperhill, Nairobi, Kenya',
                base_currency VARCHAR(50) DEFAULT 'Kenya Shillings (KSh)',
                vat_rate DECIMAL(5, 2) DEFAULT 16.00,
                email_alerts BOOLEAN DEFAULT true,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert default row if not exists
        const check = await db.query('SELECT COUNT(*) FROM business_settings');
        if (check.rows[0].count == 0) {
            await db.query('INSERT INTO business_settings (business_name) VALUES ($1)', ['SmartBiz Holdings Ltd']);
        }

        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
