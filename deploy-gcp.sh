#!/bin/bash

# GCP Deployment Script for Expense Tracker Backend
# This script deploys the backend to Google Cloud Run (Free Tier)

set -e

echo "🚀 Deploying Expense Tracker Backend to GCP Cloud Run"
echo "======================================================"

# Configuration
PROJECT_ID="project-7fc25035-741b-457e-bad"  # Replace with your GCP project ID
SERVICE_NAME="expense-tracker-backend"
REGION="us-central1"  # Free tier eligible region
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if logged in
echo "📋 Checking GCP authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "🔐 Please login to GCP..."
    gcloud auth login
fi

# Set project
echo "📦 Setting GCP project to: ${PROJECT_ID}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "🔧 Enabling required GCP APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and push Docker image
echo "🐳 Building Docker image..."
gcloud builds submit --tag ${IMAGE_NAME}

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "JWT_SECRET=${JWT_SECRET:-your-jwt-secret-here}" \
  --set-env-vars "MONGODB_URI=${MONGODB_URI}" \
  --set-env-vars "RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}" \
  --set-env-vars "RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}" \
  --set-env-vars "FRONTEND_URL=${FRONTEND_URL:-https://your-frontend-url.com}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')

echo ""
echo "✅ Deployment successful!"
echo "======================================================"
echo "🌐 Service URL: ${SERVICE_URL}"
echo "📊 Dashboard: https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}"
echo ""
echo "💡 Free Tier Limits:"
echo "   - 2 million requests/month"
echo "   - 360,000 GB-seconds/month"
echo "   - 180,000 vCPU-seconds/month"
echo ""
echo "🔧 Update your frontend .env with:"
echo "   VITE_API_URL=${SERVICE_URL}/api"
echo ""
