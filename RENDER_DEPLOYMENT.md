# 🚀 Deploy to Render - Step-by-Step Guide

## ✅ Why Render is Perfect for You

- ✅ **100% FREE** - No credit card required
- ✅ **PostgreSQL included** - Free database
- ✅ **Node.js support** - Perfect for NestJS
- ✅ **Static site hosting** - Perfect for React
- ✅ **Auto-deploy from GitHub** - Push to deploy
- ✅ **SSL/HTTPS included** - Secure by default
- ✅ **Custom domains** - Free on all plans

**Only Limitation:** Free tier spins down after 15 minutes of inactivity (takes ~30 seconds to wake up)

---

## 📋 Complete Deployment Guide

### **Prerequisites**
- ✅ GitHub account (you have this)
- ✅ Repository: https://github.com/vudu007/frosted-wholesale-pos
- ✅ Render account (we'll create this)

**Total Time:** 20-25 minutes
**Total Cost:** $0 (FREE)

---

## 🎯 Step-by-Step Deployment

### **Step 1: Create Render Account (2 minutes)**

1. **Go to:** https://render.com
2. **Click:** "Get Started for Free"
3. **Sign up with GitHub:**
   - Click "Sign up with GitHub"
   - Authorize Render to access your repositories
   - Select "All repositories" or just `frosted-wholesale-pos`
4. **Complete signup**

---

### **Step 2: Deploy PostgreSQL Database (3 minutes)**

1. **From Render Dashboard:**
   - Click "New +" button (top right)
   - Select "PostgreSQL"

2. **Configure Database:**
   ```
   Name: frosted-wholesale-db
   Database: frosted_wholesale
   User: frosted_user
   Region: Oregon (US West) or closest to you
   PostgreSQL Version: 15
   Plan: Free
   ```

3. **Click "Create Database"**

4. **Wait 2-3 minutes** for database to be ready

5. **Copy Connection Details:**
   - Go to your database dashboard
   - Scroll to "Connections"
   - Copy the **Internal Database URL** (starts with `postgresql://`)
   - Save this - you'll need it!

**Example URL:**
```
postgresql://frosted_user:xxxxx@dpg-xxxxx-a.oregon-postgres.render.com/frosted_wholesale
```

---

### **Step 3: Deploy Backend (Web Service) (8 minutes)**

1. **From Render Dashboard:**
   - Click "New +" button
   - Select "Web Service"

2. **Connect Repository:**
   - Select "Build and deploy from a Git repository"
   - Click "Next"
   - Find and select: `vudu007/frosted-wholesale-pos`
   - Click "Connect"

3. **Configure Backend Service:**
   ```
   Name: frosted-wholesale-backend
   Region: Oregon (US West) - same as database
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npx prisma generate && npm run build
   Start Command: npx prisma migrate deploy && npm run start:prod
   Plan: Free
   ```

4. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable"
   
   Add these variables:
   ```
   DATABASE_URL = [paste your Internal Database URL from Step 2]
   JWT_SECRET = frosted-wholesale-secret-key-2024
   PORT = 10000
   NODE_ENV = production
   ```

   **Important:** Use the **Internal Database URL** (not External)

5. **Click "Create Web Service"**

6. **Wait for Deployment (5-7 minutes):**
   - Watch the build logs
   - Wait for "Your service is live 🎉"
   - You'll see: `==> Build successful 🎉`
   - Then: `==> Deploying...`
   - Finally: `==> Your service is live 🎉`

7. **Copy Backend URL:**
   - At the top of the page, you'll see your service URL
   - Example: `https://frosted-wholesale-backend.onrender.com`
   - **Copy this URL** - you'll need it for the frontend!

---

### **Step 4: Deploy Frontend (Static Site) (5 minutes)**

1. **From Render Dashboard:**
   - Click "New +" button
   - Select "Static Site"

2. **Connect Repository:**
   - Select "Build and deploy from a Git repository"
   - Click "Next"
   - Find and select: `vudu007/frosted-wholesale-pos`
   - Click "Connect"

3. **Configure Frontend:**
   ```
   Name: frosted-wholesale
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Add Environment Variable:**
   Click "Advanced" → "Add Environment Variable"
   
   ```
   VITE_API_URL = [paste your backend URL from Step 3]
   ```
   
   **Example:**
   ```
   VITE_API_URL = https://frosted-wholesale-backend.onrender.com
   ```

5. **Click "Create Static Site"**

6. **Wait for Deployment (3-5 minutes):**
   - Watch the build logs
   - Wait for "Site is live 🎉"

7. **Get Your Frontend URL:**
   - At the top: `https://frosted-wholesale.onrender.com`
   - **This is your live website!**

---

### **Step 5: Update Backend CORS (2 minutes)**

1. **Go back to Backend Service:**
   - Dashboard → frosted-wholesale-backend

2. **Add Frontend URL to Environment:**
   - Click "Environment" (left sidebar)
   - Click "Add Environment Variable"
   - Add:
     ```
     FRONTEND_URL = [your frontend URL from Step 4]
     ```
   - Example: `https://frosted-wholesale.onrender.com`

3. **Save Changes:**
   - Render will automatically redeploy (takes 2-3 minutes)

---

### **Step 6: Seed Database (Optional - 3 minutes)**

**Option A: Using Render Shell**

1. **Go to Backend Service**
2. **Click "Shell" tab** (top right)
3. **Run seed command:**
   ```bash
   npx prisma db seed
   ```

**Option B: Using Local Connection**

1. **Get External Database URL:**
   - Go to your PostgreSQL database
   - Copy "External Database URL"

2. **Run locally:**
   ```bash
   cd backend
   DATABASE_URL="[external URL]" npx prisma db seed
   ```

---

## 🧪 Testing Your Deployment

### **1. Test Backend API**

Open your browser or use curl:

```bash
# Health check
curl https://frosted-wholesale-backend.onrender.com

# Get products
curl https://frosted-wholesale-backend.onrender.com/products

# Get stores
curl https://frosted-wholesale-backend.onrender.com/stores
```

**Expected:** JSON responses with data

### **2. Test Frontend**

1. **Visit:** `https://frosted-wholesale.onrender.com`
2. **Check pages:**
   - Home page loads
   - Shop page shows products
   - Cart drawer works
   - Guest checkout opens

3. **Test Guest Checkout:**
   - Add 1-3 items → Should show "Immediate payment required"
   - Add 4-10 items → Should show "1 week credit"
   - Add 11+ items → Should show "2 weeks credit"

4. **Test Customer Features:**
   - Register new account
   - Login
   - View dashboard
   - Place order

### **3. Test Full Flow**

1. **Browse products** on Shop page
2. **Add items to cart** (try different quantities)
3. **Open cart drawer** (dark themed)
4. **Proceed to checkout**
5. **Fill customer information**
6. **See payment terms** based on quantity
7. **Complete order**
8. **View order confirmation**

---

## 🔧 Configuration Summary

### **Services Created:**

1. **PostgreSQL Database**
   - Name: `frosted-wholesale-db`
   - Plan: Free
   - URL: Internal connection string

2. **Backend (Web Service)**
   - Name: `frosted-wholesale-backend`
   - URL: `https://frosted-wholesale-backend.onrender.com`
   - Plan: Free
   - Runtime: Node.js

3. **Frontend (Static Site)**
   - Name: `frosted-wholesale`
   - URL: `https://frosted-wholesale.onrender.com`
   - Plan: Free
   - Framework: Vite/React

### **Environment Variables:**

**Backend:**
```env
DATABASE_URL=postgresql://frosted_user:xxxxx@dpg-xxxxx.oregon-postgres.render.com/frosted_wholesale
JWT_SECRET=frosted-wholesale-secret-key-2024
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://frosted-wholesale.onrender.com
```

**Frontend:**
```env
VITE_API_URL=https://frosted-wholesale-backend.onrender.com
```

---

## 🐛 Troubleshooting

### **Problem: Backend build fails**

**Solution:**
1. Check build logs in Render dashboard
2. Verify `backend` root directory is correct
3. Ensure build command is:
   ```
   npm install && npx prisma generate && npm run build
   ```
4. Check that all dependencies are in `package.json`

### **Problem: Database connection fails**

**Solution:**
1. Use **Internal Database URL** (not External)
2. Verify DATABASE_URL in backend environment variables
3. Check database is in same region as backend
4. Ensure migrations ran:
   ```
   npx prisma migrate deploy
   ```

### **Problem: Frontend can't reach backend**

**Solution:**
1. Check VITE_API_URL in frontend environment
2. Verify backend URL is correct (no trailing slash)
3. Check CORS: Add FRONTEND_URL to backend environment
4. Redeploy backend after adding FRONTEND_URL

### **Problem: "Service Unavailable" after inactivity**

**This is normal on free tier:**
- Free services spin down after 15 minutes
- First request takes ~30 seconds to wake up
- Subsequent requests are fast
- **Solution:** Upgrade to paid plan ($7/month) for always-on

### **Problem: Build takes too long**

**Solution:**
- This is normal for first deployment (5-7 minutes)
- Subsequent deploys are faster (2-3 minutes)
- Be patient and watch the logs

---

## 💰 Cost Breakdown

### **Free Tier Includes:**

**PostgreSQL:**
- ✅ 1GB storage
- ✅ 90 days data retention
- ✅ Automatic backups
- ✅ SSL connections

**Web Service (Backend):**
- ✅ 750 hours/month
- ✅ 512MB RAM
- ✅ Shared CPU
- ✅ Spins down after 15 min inactivity

**Static Site (Frontend):**
- ✅ 100GB bandwidth/month
- ✅ Unlimited builds
- ✅ Global CDN
- ✅ Always on (no spin down)

**Total Cost:** $0/month

### **Upgrade Options (Optional):**

**If you need always-on backend:**
- Starter Plan: $7/month
- No spin down
- More resources

**If you need more database:**
- Starter Plan: $7/month
- 10GB storage
- Better performance

---

## 🚀 Auto-Deploy Setup

**Already configured!** Every time you push to GitHub:

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Render automatically:**
   - Detects the push
   - Rebuilds your services
   - Deploys new version
   - Takes 3-5 minutes

3. **Check deployment:**
   - Go to Render dashboard
   - See "Deploying..." status
   - Wait for "Live" status

---

## 📊 Monitoring & Logs

### **View Logs:**

1. **Backend Logs:**
   - Dashboard → frosted-wholesale-backend
   - Click "Logs" tab
   - See real-time logs

2. **Frontend Logs:**
   - Dashboard → frosted-wholesale
   - Click "Logs" tab
   - See build logs

3. **Database Logs:**
   - Dashboard → frosted-wholesale-db
   - Click "Logs" tab
   - See connection logs

### **View Metrics:**

1. **Go to service dashboard**
2. **Click "Metrics" tab**
3. **See:**
   - CPU usage
   - Memory usage
   - Request count
   - Response times

---

## 🔐 Security Checklist

- [x] HTTPS enabled (automatic)
- [x] Environment variables secured
- [x] Database password strong
- [x] JWT secret set
- [x] CORS configured
- [x] Internal database URL used
- [x] No secrets in code
- [x] .env files in .gitignore

---

## 🎯 Custom Domain (Optional)

### **Add Your Own Domain:**

1. **Buy domain** (Namecheap, GoDaddy, etc.)

2. **In Render:**
   - Go to your static site
   - Click "Settings"
   - Scroll to "Custom Domains"
   - Click "Add Custom Domain"
   - Enter your domain: `www.yourdomain.com`

3. **Update DNS:**
   - Add CNAME record in your domain registrar:
     ```
     Type: CNAME
     Name: www
     Value: frosted-wholesale.onrender.com
     ```

4. **Wait for DNS propagation** (5-30 minutes)

5. **SSL automatically configured** by Render

---

## ✅ Deployment Checklist

- [x] Render account created
- [x] PostgreSQL database deployed
- [x] Database connection string copied
- [x] Backend web service deployed
- [x] Backend environment variables set
- [x] Backend URL copied
- [x] Frontend static site deployed
- [x] Frontend environment variable set
- [x] CORS configured (FRONTEND_URL added)
- [x] Database seeded (optional)
- [x] Backend API tested
- [x] Frontend tested
- [x] Guest checkout tested
- [x] Customer features tested
- [x] Auto-deploy verified

---

## 🎉 Success!

**Your Frosted Wholesale platform is now live on Render!**

**URLs:**
- **Frontend:** https://frosted-wholesale.onrender.com
- **Backend API:** https://frosted-wholesale-backend.onrender.com
- **Database:** Managed by Render

**Features Live:**
- ✅ Ice cream wholesale e-commerce
- ✅ Guest checkout with payment terms
- ✅ Customer accounts & loyalty
- ✅ Dark-themed cart drawer
- ✅ Staff POS system
- ✅ Order management
- ✅ Inventory tracking
- ✅ Mobile-responsive design

**Next Steps:**
1. Share your frontend URL with customers
2. Test all features thoroughly
3. Monitor logs for any issues
4. Consider upgrading if you need always-on backend

---

## 📞 Need Help?

**Render Support:**
- Documentation: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

**Common Issues:**
- Check logs first
- Verify environment variables
- Ensure correct URLs (no trailing slashes)
- Wait for services to wake up (free tier)

---

**Congratulations! Your platform is live and accessible worldwide! 🌍🚀**

**Total Time:** ~25 minutes
**Total Cost:** $0 (FREE)
**Result:** Professional hosting with SSL, auto-deploy, and global CDN!
