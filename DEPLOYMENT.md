# GCP Cloud Run Deployment Guide

## Prerequisites

1. **Google Cloud Account** (Free tier available)
   - Sign up at: https://cloud.google.com/free
   - $300 free credits for 90 days
   - Always-free tier includes Cloud Run

2. **Install gcloud CLI**
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

3. **MongoDB Atlas** (Already configured)
   - Your existing MongoDB connection string will work

## Quick Deployment (5 minutes)

### Step 1: Setup GCP Project

```bash
# Login to GCP
gcloud auth login

# Create a new project (or use existing)
gcloud projects create expense-tracker-prod --name="Expense Tracker"

# Set as active project
gcloud config set project expense-tracker-prod

# Enable billing (required, but free tier is generous)
# Visit: https://console.cloud.google.com/billing
```

### Step 2: Set Environment Variables

```bash
# Export your environment variables
export MONGODB_URI="mongodb+srv://a41968190_db_user:1OHkz526BECgnu3G@splitwise.4amvmib.mongodb.net/"
export JWT_SECRET="your_jwt_secret_key_here_change_in_production"
export RAZORPAY_KEY_ID="your-razorpay-key"
export RAZORPAY_KEY_SECRET="your-razorpay-secret"
export FRONTEND_URL="https://your-frontend-url.com"
```

### Step 3: Deploy

```bash
cd backend

# Edit deploy-gcp.sh and replace PROJECT_ID
# Then run:
./deploy-gcp.sh
```

That's it! Your backend will be deployed in ~3-5 minutes.

## Manual Deployment Steps

If you prefer manual control:

```bash
# 1. Set project
gcloud config set project YOUR_PROJECT_ID

# 2. Enable APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# 3. Build image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/expense-tracker-backend

# 4. Deploy to Cloud Run
gcloud run deploy expense-tracker-backend \
  --image gcr.io/YOUR_PROJECT_ID/expense-tracker-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars "NODE_ENV=production,MONGODB_URI=your-uri,JWT_SECRET=your-secret"
```

## Free Tier Limits

Cloud Run free tier (per month):
- ✅ 2 million requests
- ✅ 360,000 GB-seconds of memory
- ✅ 180,000 vCPU-seconds
- ✅ 1 GB network egress from North America

**This is MORE than enough for development and small production apps!**

## Cost Estimation

For a typical usage:
- 100,000 requests/month
- Average 200ms response time
- 512MB memory

**Cost: $0.00** (within free tier)

## Update Frontend

After deployment, update your frontend `.env`:

```env
VITE_API_URL=https://expense-tracker-backend-xxxxx-uc.a.run.app/api
```

## Monitoring

View logs and metrics:
```bash
# View logs
gcloud run services logs read expense-tracker-backend --region us-central1

# Or visit Cloud Console:
# https://console.cloud.google.com/run
```

## Troubleshooting

### Port Issues
Cloud Run automatically sets `PORT` environment variable. The code has been updated to use `process.env.PORT || 5007`.

### CORS Issues
Make sure to update `FRONTEND_URL` environment variable with your actual frontend URL.

### MongoDB Connection
Ensure your MongoDB Atlas allows connections from all IPs (0.0.0.0/0) or add Cloud Run's IP ranges.

## Continuous Deployment

For automatic deployments on git push, set up Cloud Build triggers:

```bash
# Connect your GitHub repo
gcloud alpha builds triggers create github \
  --repo-name=MERN_INTERVIEW \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

## Next Steps

1. Deploy backend using `./deploy-gcp.sh`
2. Get the service URL from output
3. Update frontend `.env` with the URL
4. Deploy frontend to Vercel/Netlify (also free)
5. Test the complete application

## Support

- GCP Documentation: https://cloud.google.com/run/docs
- Free Tier Details: https://cloud.google.com/free
- Pricing Calculator: https://cloud.google.com/products/calculator
