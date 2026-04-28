const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const salesRoutes = require('./routes/salesRoutes');
const expensesRoutes = require('./routes/expensesRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const productionRoutes = require('./routes/productionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const usersRoutes = require('./routes/usersRoutes');
const integrationsRoutes = require('./routes/integrationsRoutes');
const { requireAuth, authorize } = require('./middleware/authMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sales', requireAuth, authorize(['owner', 'admin', 'manager', 'cashier']), salesRoutes);
app.use('/api/expenses', requireAuth, authorize(['owner', 'admin', 'manager']), expensesRoutes);
app.use('/api/inventory', requireAuth, authorize(['owner', 'admin', 'manager', 'inventory_staff', 'inventory', 'cashier']), inventoryRoutes);
app.use('/api/production', requireAuth, authorize(['owner', 'admin', 'manager', 'production_staff']), productionRoutes);
app.use('/api/dashboard', requireAuth, authorize(['owner', 'admin', 'manager', 'cashier']), dashboardRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);
app.use('/api/users', requireAuth, authorize(['owner', 'admin']), usersRoutes);
app.use('/api/integrations', requireAuth, integrationsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`SmartBiz Pro Server running on port ${PORT}`);
});
