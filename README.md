# Room Planner Frontend

Angular client for the **Room Planner** application.

## Tech Stack

- **Framework:** Angular (TypeScript)
- **Dev Proxy:** Nginx (via Docker) to unify backend, frontend, and MinIO access.

## Prerequisites

- Node.js & npm
- Docker & Docker Compose
- Angular CLI (`npm install -g @angular/cli`)
- Running instances of [rp-database](https://github.com/kvilmos/rp-database) and [rp-backend](https://github.com/kvilmos/rp-backend).

## Getting Started

### 1. Start the Dev Proxy

The proxy handles CORS by routing requests to the API (:4747), MinIO (:9000), and Frontend.

```bash
cd dev-proxy
docker-compose up -d
cd ..
```

### 2. Run the Application

Install dependencies and start the dev server.

```bash
npm install
ng serve --host 0.0.0.0
```

### 3. Access

Open **http://localhost** in your browser.

> **Note:** Do not use `localhost:4200` directly, as this bypasses the proxy and will cause CORS errors with the backend.

---

## Useful Commands

| Command               | Description                         |
| :-------------------- | :---------------------------------- |
| `npm install`         | Install dependencies                |
| `ng serve`            | Start dev server                    |
| `ng build`            | Build for production                |
| `docker-compose down` | Stop proxy (inside `dev-proxy` dir) |
