# Deployment Guide for Kurdish Language Learning Ecosystem

This guide covers how to deploy all the projects in the **Ferhengî Jîr** ecosystem to various hosting platforms. Each project is a standalone React application that can be deployed independently.

## 📁 Project Overview

Your ecosystem now includes:

1. **Ferhengî Jîr** (Main Dictionary) - `./` 
2. **Thematic Phrasebook** - `./thematic-phrasebook/`
3. **Proverbs Visualizer** - `./proverbs-visualizer/`
4. **Grammar Map** - `./grammar-map/`
5. **Dialect Explorer** - `./dialect-explorer/`
6. **Learning Path Generator** - `./learning-path-generator/`
7. **Conversation Simulator** - `./conversation-simulator/`

## 🔑 Prerequisites

Before deploying any project, you'll need:

- **Firebase Project** with Firestore enabled
- **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Node.js** (version 16 or higher)
- **Git** repository access

## 📋 General Deployment Steps

### Step 1: Environment Configuration

For each project, create a `.env` file in the project root with your API keys:

```bash
# Example for any project
cd thematic-phrasebook  # or any other project folder
cp .env.example .env    # if available, or create manually
```

Add your configuration to `.env`:
```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

> ⚠️ **Do not put the Gemini key in `.env` as `REACT_APP_GEMINI_API_KEY`.**
> Every `REACT_APP_*` variable is compiled into the public JS bundle and will
> leak. For Ferhengî Jîr the key is a server-side Firebase secret
> (`firebase functions:secrets:set GEMINI_API_KEY`); see [`SECURITY.md`](./SECURITY.md).
> The same pattern should be applied to the sibling projects.

### Step 2: Install Dependencies and Build

For each project:
```bash
cd project-folder
npm install
npm run build
```

---

## 🚀 Deployment Options

## Option 1: Firebase Hosting (Recommended)

Firebase Hosting is ideal since you're already using Firebase for backend services.

### Deploy All Projects to Firebase

1. **Install Firebase CLI** (if not already installed):
```bash
npm install -g firebase-tools
firebase login
```

2. **Deploy Each Project**:

```bash
# Deploy Ferhengî Jîr (Main Dictionary)
cd /path/to/FerhengiJir
npm run build
firebase deploy

# Deploy Thematic Phrasebook
cd thematic-phrasebook
npm install && npm run build
firebase init hosting  # Select the build folder
firebase deploy

# Deploy Proverbs Visualizer
cd ../proverbs-visualizer
npm install && npm run build
firebase init hosting
firebase deploy

# Deploy Grammar Map
cd ../grammar-map
npm install && npm run build
firebase init hosting
firebase deploy

# Deploy Dialect Explorer  
cd ../dialect-explorer
npm install && npm run build
firebase init hosting
firebase deploy

# Deploy Learning Path Generator
cd ../learning-path-generator
npm install && npm run build
firebase init hosting
firebase deploy

# Deploy Conversation Simulator
cd ../conversation-simulator
npm install && npm run build
firebase init hosting
firebase deploy
```

### Suggested Domain Structure

If you have multiple Firebase projects or want to organize by subdomain:

- `ferhengijir.com` - Main Dictionary
- `phrasebook.ferhengijir.com` - Thematic Phrasebook
- `proverbs.ferhengijir.com` - Proverbs Visualizer
- `grammar.ferhengijir.com` - Grammar Map
- `dialects.ferhengijir.com` - Dialect Explorer
- `learn.ferhengijir.com` - Learning Path Generator
- `chat.ferhengijir.com` - Conversation Simulator

---

## Option 2: Netlify

Netlify offers easy deployment with GitHub integration.

### Deploy via Drag & Drop

1. Build each project:
```bash
cd project-folder
npm install && npm run build
```

2. Go to [netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `build` folder to deploy
4. Configure environment variables in Netlify dashboard

### Deploy via Git Integration

1. Push all projects to GitHub
2. Connect Netlify to your GitHub repository
3. For each project, create a new Netlify site:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Base directory**: `project-folder-name`

### Environment Variables in Netlify

For each site, go to Site Settings → Environment Variables and add:
```
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_GEMINI_API_KEY=your_gemini_key
```

---

## Option 3: Vercel

Vercel offers excellent performance and easy deployment.

### Deploy via Vercel CLI

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Deploy each project**:
```bash
cd project-folder
npm install && npm run build
vercel --prod
```

### Deploy via Git Integration

1. Connect Vercel to your GitHub repository
2. For each project, create a new Vercel project:
   - **Framework Preset**: Create React App
   - **Root Directory**: Select the project folder
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Environment Variables in Vercel

Add environment variables in the Vercel dashboard for each project.

---

## Option 4: GitHub Pages

For static hosting without server-side features.

### Deploy via GitHub Actions

Create `.github/workflows/deploy-[project-name].yml` for each project:

```yaml
name: Deploy Thematic Phrasebook
on:
  push:
    branches: [ main ]
    paths: [ 'thematic-phrasebook/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install and Build
      working-directory: ./thematic-phrasebook
      run: |
        npm install
        npm run build
      env:
        REACT_APP_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
        REACT_APP_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
        REACT_APP_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
        REACT_APP_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
        REACT_APP_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
        REACT_APP_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./thematic-phrasebook/build
```

---

## 🔧 Advanced Configuration

### Custom Domains

For each hosting platform:

**Firebase Hosting:**
```bash
firebase hosting:sites:domain:add project-id yourdomain.com
```

**Netlify:**
- Go to Site Settings → Domain Management
- Add custom domain

**Vercel:**
- Go to Project Settings → Domains
- Add custom domain

### Environment-Specific Builds

Create different builds for development/staging/production:

```bash
# Development build
REACT_APP_ENV=development npm run build

# Production build  
REACT_APP_ENV=production npm run build
```

### Automated Deployment Script

Create `deploy-all.sh` for batch deployment:

```bash
#!/bin/bash
projects=("thematic-phrasebook" "proverbs-visualizer" "grammar-map" "dialect-explorer" "learning-path-generator" "conversation-simulator")

for project in "${projects[@]}"; do
    echo "Deploying $project..."
    cd $project
    npm install
    npm run build
    # Add your deployment command here (firebase deploy, vercel --prod, etc.)
    cd ..
done
```

### Monitoring and Analytics

Add Google Analytics to each project by adding to `public/index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 🔒 Security Considerations

### API Key Security

1. **Never commit `.env` files** to Git
2. **Use environment variables** in production
3. **Implement rate limiting** for Gemini API calls
4. **Set up Firebase security rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### CORS Configuration

Ensure your domain is allowed in Firebase and Gemini API settings.

---

## 📊 Performance Optimization

### Build Optimization

Add to `package.json` for better builds:
```json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

### CDN Configuration

Most hosting platforms provide CDN automatically. For custom setups:
- Enable gzip compression
- Set cache headers for static assets
- Use lazy loading for images

---

## 🔄 CI/CD Pipeline

### Example GitHub Actions Workflow

```yaml
name: Deploy All Projects
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        project: [thematic-phrasebook, proverbs-visualizer, grammar-map, dialect-explorer, learning-path-generator, conversation-simulator]
    
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install and Build
      working-directory: ./${{ matrix.project }}
      run: |
        npm install
        npm run build
      env:
        REACT_APP_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
        REACT_APP_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        # Add other environment variables
        
    - name: Deploy
      run: |
        # Add your deployment commands here
        echo "Deploying ${{ matrix.project }}"
```

---

## 📈 Maintenance & Updates

### Regular Updates

1. **Keep dependencies updated**:
```bash
npm update
npm audit fix
```

2. **Monitor API usage** for Gemini and Firebase
3. **Update environment variables** as needed
4. **Test deployments** in staging environment first

### Backup Strategy

- Regular Firebase backups
- Git repository backups
- Environment variable documentation

---

## 🎯 Quick Start Summary

For the fastest deployment:

1. **Choose Firebase Hosting** (easiest integration)
2. **Configure environment variables** for one project
3. **Deploy and test** that project
4. **Copy configuration** to other projects
5. **Automate** with deployment scripts

Your Kurdish language learning ecosystem will be live and ready for users! 🚀

---

## 📞 Support

If you encounter issues:
- Check the browser console for errors
- Verify environment variables are set correctly
- Ensure Firebase and Gemini API keys have proper permissions
- Review hosting platform documentation

**Happy deploying!** 🎉 