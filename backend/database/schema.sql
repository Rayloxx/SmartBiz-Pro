-- Database Schema for SmartBiz Pro
-- Run this in psql: \i schema.sql

-- Users table (extended roles)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'owner', 'manager', 'cashier', 'inventory_staff')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products / Finished goods
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Raw Materials
CREATE TABLE IF NOT EXISTS raw_materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    cost_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock_quantity DECIMAL(10, 2) DEFAULT 0,
    reorder_level DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales records
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    profit DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(30) DEFAULT 'Cash',
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    reference_code VARCHAR(50),
    expense_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Production batches
CREATE TABLE IF NOT EXISTS production_batches (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    raw_material_id INTEGER REFERENCES raw_materials(id) ON DELETE SET NULL,
    material_used DECIMAL(10, 2) NOT NULL,
    products_produced INTEGER NOT NULL,
    batch_cost DECIMAL(10, 2) NOT NULL,
    cost_per_unit DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    production_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory transactions log
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    item_type VARCHAR(20) CHECK (item_type IN ('product', 'raw_material')),
    item_id INTEGER NOT NULL,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('in', 'out')),
    quantity DECIMAL(10, 2) NOT NULL,
    remarks TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business Settings (single-row config table)
CREATE TABLE IF NOT EXISTS business_settings (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(100) DEFAULT 'SmartBiz Pro',
    tax_pin VARCHAR(50) DEFAULT '',
    admin_email VARCHAR(100) DEFAULT '',
    phone_number VARCHAR(30) DEFAULT '',
    office_address TEXT DEFAULT '',
    base_currency VARCHAR(50) DEFAULT 'Kenya Shillings (KSh)',
    vat_rate DECIMAL(5, 2) DEFAULT 16.00,
    email_alerts BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default settings row if not exists
INSERT INTO business_settings (business_name)
SELECT 'SmartBiz Pro'
WHERE NOT EXISTS (SELECT 1 FROM business_settings LIMIT 1);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_raw_materials_reorder ON raw_materials(stock_quantity, reorder_level);
