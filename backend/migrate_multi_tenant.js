const db = require('./config/db');

async function migrateMultiTenant() {
    try {
        console.log('Running Multi-Tenant migration...');
        
        await db.query('BEGIN');

        // 1. Create businesses table
        await db.query(`
            CREATE TABLE IF NOT EXISTS businesses (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                owner_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Add business_id to users & other tables
        const tables = [
            'users', 'products', 'raw_materials', 'sales', 
            'expenses', 'production_batches', 'inventory_transactions'
        ];

        for (const table of tables) {
            await db.query(`
                ALTER TABLE ${table}
                ADD COLUMN IF NOT EXISTS business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE;
            `);
        }

        // 3. Migrate existing data
        const checkUsers = await db.query('SELECT COUNT(*) FROM users');
        if (parseInt(checkUsers.rows[0].count) > 0) {
            console.log('Existing users found, creating default business and migrating data...');
            const checkBiz = await db.query('SELECT * FROM businesses LIMIT 1');
            let defaultBizId;

            if (checkBiz.rows.length === 0) {
                // Find first user to be owner
                const firstUser = await db.query('SELECT id, username FROM users ORDER BY id ASC LIMIT 1');
                const ownerId = firstUser.rows.length > 0 ? firstUser.rows[0].id : null;
                const ownerName = firstUser.rows.length > 0 ? firstUser.rows[0].username : 'Default';
                
                const bizInsert = await db.query(
                    'INSERT INTO businesses (name, owner_id) VALUES ($1, $2) RETURNING id', 
                    [`${ownerName}'s Business`, ownerId]
                );
                defaultBizId = bizInsert.rows[0].id;
                
                // Add foreign key constraint to businesses now that owner is set
                // (Wait, doing this in a migration where owner might be null is tricky, 
                // so we won't strictly enforce owner_id fk to avoid circular issues, or defer it.)
                await db.query(`
                    ALTER TABLE businesses 
                    DROP CONSTRAINT IF EXISTS fk_owner;
                `);
                await db.query(`
                    ALTER TABLE businesses 
                    ADD CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
                `);
            } else {
                defaultBizId = checkBiz.rows[0].id;
            }
            
            // Assign to everything
            for (const table of tables) {
                await db.query(`UPDATE ${table} SET business_id = $1 WHERE business_id IS NULL`, [defaultBizId]);
            }
            console.log('Data successfully migrated to default business ID:', defaultBizId);
        }

        await db.query('COMMIT');
        console.log('Multi-Tenant Migration successful.');
        process.exit(0);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateMultiTenant();
