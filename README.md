# SmartBiz - AI Powered Business Finance & Inventory Intelligence Sys.

SmartBiz is an **extraordinary financial intelligence system** designed explicitly for small businesses in Kenya. Built on the modern **React (Next.js)** framework with an **Express (Node.js) & PostgreSQL** backend, it features a world-class UI equipped with animated dashboards, intelligent metrics, and advanced manufacturing flow processing.

![SmartBiz Architecture](https://img.shields.io/badge/Architecture-Clean_MVC-emerald)
![Frontend](https://img.shields.io/badge/Frontend-Next.js_15-teal)
![Styling](https://img.shields.io/badge/Styling-TailwindCSS_v4-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js_Express-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)

---

## 🚀 Key Features
1. **Intelligent Sales Ecosystem:** One-click POS with automated stock syncing and real-time revenue computation (KES).
2. **Predictive Expense Tracking:** Automatic categorization of rent, utilities, raw materials, etc. Built-in alerts for unordinary spikes.
3. **Advanced Production Engine:** Built for Kenya’s dairy, agro, and retail sector. Create 'Batches' that transmute raw materials (e.g., Raw Milk) into manufactured goods (e.g., Mala, Ghee) using precise formulation scaling.
4. **Breathtaking UI:** Built entirely on modern design principles featuring Glassmorphism, smooth Framer Motion micro-animations, dynamically animated Recharts financial graphs, and Emerald Green / Deep Blue hues designed to build deep consumer trust. 

## � Dark Mode & Global Settings
SmartBiz now includes a premium **Dark Mode** system and a persistent **Global Settings** configuration panel.
- **Theme Engine**: Built with a custom `ThemeProvider` using Tailwind 4 variants. Transition between Light and Dark mode seamlessly across all dashboards and sidebars.
- **Business Profile**: Configure your Business Name, KRA Tax PIN, and M-PESA/eTIMS integration status directly from the UI.
- **Data Persistence**: Settings are stored in the `business_settings` PostgreSQL table, ensuring your profile stays consistent for all users.

---

## 🏗 GitHub & Sharing Instructions

To share this project with your group mates, follow these steps:

### 1. Initialize Git (If not already done)
In the root directory of the project, run:
```bash
git init
git add .
git commit -m "Initial commit: SmartBiz Financial Intelligence System"
```

### 2. Push to GitHub
1. Create a "New Repository" on [GitHub](https://github.com/new).
2. Name it `SmartBiz-System`.
3. Follow the instructions on the GitHub page to push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/SmartBiz-System.git
git branch -M main
git push -u origin main
```

### 3. Sharing with Group Mates
Once the code is on GitHub:
- **Collaboration**: Add them as collaborators in **Settings > Collaborators**.
- **Live Demo**: 
  - Deploy the **Frontend** to [Vercel](https://vercel.com) (just import the GitHub repo).
  - Deploy the **Backend** to [Railway.app](https://railway.app) or [Render.com](https://render.com).
  - Provision a managed **PostgreSQL** database on Railway and update your `.env` variables to point to it.

---

## ⚙️ Setup Guide

*(Refer to the sections below for detailed environment and database configuration)*


### 1. Database Setup
1. Ensure PostgreSQL is installed and running on default port `5432`.
2. Create a new database named `smartbiz`:
   ```bash
   createdb smartbiz -U postgres
   ```
3. Run the schema file to instantiate the tables:
   ```bash
   psql -U postgres -d smartbiz -f backend/database/schema.sql
   ```

### 2. Backend Environment Variables
Navigate to `./backend` and fill the `.env` file with realistic values:
```env
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=smartbiz
DB_PORT=5432
JWT_SECRET=supersecretkey_smartbiz_kenya_2026
```

### 3. Run Backend Server
```bash
cd backend
npm install
npm run dev
```
*(The server should run on http://localhost:5000)*

### 4. Run Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
*(The UI will spin up on http://localhost:3000)*

---

## 💡 Demo Data (Seeding)
To pre-populate the dashboard and the system to test out the logic, you can run the following SQL insertions:

```sql
INSERT INTO users (username, password_hash, role) VALUES ('admin', '$2b$10$wT/wYw...hash', 'admin');

INSERT INTO products (name, sku, price, cost, stock_quantity, category) 
VALUES ('Premium Yoghurt 250ml', 'YOG-250', 80.00, 45.00, 150, 'Dairy');

INSERT INTO raw_materials (name, unit, cost_per_unit, stock_quantity)
VALUES ('Raw Milk', 'Liters', 60.00, 1500.00);

-- Insert a sample production batch
INSERT INTO production_batches (product_id, raw_material_id, material_used, products_produced, batch_cost, cost_per_unit)
VALUES (1, 1, 100.00, 400, 8500.00, 21.25);
```

Enjoy building the next unicorn of Africa with SmartBiz!
