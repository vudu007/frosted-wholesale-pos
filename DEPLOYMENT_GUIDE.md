# 🚀 Deployment Guide - Frosted Wholesale Platform

## Quick Testing Deployment Options

### Option 1: Free Hosting (Easiest - Recommended for Testing)

#### **Frontend: Vercel (Free)**
1. **Sign up at:** https://vercel.com
2. **Import from GitHub:**
   - Click "New Project"
   - Import `vudu007/frosted-wholesale-pos`
   - Root Directory: `frontend`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```
4. **Deploy** - Takes ~2 minutes
5. **Result:** `https://frosted-wholesale.vercel.app`

#### **Backend: Railway (Free $5 credit)**
1. **Sign up at:** https://railway.app
2. **New Project → Deploy from GitHub:**
   - Select `vudu007/frosted-wholesale-pos`
   - Root Directory: `backend`
3. **Add PostgreSQL Database:**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway auto-connects it
4. **Environment Variables:**
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-super-secret-key-change-this
   PORT=3000
   NODE_ENV=production
   ```
5. **Deploy** - Takes ~3 minutes
6. **Run Migrations:**
   - Go to backend service
   - Settings → Deploy → Add command: `npx prisma migrate deploy`
7. **Result:** `https://frosted-wholesale-backend.railway.app`

**Total Time:** ~10 minutes | **Cost:** FREE

---

### Option 2: Render (100% Free)

#### **Frontend: Render Static Site**
1. **Sign up at:** https://render.com
2. **New Static Site:**
   - Connect GitHub: `vudu007/frosted-wholesale-pos`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
3. **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
4. **Deploy**
5. **Result:** `https://frosted-wholesale.onrender.com`

#### **Backend: Render Web Service**
1. **New Web Service:**
   - Connect GitHub: `vudu007/frosted-wholesale-pos`
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && npm run start:prod`
2. **Add PostgreSQL Database:**
   - New → PostgreSQL
   - Copy connection string
3. **Environment Variables:**
   ```
   DATABASE_URL=your-postgres-connection-string
   JWT_SECRET=your-super-secret-key
   PORT=3000
   NODE_ENV=production
   ```
4. **Deploy**
5. **Result:** `https://frosted-wholesale-backend.onrender.com`

**Note:** Free tier spins down after inactivity (takes 30s to wake up)

---

### Option 3: Netlify + Supabase (Free)

#### **Database: Supabase (Free)**
1. **Sign up at:** https://supabase.com
2. **New Project:**
   - Create project
   - Copy connection string from Settings → Database
3. **Run Migrations:**
   - Use Supabase SQL Editor
   - Or connect locally and run: `npx prisma migrate deploy`

#### **Backend: Render/Railway** (as above)

#### **Frontend: Netlify**
1. **Sign up at:** https://netlify.com
2. **New Site from Git:**
   - Connect GitHub: `vudu007/frosted-wholesale-pos`
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
3. **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url
   ```
4. **Deploy**
5. **Result:** `https://frosted-wholesale.netlify.app`

---

## 🌐 Option 4: Google Cloud Platform (GCP)

### **Google Cloud Run + Cloud SQL (Recommended for Google)**

#### **Prerequisites:**
1. Google Cloud account (Free $300 credit for 90 days)
2. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install
3. Enable billing on your GCP project

#### **Step 1: Set Up Google Cloud Project**

```bash
# Install gcloud CLI (if not installed)
# Windows: Download from https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Create new project
gcloud projects create frosted-wholesale --name="Frosted Wholesale"

# Set project
gcloud config set project frosted-wholesale

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### **Step 2: Deploy PostgreSQL Database (Cloud SQL)**

```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create frosted-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YourSecurePassword123

# Create database
gcloud sql databases create frosted_wholesale \
  --instance=frosted-db

# Get connection name
gcloud sql instances describe frosted-db --format="value(connectionName)"
# Save this - you'll need it!
```

**Cost:** ~$7-10/month (db-f1-micro tier)

#### **Step 3: Deploy Backend to Cloud Run**

1. **Create Dockerfile in backend folder:**

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Expose port
EXPOSE 8080

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
```

2. **Create .dockerignore:**

```
# backend/.dockerignore
node_modules
dist
.env
.git
*.md
```

3. **Deploy to Cloud Run:**

```bash
# Navigate to backend
cd backend

# Build and deploy
gcloud run deploy frosted-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,PORT=8080,JWT_SECRET=your-secret-key" \
  --add-cloudsql-instances=frosted-wholesale:us-central1:frosted-db

# Get backend URL
gcloud run services describe frosted-backend --region=us-central1 --format="value(status.url)"
```

**Cost:** Free tier includes 2 million requests/month

#### **Step 4: Deploy Frontend to Firebase Hosting**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Navigate to frontend
cd ../frontend

# Initialize Firebase
firebase init hosting

# Select:
# - Use existing project or create new
# - Public directory: dist
# - Single-page app: Yes
# - GitHub deploys: No

# Update .env with backend URL
echo "VITE_API_URL=https://frosted-backend-xxx.run.app" > .env.production

# Build frontend
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

**Cost:** Free tier includes 10GB storage, 360MB/day transfer

#### **Step 5: Configure Database Connection**

Update Cloud Run backend with database connection:

```bash
# Get Cloud SQL connection string
CONNECTION_NAME=$(gcloud sql instances describe frosted-db --format="value(connectionName)")

# Update Cloud Run service
gcloud run services update frosted-backend \
  --region=us-central1 \
  --set-env-vars="DATABASE_URL=postgresql://postgres:YourSecurePassword123@localhost/frosted_wholesale?host=/cloudsql/$CONNECTION_NAME"
```

---

### **Alternative: Google App Engine**

#### **Deploy Backend to App Engine**

1. **Create app.yaml in backend:**

```yaml
# backend/app.yaml
runtime: nodejs18
env: standard
instance_class: F1

env_variables:
  NODE_ENV: "production"
  JWT_SECRET: "your-secret-key"
  DATABASE_URL: "postgresql://user:pass@/dbname?host=/cloudsql/CONNECTION_NAME"

automatic_scaling:
  min_instances: 0
  max_instances: 10
```

2. **Deploy:**

```bash
cd backend
gcloud app deploy
```

#### **Deploy Frontend to App Engine**

1. **Create app.yaml in frontend:**

```yaml
# frontend/app.yaml
runtime: nodejs18
env: standard

handlers:
  - url: /
    static_files: dist/index.html
    upload: dist/index.html

  - url: /(.*)
    static_files: dist/\1
    upload: dist/(.*)
```

2. **Deploy:**

```bash
cd frontend
npm run build
gcloud app deploy
```

---

### **Google Cloud Platform - Quick Summary**

**Option A: Cloud Run + Cloud SQL + Firebase (Recommended)**
- ✅ Serverless (scales to zero)
- ✅ Pay per use
- ✅ Easy deployment
- ✅ Free tier available
- 💰 ~$10-20/month for moderate use

**Option B: App Engine + Cloud SQL**
- ✅ Fully managed
- ✅ Auto-scaling
- ✅ Integrated monitoring
- 💰 ~$20-50/month

**Option C: Compute Engine (VM)**
- ✅ Full control
- ✅ Can run both backend and frontend
- ✅ More complex setup
- 💰 ~$5-30/month depending on size

---

### **Google Cloud - Environment Variables**

**Backend (Cloud Run/App Engine):**
```bash
NODE_ENV=production
PORT=8080
JWT_SECRET=your-super-secret-key
DATABASE_URL=postgresql://postgres:password@/dbname?host=/cloudsql/CONNECTION_NAME
FRONTEND_URL=https://your-app.web.app
```

**Frontend (Firebase):**
```bash
VITE_API_URL=https://frosted-backend-xxx.run.app
```

---

### **Google Cloud - Cost Estimate**

**Free Tier (First 90 days - $300 credit):**
- Everything free during trial period

**After Free Tier:**
- Cloud Run: $0 (within free tier) to $10/month
- Cloud SQL (db-f1-micro): $7-10/month
- Firebase Hosting: $0 (within free tier)
- **Total: ~$10-20/month**

**Comparison:**
- Railway + Vercel: FREE (limited)
- Render: FREE (with spin-down)
- Google Cloud: ~$10-20/month (always on, scalable)

---

## 📋 Step-by-Step: Railway + Vercel (Recommended)

### **Step 1: Deploy Backend to Railway**

1. **Go to:** https://railway.app/new
2. **Sign in with GitHub**
3. **Deploy from GitHub repo:**
   ```
   - Click "Deploy from GitHub repo"
   - Select: vudu007/frosted-wholesale-pos
   - Click "Deploy Now"
   ```

4. **Configure Backend Service:**
   ```
   - Click on the deployed service
   - Settings → Root Directory: backend
   - Settings → Build Command: npm install && npx prisma generate && npm run build
   - Settings → Start Command: npm run start:prod
   ```

5. **Add PostgreSQL Database:**
   ```
   - Click "New" in your project
   - Select "Database" → "Add PostgreSQL"
   - Railway automatically creates DATABASE_URL variable
   ```

6. **Add Environment Variables:**
   ```
   Go to backend service → Variables → Add:
   
   JWT_SECRET=frosted-wholesale-secret-key-2024
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

7. **Run Database Migrations:**
   ```
   - Go to backend service
   - Click "Settings" → "Deploy"
   - Add custom start command:
     npx prisma migrate deploy && npm run start:prod
   - Redeploy
   ```

8. **Get Backend URL:**
   ```
   - Go to Settings → Networking
   - Copy the public URL (e.g., https://frosted-wholesale-production.up.railway.app)
   ```

### **Step 2: Deploy Frontend to Vercel**

1. **Go to:** https://vercel.com/new
2. **Import Git Repository:**
   ```
   - Click "Import Git Repository"
   - Select: vudu007/frosted-wholesale-pos
   - Click "Import"
   ```

3. **Configure Project:**
   ```
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: dist
   ```

4. **Add Environment Variable:**
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   
   (Use the Railway backend URL from Step 1.8)
   ```

5. **Deploy:**
   ```
   - Click "Deploy"
   - Wait ~2 minutes
   - Get your URL: https://frosted-wholesale.vercel.app
   ```

6. **Update Backend CORS:**
   ```
   - Go back to Railway
   - Update FRONTEND_URL variable with your Vercel URL
   - Redeploy backend
   ```

### **Step 3: Seed Database (Optional)**

1. **Connect to Railway Database:**
   ```bash
   # Get DATABASE_URL from Railway
   # Run locally:
   cd backend
   npx prisma db seed
   ```

2. **Or use Railway CLI:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Link project
   railway link
   
   # Run seed
   railway run npx prisma db seed
   ```

---

## 🧪 Testing Your Deployment

### **1. Test Backend API:**
```bash
# Health check
curl https://your-backend.railway.app

# Get products
curl https://your-backend.railway.app/products

# Get stores
curl https://your-backend.railway.app/stores
```

### **2. Test Frontend:**
1. Visit: `https://your-frontend.vercel.app`
2. Navigate to Shop page
3. Add items to cart
4. Test guest checkout
5. Test customer registration/login

### **3. Test Full Flow:**
1. **Guest Checkout:**
   - Add 1-3 items → Should require immediate payment
   - Add 4-10 items → Should show 1 week credit
   - Add 11+ items → Should show 2 weeks credit

2. **Customer Account:**
   - Register new account
   - Login
   - Place order
   - Check dashboard

3. **Staff POS:**
   - Login with staff credentials
   - Access ordering page
   - Process sale

---

## 🔧 Environment Variables Reference

### **Backend (.env)**
```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Server
PORT=3000
NODE_ENV=production

# CORS
FRONTEND_URL="https://your-frontend.vercel.app"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### **Frontend (.env)**
```env
# API URL
VITE_API_URL="https://your-backend.railway.app"
```

---

## 🐛 Troubleshooting

### **Backend Issues:**

**Problem:** Database connection fails
```bash
Solution:
1. Check DATABASE_URL is correct
2. Ensure migrations ran: npx prisma migrate deploy
3. Check Railway logs for errors
```

**Problem:** CORS errors
```bash
Solution:
1. Add FRONTEND_URL to backend env variables
2. Update main.ts to include your frontend URL
3. Redeploy backend
```

**Problem:** 502 Bad Gateway
```bash
Solution:
1. Check backend logs in Railway
2. Ensure start command is correct
3. Verify PORT is set to 3000
```

### **Frontend Issues:**

**Problem:** API calls fail
```bash
Solution:
1. Check VITE_API_URL is correct
2. Ensure backend is running
3. Check browser console for CORS errors
```

**Problem:** Build fails
```bash
Solution:
1. Check build command: npm run build
2. Verify all dependencies in package.json
3. Check Vercel build logs
```

---

## 💰 Cost Breakdown

### **Free Tier Limits:**

**Railway:**
- $5 free credit/month
- ~500 hours of usage
- Perfect for testing

**Vercel:**
- 100GB bandwidth/month
- Unlimited deployments
- Custom domains

**Render:**
- 750 hours/month free
- Spins down after inactivity
- Good for testing

**Supabase:**
- 500MB database
- 2GB bandwidth
- Perfect for testing

---

## 🚀 Quick Deploy Commands

### **One-Click Deploy (Coming Soon)**

We can add deploy buttons to README:

```markdown
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vudu007/frosted-wholesale-pos)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/vudu007/frosted-wholesale-pos)
```

---

## 📊 Monitoring & Logs

### **Railway:**
- View logs: Project → Service → Logs
- Metrics: Project → Service → Metrics
- Database: Project → PostgreSQL → Data

### **Vercel:**
- View logs: Project → Deployments → [deployment] → Logs
- Analytics: Project → Analytics
- Performance: Project → Speed Insights

---

## 🔐 Security Checklist

Before deploying:
- [ ] Change JWT_SECRET to a strong random string
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS (automatic on Railway/Vercel)
- [ ] Set up CORS properly
- [ ] Don't commit .env files
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting (optional)
- [ ] Set up monitoring (optional)

---

## 📞 Need Help?

**Railway Support:** https://railway.app/help
**Vercel Support:** https://vercel.com/support
**Render Support:** https://render.com/docs

**Common Issues:**
- Check deployment logs first
- Verify environment variables
- Test API endpoints with curl
- Check browser console for errors

---

## ✅ Deployment Checklist

- [ ] Backend deployed to Railway
- [ ] PostgreSQL database created
- [ ] Database migrations ran
- [ ] Backend environment variables set
- [ ] Backend URL obtained
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] CORS configured
- [ ] Database seeded (optional)
- [ ] Test guest checkout
- [ ] Test customer registration
- [ ] Test staff POS
- [ ] Share URL with team

---

**Estimated Total Time:** 15-20 minutes
**Total Cost:** FREE (with free tier limits)

Your platform will be live and accessible worldwide! 🌍🚀

---

## 🌐 Google Cloud Deployment - Detailed Steps

### **Complete Google Cloud Run Setup**

#### **1. Initial Setup (5 minutes)**

```bash
# Install Google Cloud SDK
# Windows: https://cloud.google.com/sdk/docs/install-sdk#windows
# Download and run GoogleCloudSDKInstaller.exe

# After installation, open new terminal and login
gcloud auth login

# Create project
gcloud projects create frosted-wholesale-$(date +%s) --name="Frosted Wholesale"

# List projects and copy your project ID
gcloud projects list

# Set your project (replace PROJECT_ID)
gcloud config set project PROJECT_ID

# Enable APIs
gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com
```

#### **2. Create Database (5 minutes)**

```bash
# Create PostgreSQL instance
gcloud sql instances create frosted-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=FrostedWholesale2024!

# Wait for instance to be ready (2-3 minutes)
gcloud sql instances list

# Create database
gcloud sql databases create frosted_wholesale --instance=frosted-db

# Create user
gcloud sql users create frosted_user \
  --instance=frosted-db \
  --password=SecurePassword123!

# Get connection name (save this!)
gcloud sql instances describe frosted-db --format="value(connectionName)"
```

#### **3. Prepare Backend (5 minutes)**

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
```

Create `backend/.dockerignore`:

```
node_modules
dist
.env
.git
*.md
test
coverage
```

#### **4. Deploy Backend (5 minutes)**

```bash
cd backend

# Get your Cloud SQL connection name
CONNECTION_NAME=$(gcloud sql instances describe frosted-db --format="value(connectionName)")

# Deploy to Cloud Run
gcloud run deploy frosted-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --timeout 300 \
  --set-env-vars="NODE_ENV=production,PORT=8080,JWT_SECRET=frosted-wholesale-secret-2024" \
  --set-env-vars="DATABASE_URL=postgresql://frosted_user:SecurePassword123!@localhost/frosted_wholesale?host=/cloudsql/$CONNECTION_NAME" \
  --add-cloudsql-instances=$CONNECTION_NAME

# Get backend URL
BACKEND_URL=$(gcloud run services describe frosted-backend --region=us-central1 --format="value(status.url)")
echo "Backend URL: $BACKEND_URL"
```

#### **5. Deploy Frontend to Firebase (10 minutes)**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Navigate to frontend
cd ../frontend

# Initialize Firebase
firebase init

# Select:
# - Hosting
# - Create new project or use existing
# - Public directory: dist
# - Single-page app: Yes
# - Automatic builds: No

# Create production env file
echo "VITE_API_URL=$BACKEND_URL" > .env.production

# Build
npm run build

# Deploy
firebase deploy --only hosting

# Get frontend URL
firebase hosting:sites:list
```

#### **6. Update CORS (2 minutes)**

```bash
# Get your Firebase URL
FRONTEND_URL="https://your-app.web.app"

# Update backend with CORS
gcloud run services update frosted-backend \
  --region=us-central1 \
  --set-env-vars="FRONTEND_URL=$FRONTEND_URL"
```

#### **7. Test Deployment**

```bash
# Test backend
curl $BACKEND_URL

# Test products endpoint
curl $BACKEND_URL/products

# Visit frontend
echo "Visit: $FRONTEND_URL"
```

---

### **Google Cloud - Monitoring & Logs**

#### **View Logs:**

```bash
# Backend logs
gcloud run services logs read frosted-backend --region=us-central1

# Database logs
gcloud sql operations list --instance=frosted-db

# Real-time logs
gcloud run services logs tail frosted-backend --region=us-central1
```

#### **View Metrics:**

```bash
# Open Cloud Console
gcloud console

# Navigate to:
# - Cloud Run → frosted-backend → Metrics
# - Cloud SQL → frosted-db → Monitoring
```

---

### **Google Cloud - Cost Optimization**

#### **Reduce Costs:**

1. **Use Cloud Run (not App Engine)**
   - Scales to zero when not in use
   - Pay only for requests

2. **Use db-f1-micro for database**
   - Smallest instance ($7/month)
   - Sufficient for testing

3. **Enable Cloud SQL automatic backups**
   ```bash
   gcloud sql instances patch frosted-db \
     --backup-start-time=03:00
   ```

4. **Set up budget alerts**
   ```bash
   # In Cloud Console:
   # Billing → Budgets & alerts → Create budget
   # Set alert at $10, $20, $30
   ```

---

### **Google Cloud - Troubleshooting**

#### **Common Issues:**

**Problem: Cloud Run deployment fails**
```bash
# Check build logs
gcloud builds list --limit=5

# View specific build
gcloud builds log BUILD_ID
```

**Problem: Database connection fails**
```bash
# Verify Cloud SQL connection
gcloud sql instances describe frosted-db

# Test connection
gcloud sql connect frosted-db --user=frosted_user
```

**Problem: Frontend can't reach backend**
```bash
# Check CORS settings
gcloud run services describe frosted-backend --region=us-central1

# Update CORS
# Edit backend/src/main.ts to include your Firebase URL
```

---

### **Google Cloud - Production Checklist**

- [ ] Cloud SQL instance created
- [ ] Database and user created
- [ ] Backend deployed to Cloud Run
- [ ] Frontend deployed to Firebase
- [ ] Environment variables set
- [ ] CORS configured
- [ ] Database migrations ran
- [ ] SSL/HTTPS enabled (automatic)
- [ ] Budget alerts set up
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Custom domain added (optional)

---

### **Google Cloud - Custom Domain**

#### **Add Custom Domain to Firebase:**

```bash
# In Firebase Console:
# Hosting → Add custom domain
# Follow DNS configuration steps

# Or via CLI:
firebase hosting:channel:deploy production --only hosting
```

#### **Add Custom Domain to Cloud Run:**

```bash
# Map domain to Cloud Run
gcloud run domain-mappings create \
  --service frosted-backend \
  --domain api.yourdomain.com \
  --region us-central1
```

---

## 🆚 Hosting Comparison

| Feature | Railway + Vercel | Render | Google Cloud | AWS | Azure |
|---------|-----------------|--------|--------------|-----|-------|
| **Setup Time** | 15 min | 20 min | 30 min | 45 min | 45 min |
| **Free Tier** | Yes ($5 credit) | Yes (limited) | $300 credit | Yes (12 months) | $200 credit |
| **Monthly Cost** | $0-10 | $0 | $10-20 | $20-50 | $20-50 |
| **Scalability** | Good | Good | Excellent | Excellent | Excellent |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Performance** | Good | Good | Excellent | Excellent | Excellent |
| **Support** | Community | Email | 24/7 (paid) | 24/7 (paid) | 24/7 (paid) |

**Recommendation:**
- **Testing:** Railway + Vercel (easiest, free)
- **Small Business:** Google Cloud Run (scalable, affordable)
- **Enterprise:** Google Cloud / AWS / Azure (full features)

---
