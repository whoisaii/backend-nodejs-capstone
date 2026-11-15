# SecondChance

A reuse marketplace capstone based on the IBM starter.

## Components
- `secondChance-backend`: Express API using real MongoDB, password hashes and JWT authentication.
- `sentiment`: Natural-based sentiment API.
- `docs`: deployable landing page and explicitly labelled 16-item sample catalogue. GitHub Pages hosts static pages; it does not host the Express/MongoDB API.

## Local API
1. Start MongoDB.
2. In `secondChance-backend`, run `npm ci`.
3. Copy `.env.example` to `.env` and set a random JWT_SECRET.
4. Run `npm run seed` to import 16 documents into an empty collection.
5. Run `npm start`; the API listens on port 3060.

Routes: `/api/secondchance/items`, `/api/secondchance/items/:id`, `/api/secondchance/search`, and `/api/secondchance/auth/{register,login,update}`. Item uploads and changes require a Bearer token; changes are restricted to the item's owner.

## Checks and deployment
Run `npm test` in the backend with MONGO_URL set to a local MongoDB service. Tests create a unique test database. The GitHub Actions workflow starts MongoDB, installs dependencies, checks syntax, tests the API and Natural import, then deploys `docs` to GitHub Pages.

The original React frontend remains in `secondChance-frontend` as starter reference; `docs` is the maintained static frontend.

Public landing page: https://whoisaii.github.io/secondchance-capstone/
