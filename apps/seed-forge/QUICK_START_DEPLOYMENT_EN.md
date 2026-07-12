# The Seed Engine - Quick Start Deployment Guide (English)

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Development Environment

```bash
# Start development server
npm run dev

# Access at
# http://localhost:5173 or http://localhost:8080
```

**Development Environment Features**:
- ✅ No Service Worker registration (avoids cache interference)
- ✅ Hot reload (code changes take effect immediately)
- ✅ No cache issues

---

## 📱 PWA Deployment (Production)

### 1. Prepare Icons

**Method 1: Use HTML Generator (Recommended)**

1. Open `scripts/generate-icons.html` in browser
2. Click "Download 192x192" and "Download 512x512"
3. Save to `public/` directory

**Method 2: Use SVG Conversion**

1. Visit https://convertio.co/svg-png/
2. Upload `public/icon-seed-simple.svg`
3. Convert and download to `public/` directory

### 2. Build Application

```bash
npm run build
```

### 3. Preview PWA

```bash
npm run preview
```

Access at `http://localhost:4173`

### 4. Test Installation

- **Mobile**: Browser menu → "Add to Home Screen"
- **Desktop**: Address bar → "Install" icon

---

## 🌐 Deploy to Production

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Option 3: GitHub Pages

1. Add to `package.json`:
   ```json
   "homepage": "https://yourusername.github.io/seed-engine"
   ```

2. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add script:
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

---

## 🔧 Development Environment Fix

### If You Encounter Cache Issues

1. **Clear Service Worker**:
   - Open Developer Tools (F12)
   - Application → Service Workers
   - Click "Unregister"
   - Check "Bypass for network"

2. **Clear Browser Cache**:
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"

3. **Test in Incognito Mode**:
   - Open incognito window
   - Access development URL

---

## ✅ Verification Checklist

### Development Environment
- [ ] `npm run dev` starts normally
- [ ] Application loads correctly
- [ ] Code changes take effect immediately
- [ ] No Service Worker interference

### PWA Production Environment
- [ ] Icon files prepared (icon-192.png, icon-512.png)
- [ ] `npm run build` succeeds
- [ ] `npm run preview` works
- [ ] Can install to home screen
- [ ] Offline functionality works

---

## 📋 File Structure

```
Project Root/
  ├── public/
  │   ├── icon-192.png          ✅ Required
  │   ├── icon-512.png          ✅ Required
  │   ├── manifest.webmanifest  ✅ Configured
  │   └── sw.js                 ✅ Configured
  ├── src/
  │   └── main.tsx              ✅ Fixed (no SW in dev)
  ├── scripts/
  │   └── generate-icons.html   ✅ Icon generator
  └── dist/                      📦 Build output
```

---

## 🎯 Next Steps

1. **Generate Icons** (if not done yet)
2. **Test Development Environment** (`npm run dev`)
3. **Build PWA** (`npm run build && npm run preview`)
4. **Deploy to Production**

---

## 📚 Related Documentation

- `DEVELOPMENT_FIX.md` - Development Environment Fix Guide
- `PROFESSOR_GUIDE.md` - Professor Usage Guide
- `DEPLOYMENT_GUIDE.md` - Complete Deployment Guide
- `ICON_GENERATION_GUIDE.md` - Icon Generation Guide

---

## 🎉 Complete!

Your The Seed Engine now has:
- ✅ Development environment fully fixed
- ✅ PWA configuration complete
- ✅ Ready for production deployment
- ✅ Can be installed on mobile/desktop

**Start using it now!**

