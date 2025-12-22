# Google Cloud Account Migration Guide

## Current Setup Summary

| Resource | Current Value |
|----------|---------------|
| **GCP Project ID** | `crop-analysis-475317` |
| **Cloud Run Service** | `agrishow1` |
| **Cloud Run Region** | `asia-south1` |
| **Cloud Run URL** | `https://agrishow1-752262898671.asia-south1.run.app` |
| **Firestore Database ID** | `agrishow` (NOT default) |
| **Firestore Location** | `asia-south1` |
| **GCS Bucket** | `agrishow-content` |
| **GCS Region** | `ASIA-SOUTH1` |
| **Service Account** | `backend-dev@crop-analysis-475317.iam.gserviceaccount.com` |
| **Artifact Registry** | `asia-south1-docker.pkg.dev/crop-analysis-475317/cloud-run-source-deploy` |

---

## What Needs to Be Migrated

1. **Firestore Database** - Contains all app data (franchises, content, assignments, OTP tokens, audit logs)
2. **Cloud Storage Bucket** - Contains uploaded media files (videos, images)
3. **Cloud Run Service** - Backend API
4. **Service Account** - For local development authentication
5. **Cloud Build Triggers** - For CI/CD (optional, can be reconfigured)

---

## Pre-Migration Checklist

- [ ] Access to current GCP project (`crop-analysis-475317`)
- [ ] New GCP account created and billing enabled
- [ ] gcloud CLI installed ([Download](https://cloud.google.com/sdk/docs/install))
- [ ] Node.js 18+ installed
- [ ] Backup of current data taken

---

# STEP-BY-STEP MIGRATION

## Phase 1: Setup New GCP Project

### Step 1.1: Create New Project (Google Cloud Console)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown (top-left) → **New Project**
3. Enter project details:
   - **Project Name**: `AgriShow` (or your preferred name)
   - **Project ID**: Auto-generated or customize (e.g., `agrishow-2024`)
   - **Organization**: Select if applicable
4. Click **Create**
5. Wait for project creation (30 seconds)
6. **Note down your new Project ID**: `___________________`

### Step 1.2: Enable Required APIs

**Via Google Cloud Console:**

1. Go to [APIs & Services → Library](https://console.cloud.google.com/apis/library)
2. Ensure your new project is selected
3. Search and enable each API:
   - **Cloud Firestore API** → Click → Enable
   - **Cloud Storage API** → Click → Enable  
   - **Cloud Run Admin API** → Click → Enable
   - **Cloud Build API** → Click → Enable
   - **Artifact Registry API** → Click → Enable
   - **Container Registry API** → Click → Enable (legacy, still useful)

**Via gcloud CLI:**

```powershell
# Set your new project
gcloud config set project YOUR_NEW_PROJECT_ID

# Enable all required APIs
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

---

## Phase 2: Create Firestore Database

### Step 2.1: Create Firestore Database (Console Method)

1. Go to [Firestore](https://console.cloud.google.com/firestore)
2. Click **Create Database**
3. Choose **Native mode** (NOT Datastore mode)
4. **Database ID**: Enter `agrishow` (to match current setup)
   - ⚠️ IMPORTANT: Do NOT use `(default)` - use `agrishow` exactly
5. **Location**: Select `asia-south1 (Mumbai)` (same as current)
6. Click **Create Database**
7. Wait 1-2 minutes for creation

**Via gcloud CLI:**

```powershell
gcloud firestore databases create --location=asia-south1 --database=agrishow --type=firestore-native
```

---

## Phase 3: Create Cloud Storage Bucket

### Step 3.1: Create Storage Bucket (Console Method)

1. Go to [Cloud Storage](https://console.cloud.google.com/storage)
2. Click **Create Bucket**
3. Configure bucket:
   - **Name**: `agrishow-content-NEW_PROJECT_ID` (must be globally unique)
     - Example: `agrishow-content-agrishow2024`
   - **Location type**: Region
   - **Location**: `asia-south1 (Mumbai)`
   - **Storage class**: Standard
   - **Access control**: Uniform (recommended)
   - **Public access prevention**: Uncheck "Enforce public access prevention"
4. Click **Create**
5. **Note your bucket name**: `___________________`

**Via gcloud CLI:**

```powershell
# Replace with your unique bucket name
gsutil mb -l asia-south1 gs://agrishow-content-YOUR_PROJECT_ID/
```

### Step 3.2: Make Bucket Publicly Readable (for media files)

**Console Method:**
1. Click on your new bucket
2. Go to **Permissions** tab
3. Click **Grant Access**
4. Add principal: `allUsers`
5. Role: `Storage Object Viewer`
6. Click **Save**
7. Confirm the warning about public access

**Via gcloud CLI:**

```powershell
gsutil iam ch allUsers:objectViewer gs://YOUR_BUCKET_NAME
```

---

## Phase 4: Create Service Account (for Local Development)

### Step 4.1: Create Service Account

**Console Method:**
1. Go to [IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click **Create Service Account**
3. Details:
   - **Name**: `backend-dev`
   - **Description**: `Backend development service account`
4. Click **Create and Continue**
5. Grant roles:
   - `Cloud Datastore User` (for Firestore)
   - `Storage Object Admin` (for GCS)
6. Click **Continue** → **Done**

**Via gcloud CLI:**

```powershell
# Create service account
gcloud iam service-accounts create backend-dev --display-name="Backend Development"

# Grant Firestore access
gcloud projects add-iam-policy-binding YOUR_NEW_PROJECT_ID \
    --member="serviceAccount:backend-dev@YOUR_NEW_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

# Grant Storage access
gcloud projects add-iam-policy-binding YOUR_NEW_PROJECT_ID \
    --member="serviceAccount:backend-dev@YOUR_NEW_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"
```

### Step 4.2: Download Service Account Key

**Console Method:**
1. Click on the `backend-dev` service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Key type: **JSON**
5. Click **Create**
6. Save the downloaded file as `service-account-key.json` in the `backend/` folder
7. ⚠️ **Delete the old key file first!**

**Via gcloud CLI:**

```powershell
gcloud iam service-accounts keys create ./backend/service-account-key.json \
    --iam-account=backend-dev@YOUR_NEW_PROJECT_ID.iam.gserviceaccount.com
```

---

## Phase 5: Export Data from Old Project

### Step 5.1: Export Firestore Data

**Option A: Using Google Cloud Console (Recommended)**

1. Go to old project: [Firestore](https://console.cloud.google.com/firestore?project=crop-analysis-475317)
2. Click **Import/Export** in left menu
3. Click **Export**
4. Destination: Create a temporary bucket or use existing
   - Bucket: `gs://crop-analysis-475317-exports/firestore-backup`
5. Click **Export**
6. Wait for export to complete (check Operations tab)

**Option B: Using gcloud CLI**

```powershell
# Switch to old project
gcloud config set project crop-analysis-475317

# Create export bucket (if needed)
gsutil mb gs://crop-analysis-475317-exports/

# Export Firestore (agrishow database)
gcloud firestore export gs://crop-analysis-475317-exports/firestore-backup --database=agrishow
```

### Step 5.2: Export Storage Bucket Data

```powershell
# Create a local backup folder
mkdir D:\GCS_Backup

# Download all files from old bucket
gsutil -m cp -r gs://agrishow-content/* D:\GCS_Backup\
```

---

## Phase 6: Import Data to New Project

### Step 6.1: Import Firestore Data

**Option A: Cross-project import (if export bucket is accessible)**

```powershell
# Switch to new project
gcloud config set project YOUR_NEW_PROJECT_ID

# Import from old project's export
gcloud firestore import gs://crop-analysis-475317-exports/firestore-backup --database=agrishow
```

**Option B: Copy export to new project first**

```powershell
# Copy export to new project bucket
gsutil -m cp -r gs://crop-analysis-475317-exports/firestore-backup gs://YOUR_NEW_BUCKET/firestore-backup

# Then import
gcloud firestore import gs://YOUR_NEW_BUCKET/firestore-backup --database=agrishow
```

### Step 6.2: Upload Storage Files to New Bucket

```powershell
# Upload all files to new bucket
gsutil -m cp -r D:\GCS_Backup\* gs://YOUR_NEW_BUCKET_NAME/
```

---

## Phase 7: Deploy Backend to New Project

### Step 7.1: Update Backend Configuration

Update `backend/.env` for local development:

```env
PORT=3000
API_KEY=fos-sk-a8f2c9d1e4b7a3f6c8d2e5b9a1c4f7d3
JWT_SECRET=fos-jwt-x7k9m2p5q8r1t4w6y3z0a9b2c5d8e1f4
MAX_FILE_SIZE=524288000
ALLOWED_VIDEO_TYPES=video/mp4,video/quicktime,video/webm
ALLOWED_IMAGE_TYPES=image/jpeg,image/png
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://agrishow1.netlify.app
ADMIN_EMAIL=admin@franchiseos.com
ADMIN_PASSWORD=Admin@123
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
GCS_BUCKET_NAME=YOUR_NEW_BUCKET_NAME
FIRESTORE_DATABASE_ID=agrishow
FIRESTORE_PROJECT_ID=YOUR_NEW_PROJECT_ID

# MSG91 OTP Configuration
MSG91_AUTH_KEY=467227AbYy2xMJZ6M68bba651P1
MSG91_TEMPLATE_ID=693aa9567c693021713d46a8
```

### Step 7.2: Test Locally First

```powershell
cd "D:\TV App\Jyothir Centre app\backend"
npm install
npm start
```

Verify:
- Server starts without errors
- Can connect to new Firestore
- Can access new GCS bucket

### Step 7.3: Deploy to Cloud Run

**Option A: Using gcloud CLI (Recommended)**

```powershell
# Ensure you're in backend directory
cd "D:\TV App\Jyothir Centre app\backend"

# Set new project
gcloud config set project YOUR_NEW_PROJECT_ID

# Deploy to Cloud Run
gcloud run deploy agrishow1 \
    --source . \
    --region asia-south1 \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "NODE_ENV=production" \
    --set-env-vars "API_KEY=fos-sk-a8f2c9d1e4b7a3f6c8d2e5b9a1c4f7d3" \
    --set-env-vars "JWT_SECRET=fos-jwt-x7k9m2p5q8r1t4w6y3z0a9b2c5d8e1f4" \
    --set-env-vars "GCS_BUCKET_NAME=YOUR_NEW_BUCKET_NAME" \
    --set-env-vars "FIRESTORE_DATABASE_ID=agrishow" \
    --set-env-vars "ADMIN_EMAIL=admin@franchiseos.com" \
    --set-env-vars "ADMIN_PASSWORD=Admin@123" \
    --set-env-vars "ALLOWED_ORIGINS=https://agrishow1.netlify.app" \
    --set-env-vars "MSG91_AUTH_KEY=467227AbYy2xMJZ6M68bba651P1" \
    --set-env-vars "MSG91_TEMPLATE_ID=693aa9567c693021713d46a8"
```

**Note the new Cloud Run URL**: `___________________`

### Step 7.4: Grant Cloud Run Service Account Permissions

After deployment, grant the Cloud Run service account access to Firestore and GCS:

```powershell
# Get the Cloud Run service account (usually PROJECT_NUMBER-compute@developer.gserviceaccount.com)
# You can find this in Cloud Run → Your Service → Security tab

# Grant Firestore access
gcloud projects add-iam-policy-binding YOUR_NEW_PROJECT_ID \
    --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/datastore.user"

# Grant Storage access  
gcloud projects add-iam-policy-binding YOUR_NEW_PROJECT_ID \
    --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"
```

**Via Console:**
1. Go to [IAM](https://console.cloud.google.com/iam-admin/iam)
2. Find the compute service account (ends with `-compute@developer.gserviceaccount.com`)
3. Click Edit (pencil icon)
4. Add roles:
   - `Cloud Datastore User`
   - `Storage Object Admin`
5. Save

---

## Phase 8: Update Frontend Configuration

### Step 8.1: Update Admin Dashboard

Update `admin-dashboard/.env.production`:

```env
VITE_API_URL=https://YOUR_NEW_CLOUD_RUN_URL/api
VITE_API_KEY=
VITE_ENVIRONMENT=production
```

### Step 8.2: Update Netlify Environment Variables

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site (`agrishow1`)
3. Go to **Site configuration** → **Environment variables**
4. Update `VITE_API_URL` to your new Cloud Run URL
5. Trigger a new deploy

---

## Phase 9: Update Android Client

### Step 9.1: Update Existing Devices

The Android app stores the API URL in SharedPreferences. For existing devices:

**Option A: Re-register devices**
- Uninstall and reinstall the app
- Re-enter the new server URL during setup

**Option B: Keep old backend running temporarily**
- Keep old Cloud Run service running
- Gradually migrate devices to new URL

### Step 9.2: For New APK Builds

If you have a default server URL hardcoded, update it before building new APKs.

---

## Phase 10: Verification Checklist

### Backend Verification

```powershell
# Test health endpoint
curl https://YOUR_NEW_CLOUD_RUN_URL/health

# Test auth (should return JWT)
curl -X POST https://YOUR_NEW_CLOUD_RUN_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@franchiseos.com","password":"Admin@123"}'
```

### Console Verification

1. **Firestore**: Check [Firestore Console](https://console.cloud.google.com/firestore) - data should be visible
2. **Cloud Storage**: Check [Storage Console](https://console.cloud.google.com/storage) - media files should be accessible
3. **Cloud Run**: Check [Cloud Run Console](https://console.cloud.google.com/run) - service should be healthy

### Frontend Verification

1. Open admin dashboard
2. Login with admin credentials
3. Verify franchises list loads
4. Verify content library loads with thumbnails
5. Try uploading a new file

---

## Phase 11: Cleanup Old Project (After Everything Works)

⚠️ **Only do this after confirming everything works in the new project!**

### Step 11.1: Keep Old Project Running (Recommended)

Keep the old project running for 1-2 weeks while monitoring for any issues.

### Step 11.2: Delete Old Resources (When Ready)

```powershell
# Switch to old project
gcloud config set project crop-analysis-475317

# Delete Cloud Run service
gcloud run services delete agrishow1 --region=asia-south1

# Delete storage bucket (after confirming backup)
gsutil rm -r gs://agrishow-content

# Delete Firestore data (be very careful!)
# This cannot be undone - make sure you have a backup
```

---

## Quick Reference: Environment Variables

### Cloud Run Environment Variables (New Project)

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `API_KEY` | `fos-sk-a8f2c9d1e4b7a3f6c8d2e5b9a1c4f7d3` |
| `JWT_SECRET` | `fos-jwt-x7k9m2p5q8r1t4w6y3z0a9b2c5d8e1f4` |
| `GCS_BUCKET_NAME` | `YOUR_NEW_BUCKET_NAME` |
| `FIRESTORE_DATABASE_ID` | `agrishow` |
| `ADMIN_EMAIL` | `admin@franchiseos.com` |
| `ADMIN_PASSWORD` | `Admin@123` |
| `ALLOWED_ORIGINS` | `https://agrishow1.netlify.app` |
| `MSG91_AUTH_KEY` | `467227AbYy2xMJZ6M68bba651P1` |
| `MSG91_TEMPLATE_ID` | `693aa9567c693021713d46a8` |

---

## Troubleshooting

### Issue: Firestore "NOT_FOUND" Error

**Cause**: Wrong project ID or database ID being used.

**Fix**: Ensure `FIRESTORE_DATABASE_ID=agrishow` is set, and the Cloud Run service account has Firestore access.

### Issue: Storage Upload Fails

**Cause**: GCS bucket name wrong or permissions missing.

**Fix**: 
1. Verify `GCS_BUCKET_NAME` environment variable
2. Ensure bucket exists
3. Ensure service account has `Storage Object Admin` role

### Issue: CORS Errors

**Cause**: Frontend URL not in `ALLOWED_ORIGINS`.

**Fix**: Add your Netlify URL to `ALLOWED_ORIGINS` environment variable in Cloud Run.

### Issue: Old Media URLs Don't Work

**Cause**: Media URLs point to old bucket.

**Fix**: 
1. Either update content URLs in Firestore database
2. Or keep old bucket accessible (with allUsers read access)

---

## Summary

After migration, your new setup will be:

| Resource | New Value |
|----------|-----------|
| **GCP Project ID** | `YOUR_NEW_PROJECT_ID` |
| **Cloud Run Service** | `agrishow1` |
| **Cloud Run URL** | `https://agrishow1-XXX.asia-south1.run.app` |
| **Firestore Database** | `agrishow` in `asia-south1` |
| **GCS Bucket** | `YOUR_NEW_BUCKET_NAME` |
| **Service Account** | `backend-dev@YOUR_NEW_PROJECT_ID.iam.gserviceaccount.com` |

---

*Migration guide created for AgriShow project. Always test thoroughly before decommissioning the old project.*
