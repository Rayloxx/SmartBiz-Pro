# SmartBiz Pro - Professional ERP & POS System

SmartBiz Pro is a state-of-the-art Business Management System designed for small to medium enterprises. It integrates Point of Sale (POS), Inventory Tracking, Financial Analytics, and M-Pesa mobile payments into a single, cohesive platform.

## 🚀 Key Features

- **Dynamic POS Terminal**: Real-time sales processing with multi-payment support (Cash & M-Pesa).
- **Automated Inventory Management**: Real-time stock tracking with AI-driven reorder alerts.
- **Financial Analytics Dashboard**: Visual insights into revenue, profit, and expenses using Recharts.
- **M-Pesa Integration**: Fully automated STK Push and webhook reconciliation for secure mobile payments.
- **AI Business Insights**: Predictive stock depletion alerts and sales trend analysis.
- **Role-Based Access Control (RBAC)**: Secure multi-tenant architecture for Owners, Managers, and Cashiers.

## 🛠️ Technical Stack

- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (Relational Data & ACID Transactions).
- **Integrations**: Safaricom Daraja API (M-Pesa).

## 📂 Project Structure

- `/frontend`: Next.js application (App Router).
- `/backend`: Express server and RESTful API.
- `/backend/controllers`: Business logic and M-Pesa reconciliation.
- `/backend/services`: AI analytics and external integrations.
- `/backend/database`: SQL schemas and migration scripts.

## 🛡️ Security & Scalability

- **JWT Authentication**: Secure stateless sessions.
- **Multi-Tenancy**: Data isolation per business using `business_id` indexing.
- **Transaction Integrity**: Postgres `BEGIN/COMMIT` blocks for all critical financial and inventory operations.

---
*Developed for University Final Year Project Defense (April 2026).*
