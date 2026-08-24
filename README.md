# Video Editing Marketplace (Backend)

backend created using nestjs

A dedicated freelance marketplace frontend built to connect content creators and clients with professional video editors. The platform streamlines project discovery, bidding, direct hiring, and real-time collaboration with complete order management.

---
🔗 **Live Demo:** [live-link](https://affless-frontend.vercel.app)
---

## 🌟 Overview & Workflow

The platform operates on a dual-role ecosystem:

* **For Clients:**
  * Post project requirements and job listings to receive proposals.
  * Search editor profiles and send **Direct Hire** requests.
  * Review editor bids, select the best proposal, and initiate contracts.
  * Request revisions, deadline extensions, and track project progress.

* **For Editors:**
  * Browse client job posts and submit detailed **Bids/Proposals**.
  * Receive and manage direct hiring offers from clients.
  * Submit work, manage revisions, and request delivery deadline extensions.

---

## 🚀 Key Features

* **Dual Role-Based Flow:** Seamless interfaces tailored specifically for Clients and Editors.
* **Smart Bidding & Direct Hire:** Flexible hiring models supporting open bidding and 1-on-1 direct contracts.
* **Order & Workflow Management:** Built-in mechanisms for project submission, client revisions, and timeline extensions.
* **Direct Messaging:** Interactive communication channel between clients and editors.
* **Secure Authentication:** User registration, role selection, login, and password recovery.
* **Performance & Caching:** Optimized API queries and global cache management powered by RTK Query.
* **Responsive Modern UI:** Clean, mobile-friendly design built with Tailwind CSS.

---

## 💳 Payment & Fee Structure

| User Role | Platform Fee | Description |
|---|---|---|
| **Client** | **5%** | Applied at checkout on top of the project amount |
| **Editor** | **7%** | Deducted automatically from total payout earnings |

---

## Config

Stripe webhook:

```
http://{domain_name}/api/payment/stripe/webhook
```

for development run stripe cli:

```
stripe listen --forward-to localhost:4000/api/payment/stripe/webhook
```

trigger a event for testing:

```
stripe trigger payment_intent.succeeded
```

## Installation

Install all dependencies

```
yarn install
```

## Setup

Copy .env.example to .env and config according to your needs.

Migrate database:

```bash
npx prisma migrate dev
```

Seed dummy data to database

```
yarn cmd seed
```

## Running:

```bash
# development
yarn start

# watch mode
yarn start:dev

# production mode
yarn start:prod

# watch mode with swc compiler (faster)
yarn start:dev-swc
```
For docker:
```
docker compose up
```

## Api documentation

Swagger: http://{domain_name}/api/docs

## Tech used

- Typescript
- Nest.js
- Prisma
- Postgres
- Socket.io
- Bullmq
- Redis
- etc.
