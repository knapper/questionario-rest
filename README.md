# 🎯 Questionario — Interactive Trivia Game Platform

A browser-based trivia game platform that lets you create question sets and run them as live games — either solo or in a **Team vs Team** mode. The admin tab monitors the game in real time while players answer on a separate tab.

---

## ✨ Features

- Upload or create question sets (Multiple Choice & True/False)
- Export/import question sets as `.json` backup files
- **Simple Game Mode** — solo player, live admin monitor
- **Team vs Team Mode** — multiple teams, alternating turns, shuffled questions, live leaderboard
- Real-time sync between admin tab and game tab via the browser's `BroadcastChannel` API
- No backend or database required — everything runs in the browser

---

## 📋 Requirements

Before running this app, make sure you have:

| Tool | Version | How to check |
|---|---|---|
| **Node.js** | v20.19+ or v22.12+ | `node --version` |
| **npm** | v8+ (comes with Node) | `npm --version` |

> **⚠️ Important:** Vite 5 requires **Node.js 20.19 or higher**. If `node --version` shows an older version, download the latest LTS from [nodejs.org](https://nodejs.org).

---

## 🚀 Running Locally (for personal use)

### Step 1 — Install dependencies

Open a terminal in the project folder and run:

```bash
npm install
```

### Step 2 — Start the development server

```bash
npm run dev
```

You should see output like:

```
  VITE v5.x  ready in 500ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3 — Open the app

Go to **http://localhost:5173** in your browser.

---

## 🌐 Sharing on Your Local Network (LAN)

This lets other people on the **same Wi-Fi or wired network** (at home or in a classroom) open the app on their own devices.

### Step 1 — Start the server with network access enabled

```bash
npm run dev -- --host
```

Vite will now show two addresses:

```
  ➜  Local:    http://localhost:5173/
  ➜  Network:  http://192.168.x.x:5173/
```

### Step 2 — Find your local IP address (if not shown)

**On Windows:**
```powershell
ipconfig
```
Look for the **IPv4 Address** under your active adapter (Wi-Fi or Ethernet), e.g. `192.168.1.105`.

### Step 3 — Share the Network URL

Give everyone on the same network the **Network URL** shown in the terminal, for example:
```
http://192.168.1.105:5173
```

They can open it in any modern browser (Chrome, Edge, Firefox, Safari).

### Step 4 — Open the firewall port (Windows only, if needed)

If others can't connect, Windows Firewall may be blocking port `5173`. Run this in PowerShell as Administrator:

```powershell
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

> **🏠 Important for the game to work over LAN:** The admin and the player **must both use the same browser on the same machine**, OR be on the same browser profile with shared storage. The `BroadcastChannel` API only works between tabs in the same browser and same origin. For multi-device gameplay, see the [Hosting section](#-deploying-to-a-hosting-service-for-the-internet) below.

---

## ☁️ Deploying to a Hosting Service (for the Internet)

> **🔒 BroadcastChannel limitation:** Since the game uses the browser's `BroadcastChannel` API to sync the admin and game tabs, **both the admin and player must use the same browser on the same device**. This works perfectly for a setup where one person runs the show from a single computer/projector.

### Option A — Netlify (Recommended, Free)

**What you need:** A free [Netlify](https://netlify.com) account.

#### Step 1 — Build the production bundle

```bash
npm run build
```

This generates a `dist/` folder with all static files.

#### Step 2 — Deploy via Netlify Drop

1. Go to [app.netlify.com](https://app.netlify.com)
2. Log in and click **"Add new site" → "Deploy manually"**
3. Drag and drop your **`dist/`** folder onto the page
4. Netlify instantly gives you a public URL like `https://your-site.netlify.app`

#### Configure routing (required for the `?mode=game` URL)

Create a file at `public/_redirects` with this content:

```
/*    /index.html    200
```

Then rebuild and redeploy.

---

### Option B — Vercel (Free)

**What you need:** A free [Vercel](https://vercel.com) account and the Vercel CLI.

```bash
npm install -g vercel
npm run build
vercel --prod
```

Follow the prompts. Vercel auto-detects Vite apps and handles routing for you.

---

### Option C — GitHub Pages (Free)

**What you need:** The project in a GitHub repository.

#### Step 1 — Update `vite.config.js`

Add a `base` property matching your repository name:

```js
export default defineConfig({
  base: '/QuestionarioApp/',   // ← your repo name
  plugins: [react()],
})
```

#### Step 2 — Install the deploy tool and add a script

```bash
npm install --save-dev gh-pages
```

Add to `package.json` under `"scripts"`:

```json
"deploy": "vite build && gh-pages -d dist"
```

#### Step 3 — Deploy

```bash
npm run deploy
```

Your app will be live at:
```
https://<your-github-username>.github.io/QuestionarioApp/
```

---

### Option D — Self-hosted VPS / Server

If you host on a **VPS** (e.g., DigitalOcean, AWS, Linode):

#### Step 1 — Build

```bash
npm run build
```

#### Step 2 — Serve with a static file server

Install `serve`:

```bash
npm install -g serve
serve -s dist -l 80
```

Or configure **Nginx** to serve the `dist/` folder:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/QuestionarioApp/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> The `try_files ... /index.html` line is required so that navigation to `?mode=game` URLs doesn't return a 404.

---

## 📁 Project Structure

```
QuestionarioApp/
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── StarsBg.jsx      # Animated background
│   │   └── Toast.jsx        # Notification toasts
│   ├── views/
│   │   ├── InitView.jsx     # Welcome / upload or create
│   │   ├── BuilderView.jsx  # Step-by-step question builder
│   │   ├── DashboardView.jsx# Set overview & game mode picker
│   │   ├── ModeSelectView.jsx# Simple vs Team vs Team
│   │   ├── TeamSetupView.jsx # Team & member configuration
│   │   ├── AdminLiveView.jsx # Real-time admin monitor
│   │   ├── GameView.jsx     # Simple game player tab
│   │   └── TeamGameView.jsx # Team vs Team player tab
│   ├── App.jsx              # Main router
│   ├── index.css            # Design system & global styles
│   └── main.jsx             # Entry point
├── index.html
├── package.json
└── vite.config.js
```

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at `localhost:5173` |
| `npm run dev -- --host` | Start dev server, exposed on local network |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |

---

## 💡 Tips

- **Backup your questions:** Always download the `.json` backup from the Dashboard before closing the browser. Questions are not saved to any server.
- **LAN play:** The admin and game tab work best on the same device (same browser). This is by design — no server needed.
- **Multiple teams:** You can add up to 6 teams with up to any number of members. Questions are always shuffled for Team vs Team mode.
