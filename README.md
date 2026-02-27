# Cell Hardening Audit – Netlify Edition

A fully static, cloud-hosted version of the Cell Hardening Audit tool.
Deploys to **Netlify** with **Supabase** as the cloud database.

## Setup (One-Time)

### 1. Create a Supabase Project (Free)
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **New Project** → name it `cell-hardening-audit`
3. Pick a region (us-east-1 is fine) and set a DB password
4. Wait for provisioning (~2 min)

### 2. Create Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Paste the contents of `setup.sql` and click **Run**

### 3. Create Photo Storage Bucket
1. Go to **Storage** in Supabase dashboard
2. Click **New Bucket**
3. Name: `audit-photos`
4. Check **Public bucket** → Create

### 4. Get Your API Keys
1. Go to **Settings** → **API**
2. Copy your **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy your **anon/public** key

### 5. Update Config
1. Open `js/config.js`
2. Replace `YOUR_PROJECT_ID` with your Supabase project URL
3. Replace `YOUR_ANON_KEY_HERE` with your anon key

### 6. Deploy to Netlify
1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **Add new site** → **Deploy manually**
3. Drag and drop the entire `flib-audit-netlify` folder
4. Done! Your site will be at `https://your-site.netlify.app`

## Reverting to Local Version

The original FastAPI version is tagged in git:
```bash
cd flib-audit-tool
git checkout v1-local
```
Then run: `.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8899`

## File Structure
```
flib-audit-netlify/
├── index.html          # Dashboard
├── archive.html        # Archive page
├── new-audit.html      # New audit form
├── audit.html          # Active audit checklist
├── report.html         # Audit report
├── netlify.toml        # Netlify config
├── setup.sql           # Supabase database schema
├── js/
│   ├── config.js       # Supabase connection + checklist data
│   ├── db.js           # All database operations
│   ├── nav.js          # Shared nav/footer/utilities
│   ├── dashboard.js    # Dashboard page logic
│   ├── archive.js      # Archive page logic
│   ├── audit.js        # Audit checklist logic
│   └── report.js       # Report page logic
└── README.md           # This file
```
