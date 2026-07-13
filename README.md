# POS System — Point of Sale & Inventory Management

A full-stack POS system built with React, Tailwind CSS, Node.js, Express, and PostgreSQL.

## Features

- **Authentication**: JWT-based login with role-based access (Admin/Cashier)
- **Dashboard**: Sales charts, revenue stats, low-stock alerts, recent transactions
- **Product Management**: CRUD with auto-generated product codes, images, categories
- **Barcode & QR Code**: Code128 barcode + QR generation, camera scanning (html5-qrcode)
- **POS Selling**: Cart management, barcode scanner support, checkout flow
- **Inventory**: Auto stock reduction on sales, low-stock warnings
- **Sales History**: Searchable list with invoice details and printable receipts
- **Reports**: Daily/monthly sales, top products, inventory report
- **Settings**: Store info, currency, tax, receipt customization
- **Dark Mode**: Full dark mode support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS 3, React Router 6, Zustand, Recharts, Axios |
| Backend | Node.js, Express.js, PostgreSQL (pg), JWT, bcrypt, Zod |
| Barcode | html5-qrcode, JsBarcode, qrcode |
| Styling | Tailwind CSS with custom component classes |

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm or yarn

## Setup Instructions

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Setup PostgreSQL

```bash
# Create database
psql -U postgres -c "CREATE DATABASE pos_system;"
```

### 3. Configure Environment

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pos_system
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4. Run Migrations

```bash
cd backend
npm run migrate    # Create tables
npm run seed       # Seed sample data
```

### 5. Start Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### 6. Login

Open `http://localhost:3000` and login with:
- **Email:** admin@pos.com
- **Password:** password

## Project Structure

```
pos-system/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # PostgreSQL connection pool
│   │   ├── controllers/          # Route handlers
│   │   ├── middleware/auth.js     # JWT authentication
│   │   ├── routes/               # API routes
│   │   ├── validators/schemas.js # Zod validation schemas
│   │   ├── utils/helpers.js      # Code generators
│   │   └── server.js             # Express app entry
│   ├── migrations/
│   │   ├── run.js                # Database migration
│   │   └── seed.js               # Sample data
│   ├── .env                      # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/layout/    # Sidebar, Header, Layout
│   │   ├── context/              # Auth & Cart state (Zustand)
│   │   ├── pages/                # All page components
│   │   ├── services/api.js       # Axios API client
│   │   ├── hooks/                # Custom hooks
│   │   ├── App.jsx               # Router setup
│   │   └── main.jsx              # Entry point
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/auth/me | Get current user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List products (search, filter, paginate) |
| GET | /api/products/:id | Get product |
| GET | /api/products/barcode/:barcode | Find by barcode |
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/categories | List categories |
| POST | /api/categories | Create category |
| PUT | /api/categories/:id | Update category |
| DELETE | /api/categories/:id | Delete category |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/sales | List sales |
| GET | /api/sales/:id | Get sale with items |
| GET | /api/sales/:id/invoice | Get printable invoice |
| POST | /api/sales | Create sale (checkout) |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports/daily | Daily sales report |
| GET | /api/reports/monthly | Monthly sales report |
| GET | /api/reports/top-products | Top selling products |
| GET | /api/reports/inventory | Inventory report |
| GET | /api/reports/revenue | Revenue by period |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/settings | Get store settings |
| PUT | /api/settings | Update settings |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Dashboard summary |

## Database Schema

- **roles** — admin, cashier
- **users** — name, email, password (bcrypt), role_id
- **categories** — name, description
- **products** — name, product_code (auto), barcode, qr_code, prices, stock, category
- **sales** — user_id, total_amount, payment_method, invoice_number
- **sale_items** — sale_id, product_id, quantity, price, discount, tax, subtotal
- **inventory_logs** — product_id, change_type, quantities, audit trail
- **settings** — store_name, currency, tax, receipt config

## Barcode Scanner Support

The POS page supports two scanning methods:

1. **Camera Scanning**: Click "Scan" to open phone camera with html5-qrcode
2. **USB/Bluetooth Scanner**: Type barcode via keyboard input, auto-detected on Enter

Scanned barcodes automatically lookup the product and add to cart.

## License

MIT
# pos
