# FOTD (Fit of the Day)

An AI-powered wardrobe app. Snap a photo of a clothing item, and Claude Vision tags its category, color, and season — then an outfit-generation engine suggests coordinated looks from your closet.

**Live demo:** [fotd-sable.vercel.app](https://fotd-sable.vercel.app)

## Features

- 👕 Auto-tag clothing photos by category, color, and season using the Claude Vision API
- 🎨 Outfit generator that groups items by category, filters by season, and ranks combinations by color compatibility
- ✏️ Edit tags manually if the AI gets something wrong
- 📱 Installable as a PWA
- 🔒 JWT-based authentication

## Tech Stack

- **Frontend:** React, deployed on Vercel
- **Backend:** Node.js / Express, deployed on AWS EC2 (Nginx, PM2)
- **Database:** PostgreSQL (Docker)
- **Storage:** AWS S3 (private bucket, EC2 IAM role, presigned URLs for image access)
- **AI:** Claude Vision API (Anthropic) for clothing tagging

## How it works

1. User uploads a photo of a clothing item
2. The image is resized/compressed and sent to the Claude Vision API, which returns a category, color, and list of suitable seasons
3. The tagged item is saved to the wardrobe, with its photo stored in a private S3 bucket
4. When generating outfits, the backend groups items by category, filters by the selected season, randomly samples combinations, and ranks them by a color-compatibility score
5. The best-ranked outfits are returned with presigned URLs for each item's photo
