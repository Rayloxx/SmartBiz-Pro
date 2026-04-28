const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

// GET all users (excluding password_hash)
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, role, created_at FROM users WHERE business_id = $1 ORDER BY created_at ASC',
            [req.user.business_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching users' });
    }
});

// POST - Create a new user / team member
router.post('/', async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Username, password, and role are required' });
    }
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (username, password_hash, role, business_id) VALUES ($1, $2, $3, $4) RETURNING id, username, role, created_at',
            [username, passwordHash, role, req.user.business_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: 'Server error creating user' });
    }
});

// PUT - Update user role
router.put('/:id', async (req, res) => {
    const { role, username } = req.body;
    try {
        const result = await db.query(
            'UPDATE users SET role = $1, username = $2 WHERE id = $3 AND business_id = $4 RETURNING id, username, role, created_at',
            [role, username, req.params.id, req.user.business_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating user' });
    }
});

// DELETE - Remove a user
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = $1 AND business_id = $2', [req.params.id, req.user.business_id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error deleting user' });
    }
});

module.exports = router;
