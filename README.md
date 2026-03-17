# UMaT Marketplace

Campus marketplace monorepo with:
- `web/` React + Vite + Tailwind frontend
- `server/` Express + TypeScript + MongoDB API
- `mobile/` Expo React Native app
- `shared/` shared types/constants

## Curated Landing Images (Frontend-only)

These are **not** stored in product database records.
They are only fallback/editorial assets for the landing page when live listings are low.

Put all files in:
- `web/public/curated/`

Use these exact filenames:
- `lecture-kit.jpg`
- `hostel-reset.jpg`
- `weekend-fit.jpg`
- `gadget-setup.jpg`
- `sneaker-drop.jpg`
- `study-corner.jpg`
- `audio-pack.jpg`
- `canvas-carry.jpg`

### Download links (one per file)

- `lecture-kit.jpg`  
  `https://source.unsplash.com/1200x1600/?student,desk,books,laptop`

- `hostel-reset.jpg`  
  `https://source.unsplash.com/1200x1600/?hostel,room,interior,minimal`

- `weekend-fit.jpg`  
  `https://source.unsplash.com/1200x1600/?fashion,streetwear,model`

- `gadget-setup.jpg`  
  `https://source.unsplash.com/1200x1600/?tech,workspace,gadgets,flatlay`

- `sneaker-drop.jpg`  
  `https://source.unsplash.com/1200x1600/?sneakers,shoes,fashion`

- `study-corner.jpg`  
  `https://source.unsplash.com/1200x1600/?study,desk,notebook,lamp`

- `audio-pack.jpg`  
  `https://source.unsplash.com/1200x1600/?headphones,earbuds,music,lifestyle`

- `canvas-carry.jpg`  
  `https://source.unsplash.com/1200x1600/?tote,bag,accessories,fashion`

Recommended:
- Aspect ratio: 3:4 or 4:5
- Size: around 1200x1600
- Keep optimized file size (< 400KB)

## Run

- Web: `npm run dev --prefix web`
- Server: `npm run dev --prefix server`
- Mobile: `npm run start --prefix mobile`
