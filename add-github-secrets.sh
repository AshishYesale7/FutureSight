#!/bin/bash

# Script to add GitHub repository secrets for Firebase configuration
# Run this script with your GitHub token

REPO_OWNER="hstreamapp"
REPO_NAME="FutureSight"

# Check if GitHub token is provided
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is required"
    echo "Usage: GITHUB_TOKEN=your_token ./add-github-secrets.sh"
    exit 1
fi

# Function to add a secret
add_secret() {
    local secret_name=$1
    local secret_value=$2
    
    echo "Adding secret: $secret_name"
    
    # Get the repository's public key
    public_key_response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/secrets/public-key")
    
    if [ $? -ne 0 ]; then
        echo "Failed to get public key for $secret_name"
        return 1
    fi
    
    # For simplicity, we'll use the GitHub CLI if available, or manual instructions
    echo "Please add this secret manually in GitHub:"
    echo "Name: $secret_name"
    echo "Value: $secret_value"
    echo "---"
}

echo "Adding Firebase secrets to GitHub repository..."
echo "Repository: $REPO_OWNER/$REPO_NAME"
echo ""

# Add all Firebase secrets
add_secret "GEMINI_API_KEY" "AIzaSyAwOQ87SugwqstTEpOoDF44oMXvG82FpsY"
add_secret "NEXT_PUBLIC_FIREBASE_API_KEY" "AIzaSyArau7AmleRNnzWE080F3QF8YGmMWtn_Kg"
add_secret "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "futuresight-cz4hh.firebaseapp.com"
add_secret "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "futuresight-cz4hh"
add_secret "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "futuresight-cz4hh.firebasestorage.app"
add_secret "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "748902423337"
add_secret "NEXT_PUBLIC_FIREBASE_APP_ID" "1:748902423337:web:bd3e769c9190d1c1c9f538"

echo ""
echo "🔗 Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions"
echo "📝 Add each secret listed above manually"
echo "🚀 After adding secrets, trigger a new deployment to enable Firebase authentication"