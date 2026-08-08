# foodsPOS - Point of Sale & Inventory Management System

Professional POS system for restaurants, cafes, and retail stores. Built with React, Node.js, Express, and SQLite/PostgreSQL.

## Features

### Core POS
- **Fast Checkout**: Barcode scanning, cart management, quick product search
- **Multiple Payment Methods**: Cash, card, other
- **Discounts & Taxes**: Per-item or global discounts, configurable tax rate
- **Print Receipts**: Professional receipt printing with store branding

### Inventory Management
- **Product Management**: CRUD with images, categories, barcodes
- **Stock Tracking**: Automatic stock reduction on sales, low-stock alerts
- **Product Returns**: Dedicated return flow with stock restoration
- **Categories**: Hierarchical category management

### Sales & Reports
- **Sales History**: Filterable by date, payment method, customer
- **Dashboard**: Revenue charts, top products, inventory value
- **Reports**: Daily/monthly sales, profit analysis
- **Export**: CSV export for products

### User Management
- **Role-based Access**: Admin and Cashier roles
- **Shift Management**: Open/close shifts with cash tracking
- **Secure Auth**: JWT with token blacklist on logout

### Customer & Delivery
- **Customer Management**: Track purchases, debt tracking
- **Courier/Delivery Management**: Transport type, delivery tracking
- **PWA Support**: Installable on mobile/desktop, offline-ready

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, PWA |
| Backend | Node.js, Express.js |
| Database | SQLite (local) / PostgreSQL (production) |
| Auth | JWT, bcrypt |
| Telegram | Bot integration for orders & admin |

## Quick Start

### Prerequisites
- Node.js >= 18

### Installation

```bash
# Clone repository
git clone https://github.com/madal1yev/pos.git
cd pos

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
```

### Default Login
- **Email**: admin@pos.uz
- **Password**: admin123

## Deployment

### Vercel (Recommended)
1. Connect GitHub repo to Vercel
2. Set environment variables:
   - `JWT_SECRET` - random secret key
   - `DATABASE_URL` - PostgreSQL connection string
   - `FRONTEND_URL` - your frontend URL
   - `NODE_ENV` - production

### Local Production Build
```bash
cd frontend
npm run build
cd ../backend
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | JWT signing secret | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Production |
| `FRONTEND_URL` | Frontend URL for CORS | Production |
| `NODE_ENV` | development/production | No |
| `TELEGRAM_BOT_TOKEN` | Customer bot token | No |
| `TELEGRAM_ADMIN_BOT_TOKEN` | Admin bot token | No |

## Project Structure

```
pos/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation
│   │   └── config/         # Database config
│   └── api/index.js        # Vercel entry point
├── frontend/
│   └── src/
│       ├── pages/          # React pages
│       ├── components/     # Reusable components
│       ├── services/       # API client
│       └── context/        # React context
└── README.md
```

## License

MIT License
