# 📋 EAS Deployment - Quick Reference Guide

## 🚀 Daily Development Workflow

### **Development Builds** (Automatic)
```bash
# Push to develop branch → triggers automatic development build
git checkout develop
git add .
git commit -m "feat: new feature"
git push origin develop
```
**Result**: Development build automatically created and available for device testing

### **QA/Testing Builds** (Automatic)
```bash
# Create PR from develop to master → triggers preview build
git checkout develop
# Make changes, commit, push
gh pr create --base master --head develop --title "Release candidate"
```
**Result**: Preview build automatically created for QA testing

### **Production Release** (One Command)
```bash
# Run release script from master branch
git checkout master
git merge develop
./scripts/release.sh
```
**Result**: Version bumped, tagged, and automatically submitted to App Store

---

## 🛠️ Manual Commands (When Needed)

### **Build Commands**
```bash
# Development build
eas build --profile development --platform ios

# Preview build  
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform ios

# TestFlight build
eas build --profile testflight --platform ios
```

### **Submit Commands**
```bash
# Submit to App Store (after production build)
eas submit --platform ios --latest

# Submit specific build
eas submit --platform ios --id BUILD_ID
```

### **Environment Management**
```bash
# List environment variables
eas env:list --environment production
eas env:list --environment development

# Update environment variables
./scripts/setup-env-fixed.sh
```

### **Monitoring Commands**
```bash
# Check recent builds
eas build:list --limit 5

# Check workflows
open https://expo.dev/accounts/awmoreira/projects/pinubi-app/workflows

# Check App Store Connect
open https://appstoreconnect.apple.com
```

---

## 🎯 Quick Troubleshooting

### **Build Failed?**
1. Check build logs: https://expo.dev/accounts/awmoreira/projects/pinubi-app/builds
2. Verify environment variables: `eas env:list --environment production`
3. Check eas.json syntax: `eas config`

### **Workflow Not Triggering?**
1. Verify GitHub connection: https://expo.dev/accounts/awmoreira/projects/pinubi-app/github
2. Check branch names in workflow files
3. Ensure you're pushing to correct branch

### **App Store Submission Failed?**
1. Check App Store Connect for specific error
2. Verify ascAppId in eas.json: `"6751398431"`
3. Ensure Apple Developer account is active

---

## 📱 Build Profiles Quick Reference

| Profile | Purpose | Distribution | Environment | Trigger |
|---------|---------|--------------|-------------|---------|
| `development` | Daily development | Internal | Development | Push to `develop` |
| `preview` | QA testing | Internal | Production | PR to `master` |
| `production` | App Store release | Store | Production | Push to `master` |
| `testflight` | TestFlight testing | Store | Production | Manual |

---

## 🔗 Important URLs

- **EAS Dashboard**: https://expo.dev/accounts/awmoreira/projects/pinubi-app
- **Workflows**: https://expo.dev/accounts/awmoreira/projects/pinubi-app/workflows  
- **Builds**: https://expo.dev/accounts/awmoreira/projects/pinubi-app/builds
- **Environment Variables**: https://expo.dev/accounts/awmoreira/projects/pinubi-app/environment-variables
- **App Store Connect**: https://appstoreconnect.apple.com
- **GitHub Repository**: https://github.com/pinubi/pinubi-app

---

## 🆘 Emergency Procedures

### **Rollback Release**
```bash
# If you need to rollback a release
git checkout master
git revert HEAD~1  # Revert last commit
git push origin master
./scripts/release.sh  # Create new patch release
```

### **Hotfix Process**
```bash
# Create hotfix from master
git checkout master
git checkout -b hotfix/critical-fix
# Make fix, commit
git checkout master
git merge hotfix/critical-fix
./scripts/release.sh  # Choose patch release
```

### **Emergency Build**
```bash
# Manual emergency build and submit
eas build --profile production --platform ios --non-interactive
# Wait for build to complete, then:
eas submit --platform ios --latest
```

---

*Quick Reference for Pinubi App EAS Deployment*  
*Last Updated: August 22, 2025*
