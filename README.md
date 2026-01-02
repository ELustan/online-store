# online-store

A full-stack online store built with Laravel and React, featuring Stripe payments and an admin panel powered by Filament. Deployed on AWS EC2.

**System Demo (AWS EC2):** http://52.65.82.3/

---

## Tech Stack

- **Laravel** (API + backend)
- **ReactJS** (frontend UI)
- **Stripe** (payments via Laravel Stripe integration)
- **Filament** (admin panel)
- **AWS EC2** (deployment)

---

## Key Features

- Product catalog and product details
- Shopping cart and checkout flow
- Stripe payment processing
- Admin management via Filament (products, categories, orders, etc.)
- Environment-based configuration for local/staging/production

---

## Project Structure (Typical)

- `app/` — Laravel application code
- `routes/` — Web/API routes
- `database/` — Migrations/seeders
- `resources/` — Views, assets, and frontend entry points (if applicable)
- `public/` — Public web root
- `storage/` — Logs, cache, uploaded files
- `react/` or `resources/js/` — React app source (depending on your setup)

---

## Requirements

- PHP **8.4+** (recommended: match your production version)
- Composer **2.x**
- Node.js **23+** and npm/yarn
- MySQL or PostgreSQL (depending on your `.env`)
- Stripe account + API keys

---

## Getting Started (Local Development)

### 1) Clone and Install Dependencies

```bash
git clone <YOUR_REPO_URL> online-store
cd online-store

composer install
npm install
