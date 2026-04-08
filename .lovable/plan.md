

# Install Your App on iPhone — No Mac Needed

Since you don't have a Mac, the best option is a **Progressive Web App (PWA)**. This lets you install the app directly from Safari on your iPhone — it gets its own icon on the home screen, opens full-screen (no browser bar), and feels like a native app.

## What you'll get
- Home screen icon, just like a real app
- Full-screen experience — no Safari toolbar
- Works offline for cached content
- No App Store, no Xcode, no Mac required

## How to install (after setup)
1. Open your app URL in **Safari** on your iPhone
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Done — it launches like a native app

## Implementation steps

1. **Create a web app manifest** (`public/manifest.json`) with app name, icons, theme color, and `display: "standalone"`

2. **Generate PWA icons** — create properly sized icons (192×192 and 512×512) in `public/`

3. **Add mobile meta tags to `index.html`** — apple-touch-icon, theme-color, apple-mobile-web-app-capable, link to manifest

4. **Add an in-app install prompt** — a small banner or button that detects if the app isn't installed yet and guides the user to add it to their home screen

No `vite-plugin-pwa` or service workers needed — just the manifest and meta tags are enough for installability. This keeps things simple and avoids caching issues.

## Limitations vs native app
- No push notifications (iOS has limited support)
- No access to some hardware features (Bluetooth, NFC)
- For your use case (planner, meals, health tracking) — PWA covers everything you need

