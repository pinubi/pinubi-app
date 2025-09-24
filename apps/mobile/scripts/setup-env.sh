#!/bin/bash

# EAS Environment Variables Setup Script (Fixed)
# This script uploads your .env variables to EAS securely

echo "🔐 Setting up EAS Environment Variables..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ No .env file found. Please create one based on .env.example"
    exit 1
fi

echo "📋 Found the following environment variables to upload:"
cat .env | grep "^EXPO_PUBLIC" | cut -d= -f1
echo ""

# Read confirmation
read -p "Do you want to upload these to EAS? (y/N): " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🚀 Uploading environment variables to EAS..."

# Function to upload a variable
upload_var() {
    local env_name=$1
    local var_line=$(grep "^$env_name=" .env)
    if [ -n "$var_line" ]; then
        local var_value=$(echo "$var_line" | cut -d= -f2-)
        if [ -n "$var_value" ] && [ "$var_value" != "your_"* ]; then
            echo "📦 Uploading $env_name to development environment..."
            eas env:create development --name "$env_name" --value "$var_value" --visibility plaintext --non-interactive
            
            echo "📦 Uploading $env_name to production environment..."
            eas env:create production --name "$env_name" --value "$var_value" --visibility plaintext --non-interactive
            
            echo "✅ $env_name uploaded successfully"
        else
            echo "⚠️ Skipping $env_name (empty or placeholder value)"
        fi
    fi
}

# Upload each variable
upload_var "EXPO_PUBLIC_FIREBASE_API_KEY"
upload_var "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"
upload_var "EXPO_PUBLIC_FIREBASE_PROJECT_ID"
upload_var "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"
upload_var "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
upload_var "EXPO_PUBLIC_FIREBASE_APP_ID"
upload_var "EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID"
upload_var "EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS"
upload_var "EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID"
upload_var "EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB"

echo ""
echo "✅ Environment variables uploaded successfully!"
echo ""
echo "🔍 You can view them at:"
echo "   https://expo.dev/accounts/awmoreira/projects/pinubi-app/environment-variables"
echo ""
echo "🛡️ Security Note: These variables are stored securely on EAS servers"
echo "   and are only accessible during builds."
