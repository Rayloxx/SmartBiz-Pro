INSERT INTO users (username, password_hash, role) VALUES ('admin', '/wYw', 'admin');
INSERT INTO products (name, sku, price, cost, stock_quantity, category) VALUES ('Premium Yoghurt 250ml', 'YOG-250', 80.00, 45.00, 150, 'Dairy');
INSERT INTO raw_materials (name, unit, cost_per_unit, stock_quantity) VALUES ('Raw Milk', 'Liters', 60.00, 1500.00);
INSERT INTO production_batches (product_id, raw_material_id, material_used, products_produced, batch_cost, cost_per_unit) VALUES (1, 1, 100.00, 400, 8500.00, 21.25);
