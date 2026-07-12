# The Seed Engine - Installation Guide (English)

## 📱 Mobile Installation (Android / iOS)

### Android Phone

#### Method 1: Chrome Browser (Recommended)

1. **Open Chrome browser**
2. **Visit the application URL** (deployed URL, e.g., `https://your-app.vercel.app`)
3. **Wait for the page to fully load**
4. **Tap the browser menu** (three dots `⋮` in the top right)
5. **Select "Add to Home screen"** or **"Install app"**
6. **Confirm installation**
   - App name and icon will be shown
   - Tap "Add" or "Install"
7. **Done!**
   - App icon will appear on your home screen
   - Tap the icon to run like a native app

#### Method 2: Other Browsers

- **Firefox**: Menu → "Add to Home screen"
- **Samsung Internet**: Menu → "Add to Home screen"
- **Edge**: Menu → "Apps" → "Install this site as an app"

---

### iPhone / iPad

#### Safari Browser

1. **Open Safari browser**
2. **Visit the application URL**
3. **Tap the share button** (square with arrow `□↑` at the bottom)
4. **Scroll down and select "Add to Home Screen"**
5. **Edit the name** (optional)
6. **Tap "Add"**
7. **Done!**
   - App icon will appear on your home screen
   - Tap the icon to run

**Note**: iOS only supports PWA installation via Safari browser

---

## 💻 Desktop Installation (Windows / Mac / Linux)

### Chrome Browser (Recommended)

1. **Open Chrome browser**
2. **Visit the application URL**
3. **Check the address bar**
   - An "Install" icon (`⊕` or `+`) will appear on the right
   - Or an "Install app" prompt will show
4. **Click the "Install" icon**
5. **Confirm installation**
   - App window preview will be shown
   - Click "Install"
6. **Done!**
   - App will run in a standalone window
   - Can be found in Start Menu / Applications

### Edge Browser

1. **Open Edge browser**
2. **Visit the application URL**
3. **An "Apps" icon will appear in the address bar**
4. **Click "Apps" → "Install this site as an app"**
5. **Confirm installation**
6. **Done!**

---

## 🚀 Quick Installation Steps (Summary)

### Mobile
```
1. Open browser
2. Visit app URL
3. Menu → "Add to Home screen"
4. Done!
```

### Desktop
```
1. Open Chrome/Edge
2. Visit app URL
3. Click "Install" icon in address bar
4. Done!
```

---

## ✅ Post-Installation Verification

### Checklist

- [ ] App icon appears on home screen / start menu
- [ ] App opens normally when clicked
- [ ] App runs in standalone window (desktop)
- [ ] Works offline (still usable when disconnected)
- [ ] Features work (Fate Simulator, AGI Shell, etc.)

---

## 🔧 Troubleshooting

### Common Issues

#### 1. No "Add to Home screen" Option

**Possible Causes**:
- Browser doesn't support PWA
- App manifest not configured correctly

**Solutions**:
- Use latest version of Chrome/Safari/Edge
- Ensure app is built and deployed correctly
- Check if manifest.webmanifest file exists

#### 2. App Won't Open After Installation

**Possible Causes**:
- Service Worker not registered correctly
- Cache issues

**Solutions**:
- Clear browser cache
- Reinstall the app
- Check console for errors

#### 3. Icon Not Displaying Correctly

**Possible Causes**:
- Icon files missing or wrong path

**Solutions**:
- Ensure `public/icon-192.png` and `public/icon-512.png` exist
- Check icon paths in manifest.webmanifest
- Rebuild the app

---

## 📋 Pre-Installation Setup

### For Developers

If you want to deploy your own version:

1. **Generate Icons**:
   ```bash
   # Open scripts/generate-icons.html
   # Generate icon-192.png and icon-512.png
   ```

2. **Build Application**:
   ```bash
   npm run build
   ```

3. **Deploy to Server**:
   - Vercel: `vercel`
   - Netlify: `netlify deploy --prod`
   - GitHub Pages: `npm run deploy`

4. **Visit Deployed URL**:
   - Use HTTPS (required for PWA)
   - Follow installation steps above

---

## 🎯 Usage After Installation

### First Time Use

1. **Open the app** (tap home screen icon)
2. **Choose a feature**:
   - 🎮 **Fate Simulator** - Playable fate simulation game
   - 🖥️ **AGI Shell** - Structural intelligence shell
   - 🌌 **Universe Forge** - Universe editor
   - ⚙️ **Runtime Control** - Runtime control

### Main Features

#### Fate Simulator
- Text RPG style game
- Choices affect fate
- Real-time state updates

#### AGI Shell
- Natural language control
- IAL command execution
- World state queries

---

## 📱 Installation Tips by Device

### Android
- ✅ Chrome, Firefox, Samsung Internet all support
- ✅ Runs like a native app after installation
- ✅ Can be added to home screen

### iOS
- ✅ Only Safari browser supported
- ✅ Runs like a native app after installation
- ✅ Can be added to home screen

### Windows
- ✅ Chrome and Edge both support
- ✅ Runs in standalone window after installation
- ✅ Can be found in Start Menu

### Mac
- ✅ Chrome, Safari, Edge all support
- ✅ Runs in standalone window after installation
- ✅ Can be found in Applications

---

## 🎉 Complete!

After installation, your The Seed Engine can:

- ✅ Run like a native app
- ✅ Work completely offline
- ✅ Start quickly
- ✅ Run in standalone window (desktop)

**Start using your civilization engine now!**

