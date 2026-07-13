# Phase 2 — Mobile Optimization

Mobile-first optimization for OOJ Foundation Event Management System.

## What was done

- Hamburger navigation (public + admin)
- Touch-friendly buttons (44px minimum)
- iPhone safe-area support
- Mobile guest cards and event CMS cards
- Scanner layout optimized for phones
- Safari PDF download fallback (opens in new tab)
- PWA manifest + app icons
- Capacitor config for Play Store / App Store packaging

## Device testing checklist

Test on real devices before UAT:

| Screen | Test |
|--------|------|
| Landing `/` | Hero, buttons, sections — no horizontal scroll |
| Register `/register` | Form, keyboard, submit |
| Success `/success/:uuid` | PDF download, QR download |
| Admin Login | Touch targets |
| Dashboard | Stats grid, guest cards, modals |
| Events CMS | Event cards, form upload |
| Scanner `/admin/scanner` | Camera, manual UUID, check-in results |

**Devices:** Android phone, iPhone, tablet  
**Browsers:** Chrome, Safari, Edge, Firefox

## Store build commands

```bash
cd frontend
npm run build
npx cap sync

# Android (requires Android Studio)
npx cap open android

# iOS (requires Xcode on macOS)
npx cap open ios
```

## Local phone testing (camera + PDF)

The scanner requires **HTTPS**. Use the Vite dev server with SSL:

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend (HTTPS + API proxy)
cd frontend && npm run dev
```

On your phone, open **`https://YOUR_MAC_IP:5173`** (not `http://`).

- Accept the browser certificate warning (self-signed dev cert).
- Set `VITE_PROXY_TARGET=http://YOUR_MAC_IP:5000` in `frontend/.env`.
- API calls use `/api` through the Vite proxy (no mixed-content errors).

| URL | Purpose |
|-----|---------|
| `https://192.168.x.x:5173/` | Landing |
| `https://192.168.x.x:5173/admin/scanner` | QR scanner (camera) |
| `https://192.168.x.x:5173/admin/login` | Admin login |

## Production notes

- Scanner camera requires **HTTPS** in production
- Set `VITE_API_URL` to production API before building
- For Capacitor apps, API URL must be reachable from the device

## Remaining before store submission

- [ ] UAT with OOJ Foundation
- [ ] Privacy Policy URL
- [ ] Store screenshots and descriptions
- [ ] Production HTTPS deployment
- [ ] Apple Developer + Google Play accounts
