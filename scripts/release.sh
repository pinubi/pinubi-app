#!/bin/bash

# Release Management Script for Pinubi App
# This script helps you create and deploy new versions

echo "🚀 Pinubi App Release Manager"
echo "============================="
echo ""

# Check if we're on the right branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "⚠️  Warning: You're on branch '$current_branch', not 'main'"
    read -p "Continue anyway? (y/N): " continue_anyway
    if [[ $continue_anyway != [yY] && $continue_anyway != [yY][eE][sS] ]]; then
        echo "Cancelled. Switch to main branch first: git checkout main"
        exit 1
    fi
fi

# Get current version
current_version=$(grep '"version"' package.json | cut -d'"' -f4)
echo "📋 Current version: $current_version"
echo ""

echo "🎯 Release options:"
echo "1. Patch release (1.0.0 → 1.0.1) - Bug fixes"
echo "2. Minor release (1.0.0 → 1.1.0) - New features"
echo "3. Major release (1.0.0 → 2.0.0) - Breaking changes"
echo "4. Custom version"
echo ""

read -p "Select release type (1-4): " release_type

case $release_type in
    1)
        new_version=$(echo $current_version | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g')
        ;;
    2)
        new_version=$(echo $current_version | awk -F. '{$(NF-1) = $(NF-1) + 1; $NF = 0} 1' | sed 's/ /./g')
        ;;
    3)
        new_version=$(echo $current_version | awk -F. '{$1 = $1 + 1; $2 = 0; $3 = 0} 1' | sed 's/ /./g')
        ;;
    4)
        read -p "Enter custom version: " new_version
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🔄 Release Summary:"
echo "   Current version: $current_version"
echo "   New version: $new_version"
echo ""

read -p "Proceed with this release? (y/N): " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🚀 Creating release $new_version..."

# Update package.json version
echo "📝 Updating package.json..."
sed -i '' "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/" package.json

# Update app.json version
echo "📝 Updating app.json..."
sed -i '' "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/" app.json

# Commit version changes
echo "💾 Committing version changes..."
git add package.json app.json
git commit -m "🔖 Bump version to $new_version"

# Create and push tag
echo "🏷️  Creating release tag..."
git tag -a "v$new_version" -m "Release version $new_version"
git push origin main
git push origin "v$new_version"

echo ""
echo "✅ Release $new_version created successfully!"
echo ""
echo "🔍 Next steps:"
echo "   1. Monitor the workflow: https://expo.dev/accounts/awmoreira/projects/pinubi-app/workflows"
echo "   2. The app will be built and submitted to App Store automatically"
echo "   3. Check App Store Connect for submission status"
echo ""
echo "📱 Build will be available at:"
echo "   https://expo.dev/accounts/awmoreira/projects/pinubi-app/builds"
