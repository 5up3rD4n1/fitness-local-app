# Deploying Fitness App to iPhone

Since iOS Safari doesn't allow opening local HTML files directly, you need to host your app online. Here are three easy options:

## Option 1: GitHub Pages (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/fitness-app.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repo settings
   - Navigate to "Pages" section
   - Select "main" branch and "/dist" folder
   - Click Save

3. **Build and push**:
   ```bash
   npm run build
   git add dist -f
   git commit -m "Add build"
   git push
   ```

4. **Access on iPhone**:
   - Open Safari on your iPhone
   - Go to `https://YOUR_USERNAME.github.io/fitness-app/`
   - Tap the Share button
   - Select "Add to Home Screen"
   - The app will be installed like a native app!

## Option 2: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy**:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Access on iPhone**:
   - Open the provided URL in Safari
   - Tap Share → "Add to Home Screen"

## Option 3: Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   npm run build
   vercel --prod
   ```

3. **Access on iPhone**:
   - Open the provided URL in Safari
   - Tap Share → "Add to Home Screen"

## Creating App Icons (Optional)

The app needs icons for the home screen. Create two PNG files:

- `public/icon-192.png` (192x192 pixels)
- `public/icon-512.png` (512x512 pixels)

You can use any design tool or online icon generator. The icon should represent your fitness app.

## After Deployment

Once deployed and added to your iPhone home screen:
- ✅ Works offline (thanks to service worker)
- ✅ Full-screen experience
- ✅ Saves data in browser storage
- ✅ Looks like a native app

## Troubleshooting

**App won't install**: Make sure you're using Safari (not Chrome or other browsers)

**Data not saving**: Check if the app has storage permissions in iPhone Settings → Safari

**Icons not showing**: Add `icon-192.png` and `icon-512.png` to the `public` folder before building
