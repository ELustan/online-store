# online-store

A full-stack online store built with Laravel and React, featuring Stripe payments, wallet support, and an admin panel powered by Filament. Deployed on AWS EC2.

**System Demo (AWS EC2):** http://52.65.82.3/

---

## Tech Stack

- **Laravel** – Backend API & business logic
- **ReactJS** – Frontend user interface
- **Stripe (Laravel Stripe)** – Secure online payments
- **Laravel Filament** – Admin panel and system management
- **AWS EC2** – Production deployment

---

## Core Features

### Customer Features

- **Buy Products**  
  Browse products, view details, add to cart, and securely complete purchases using Stripe or wallet balance.

- **Purchase History**  
  View complete order history, including transaction details, order status, and timestamps.

- **Favorites**  
  Save products to a favorites list for easy access and future purchases.

- **Wallet**  
  Integrated digital wallet to store balances, receive cashback rewards, and use wallet funds during checkout.

- **Support Desk**  
  Built-in support system allowing users to submit inquiries, report issues, and track support tickets.

---

## Promotions & Incentives

The application supports multiple incentive mechanisms to enhance user engagement and sales:

- **Deals**  
  Time-based or quantity-based discounts applied to selected products.

- **Promos**  
  Promotional campaigns and promo codes that can be applied during checkout.

- **Cashbacks**  
  Automatic cashback rewards credited to the user's wallet after eligible purchases.

---

## Admin Features (Filament)

- Product and category management
- Order and transaction monitoring
- Deal, promo, and cashback configuration
- Wallet and user balance management
- Support desk ticket handling
- System configuration and access control

---

## Project Structure (Typical)

- `app/` — Laravel application logic
- `routes/` — API and web routes
- `database/` — Migrations and seeders
- `resources/` — Views and frontend assets
- `public/` — Public web root
- `storage/` — Logs, cache, uploaded files

---

## Requirements

- PHP **8.4+**
- Composer **2.x**
- Node.js **23+**
- MySQL / PostgreSQL
- Stripe account with API keys

---

## Getting Started (Local Development)

### 1. Install Dependencies

```bash
git clone <YOUR_REPO_URL> online-store
cd online-store

composer install
npm install
