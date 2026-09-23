# FOTD (Fit of the Day)

Live: [fotd-sable.vercel.app](https://fotd-sable.vercel.app/)

AI-powered outfit generator PWA. Upload photos of your clothes, it auto-tags them, and spits out outfit ideas — pick a season manually, or let it check today's weather and figure that out for you.

## What it does

- Upload a photo → Claude Vision tags it with category, color, and seasons, no manual tagging needed
- Browse your closet, filter by category/color
- Hit generate and get a handful of outfits, ranked by how well the colors work together
- Or flip on "auto" and it grabs your location, checks Open-Meteo for the current temp/rain/wind, and builds outfits around that instead
- Installable as a PWA, denim-themed UI because why not

## Stack

- **Frontend**: React + Vite, PWA
- **Backend**: Node/Express
- **DB**: PostgreSQL
- **Image storage**: AWS S3 (presigned URLs, expire after an hour)
- **AI tagging**: Claude Vision
- **Weather**: Open-Meteo — free, no API key, which is nice
- **Auth**: JWT with one shared password. This is a personal app, not built for multiple users
- **Deploy**: backend on EC2 (PM2 + Nginx), frontend on Vercel

## How outfit generation actually works

Nothing fancy here, it's not ML:

1. Filter your closet down to items that match the season (either what you picked, or whatever the weather mapped to)
2. Randomly sample ~20 combinations of top/bottom/shoes (plus midlayer/outerwear if you have any)
3. Score each combo based on a hardcoded color-compatibility table — matching colors and known-good pairs score higher
4. Sort, dedupe, return the top few

Weather mode isn't a separate system — it just feeds a different season filter into the same generator. Temperature gets mapped to season buckets (`weatherToSeasons.js`) and everything downstream is identical.

## Project layout

```
backend/
  config/db.js          # pool + schema
  middleware/auth.js     # JWT check
  routes/                # auth, health, items, outfits
  services/               # aiTagging, outfitGenerator, s3, weather
  utils/                  # asyncHandler, signedItems, imageKey, weatherToSeasons...
  server.js

frontend/src/
  api/                   # axios client + token helpers
  hooks/                 # useAuth, useCloset, useOutfits, useEditSheet
  components/            # each piece of UI gets its own .jsx + .css
  styles/                # design tokens + a few shared classes
  App.jsx                # just wires hooks into components, nothing fancy
```

## Running it locally

You'll need Node 18+, a Postgres instance (or use `docker-compose.yml` in `backend/`), an S3 bucket, and an Anthropic API key.

**Backend:**

```bash
cd backend
npm install
```

Make a `.env`:

```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=fotd
JWT_SECRET=make up something long and random here
APP_PASSWORD_HASH=bcrypt hash of your login password, not the plain password
ANTHROPIC_API_KEY=your key
AWS_REGION=us-east-2
S3_BUCKET_NAME=your bucket
```

`APP_PASSWORD_HASH` needs to actually be a bcrypt hash, not the password itself — generate one with `bcryptjs` (`bcrypt.hash("yourpassword", 10)`) and paste the result in.

```bash
npm run dev
```

Tables get created automatically the first time it runs.

**Frontend:**

```bash
cd frontend
npm install
```

`.env`:

```
VITE_API_URL=http://localhost:3001
```

```bash
npm run dev
```

## API

Everything except `/auth/login` and `/health` needs an `Authorization: Bearer <token>` header.

| Method | Route | What it does |
|---|---|---|
| GET | `/health` | DB connectivity check |
| POST | `/auth/login` | log in with the shared password, get back a JWT |
| GET | `/items` | your closet |
| POST | `/items` | upload a photo (`image` field), Claude tags it, saved to S3 + DB |
| PUT | `/items/:id` | edit category/color/seasons/note |
| DELETE | `/items/:id` | delete an item and its S3 photo |
| GET | `/outfits` | generate outfits, optional `?season=` |
| GET | `/outfits/weather` | generate outfits from current weather, needs `?lat=&lon=` |

## Deploying

Push to `main` and Vercel picks up the frontend automatically. The backend doesn't auto-deploy though, you have to SSH into EC2, `git pull`, reinstall if `package.json` changed, and restart with PM2. Annoying but that's how it is for now.

## Why it's built this way

Single shared password instead of real accounts — it's my closet, not a product with users. Outfit scoring is rule-based instead of some trained model because it's cheap, fast, and I can actually explain why it picked something. Adding weather support didn't need touching the scoring logic at all, just a different input into the same filter.
