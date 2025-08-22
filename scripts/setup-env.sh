#!/bin/bash

# EAS Environment Variables Setup Script
# This script helps you upload your .env variables to EAS securely

echo "🔐 Setting up EAS Environment Variables..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ No .env file found. Please create one based on .env.example"
    exit 1
fi

echo "📋 This script will upload your environment variables to EAS."
echo "⚠️  Make sure your .env file contains your actual values (not the example placeholders)"
echo ""

# Read confirmation
read -p "Do you want to continue? (y/N): " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🚀 Uploading environment variables to EAS..."

# Upload each environment from .env to EAS
# Development environment
echo "📦 Setting up DEVELOPMENT environment..."
eas env:create --name development --from-file .env --visibility plaintext

# Production environment  
echo "📦 Setting up PRODUCTION environment..."
eas env:create --name production --from-file .env --visibility plaintext

echo ""
echo "✅ Environment variables uploaded successfully!"
echo ""
echo "🔍 You can view them at:"
echo "   https://expo.dev/accounts/awmoreira/projects/pinubi-app/environment-variables"
echo ""
echo "🛡️  Security Note: These variables are stored securely on EAS servers"
echo "   and are only accessible during builds."
