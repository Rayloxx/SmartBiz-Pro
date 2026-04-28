const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register a new user
router.post('/register', async (req, res) => {
    const { username, password, role, business_name } = req.body;
    try {
        await db.query('BEGIN');
        const passwordHash = await bcrypt.hash(password, 10);
        
        // 1. Create User
        const userResult = await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
            [username, passwordHash, role || 'owner']
        );
        const userId = userResult.rows[0].id;

        // 2. Create Business
        const bizResult = await db.query(
            'INSERT INTO businesses (name, owner_id) VALUES ($1, $2) RETURNING id',
            [business_name || `${username}'s Business`, userId]
        );
        const businessId = bizResult.rows[0].id;

        // 3. Link user to business
        await db.query('UPDATE users SET business_id = $1 WHERE id = $2', [businessId, userId]);

        await db.query('COMMIT');
        
        res.status(201).json({ id: userId, username, role: role || 'owner', business_id: businessId });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: 'Server error during registration', error: err.message, stack: err.stack });
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, business_id: user.business_id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                business_id: user.business_id
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;
