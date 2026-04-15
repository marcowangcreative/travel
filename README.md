# Travel Toolkit

Geo-aware travel utility — auto-detects your country, configures currency, translation, and metric conversions. Includes camera-based menu translation (Lens).

## Deploy to Vercel

```bash
cd travel-toolkit
npx vercel
```

When prompted, add your environment variable:

```
GOOGLE_API_KEY = your_google_cloud_api_key
```

Or set it in the Vercel dashboard under Settings → Environment Variables.

## Google Cloud Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable these two APIs:
   - **Cloud Translation API**
   - **Cloud Vision API**
4. Go to APIs & Services → Credentials → Create API Key
5. Restrict the key to only Translation API + Vision API
6. Copy the key into Vercel as `GOOGLE_API_KEY`

## How It Works

- **Lens** — take a photo of a menu, OCR extracts text via Google Vision, translates via Google Translate
- **Currency** — live USD ↔ local currency rates (open.er-api.com, no key needed)
- **Metric** — km/h↔mph, °C↔°F, km↔mi, kg↔lb, cm↔in, L↔gal
- **Translate** — text translation via Google Translate API (falls back to MyMemory if no API key)
- **Geo-detection** — auto-configures all tools based on your IP location

## Project Structure

```
public/index.html    → the entire frontend (single file)
api/translate.js     → serverless proxy for Google Translate
api/ocr.js           → serverless proxy for Google Vision OCR
vercel.json          → Vercel config
```

## Without Google API Key

Currency and metric work without any API key. Text translation falls back to MyMemory (lower quality). Lens/OCR requires the Google Vision API — no fallback for that one.
