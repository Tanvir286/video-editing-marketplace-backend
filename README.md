# Video Editing Marketplace (Backend)

backend created using nestjs

A dedicated freelance marketplace frontend built to connect content creators and clients with professional video editors. The platform streamlines project discovery, bidding, direct hiring, and real-time collaboration with complete order management.

---
🔗 **Live Demo:** [live-link](https://affless-frontend.vercel.app)
---

## 🌟 Overview & Workflow

The platform operates on a three-tier role ecosystem:

* **For Clients:**
  * Post project requirements and custom job listings.
  * Search editor profiles and send **Direct Hire** requests.
  * Review editor bids, select the best proposal, and initiate escrow payments.
  * Request revisions, approve deadline extensions, and track project progress.

* **For Editors:**
  * Browse open client job listings and submit detailed **Bids/Proposals**.
  * Receive and manage direct contract offers from clients.
  * Submit completed work, manage client revisions, and request timeline extensions.

* **For Admins:**
  * Monitor platform-wide analytics including active orders, users, and gross transaction volume.
  * Moderate and manage both Client and Editor accounts (ban/verify/manage).
  * Oversee project contracts, dispute resolutions, and cancel/refund requests.
  * Manage platform commission fees (**5% client surcharge** & **7% editor deduction**) and monitor Stripe payout releases.
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

## 📊 Workflow & Permissions Matrix

| Features / Permissions | Client | Editor | Admin |
|---|:---:|:---:|:---:|
| Post Project Requirements | ✅ | ❌ | 👁️ (Moderate) |
| Submit Bids / Proposals | ❌ | ✅ | 👁️ (Monitor) |
| Direct Hire Request | ✅ | ❌ | 👁️ (Monitor) |
| Request Project Revision | ✅ | ❌ | 👁️ (Mediate) |
| Request Deadline Extension | ❌ | ✅ | 👁️ (Mediate) |
| Release Payment Escrow | ✅ | ❌ | ⚡ (Override/Refund) |
| Platform Commission Settings | ❌ | ❌ | ✅ |
| Manage / Ban Users | ❌ | ❌ | ✅ |
| Resolve Disputes & Reports | ❌ | ❌ | ✅ |

---

## 💳 Payment & Fee Structure

| User Role | Platform Fee | Description |
|---|---|---|
| **Client** | **5%** | Applied at checkout on top of the project amount |
| **Editor** | **7%** | Deducted automatically from total payout earnings |

---

## 🛠️ Tech Stack

* **Backend Framework:** Node.js, NestJS
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Authentication:** JWT with Role-Based Access Control (RBAC)
* **Payments:** Stripe API & Webhooks
* **Frontend:** Next.js (App Router) / React, TypeScript, Tailwind CSS
* **State Management:** Redux Toolkit & RTK Query

---



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

## Stripe Config

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
```
Swagger: http://{domain_name}/api/docs
```

