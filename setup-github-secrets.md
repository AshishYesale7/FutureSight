# Setting up GitHub Repository Secrets

To enable Firebase authentication on the deployed GitHub Pages site, you need to add the following secrets to your GitHub repository:

## How to Add Secrets:

1. Go to your GitHub repository: https://github.com/hstreamapp/FutureSight
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** for each of the following:

## Required Secrets:

| Secret Name | Value |
|-------------|-------|
| `GEMINI_API_KEY` | `AIzaSyAwOQ87SugwqstTEpOoDF44oMXvG82FpsY` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyArau7AmleRNnzWE080F3QF8YGmMWtn_Kg` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `futuresight-cz4hh.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `futuresight-cz4hh` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `futuresight-cz4hh.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `748902423337` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:748902423337:web:bd3e769c9190d1c1c9f538` |

## After Adding Secrets:

1. The GitHub Actions workflow will automatically use these secrets during deployment
2. The next deployment will include proper Firebase configuration
3. Users will be able to create real accounts and sign in with Firebase authentication
4. No more demo mode - full Firebase functionality will be available

## Current Status:

- ✅ Workflow updated to use secrets
- ✅ Firebase configuration improved with proper validation
- ✅ Demo mode fallback when Firebase not configured
- ⏳ **Next step**: Add the secrets above to enable full Firebase authentication

Once you add these secrets, trigger a new deployment by pushing any change to the master branch, or use the "Actions" tab to manually trigger the "Deploy to GitHub Pages" workflow.