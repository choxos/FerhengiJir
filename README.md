# Ferhengî Jîr - فەرهەنگی ژیر

A smart Kurdish-English dictionary powered by Google Gemini AI. This application provides comprehensive translations, detailed word analysis, and multilingual support for Kurdish language learners.

## Features

- **Bidirectional Translation**: Kurdish ⟷ English translation support
- **AI-Powered Analysis**: Comprehensive word analysis using Google Gemini 2.0 Flash
- **Multiple Meanings**: Detailed explanations with part of speech information
- **Example Sentences**: Contextual examples for better understanding  
- **Synonyms & Antonyms**: Related words for vocabulary building
- **Informal Usage**: Dialectal and informal expressions
- **Multi-language Support**: Translations to Arabic, Persian, Turkish, French, and German
- **Favorites & History**: Save favorite words and track search history
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Automatic dark/light theme switching
- **Customizable UI**: Multiple themes and font options
- **Offline Storage**: Firebase integration for data persistence

## Prerequisites

Before setting up the project, you'll need:

1. **Node.js** (version 16 or higher)
2. **npm** or **yarn** package manager
3. **Firebase Project** with Firestore enabled
4. **Google Gemini API Key** from Google AI Studio

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install

# Or using yarn
yarn install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Firestore Database** (then deploy the included `firestore.rules`; do
   not leave it in open test mode)
4. Go to Project Settings → General → Your apps
5. Add a web app and copy the configuration values

### 3. Google Gemini API Setup (server-side only)

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key for Gemini
3. Store it as a **Firebase secret**, never as a `REACT_APP_*` variable:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```

> The key is used only by the Cloud Function in `functions/`. It must never reach
> the browser. See [`SECURITY.md`](./SECURITY.md) for the full architecture.

### 4. Environment Configuration

1. Copy `env.example` to `.env` in the root directory:
   ```bash
   cp env.example .env
   ```

2. Fill in your configuration values in `.env`:
   ```env
   # Firebase Configuration
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

   Do **not** add the Gemini key here. `REACT_APP_*` variables are baked into the
   public JS bundle. The Gemini key is a server-side Firebase secret (see step 3).

### 5. Firebase Security Rules

The rules live in [`firestore.rules`](./firestore.rules) and are deployed with the
app (`firebase deploy --only firestore:rules`). They scope each authenticated user
to their own `favorites`/`history` and deny everything else:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/{collection}/{docId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId
                         && collection in ['favorites', 'history'];
    }
    match /{document=**} { allow read, write: if false; }
  }
}
```

## Development

### Running the Development Server

```bash
npm start
# Or
yarn start
```

The application will open at `http://localhost:3000`

### Building for Production

```bash
npm run build
# Or
yarn build
```

This creates a `build` folder with optimized production files.

## Deployment Options

### 1. Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Install the Cloud Function dependencies (first time only)
cd functions && npm install && cd ..

# Build and deploy hosting + the Gemini proxy function + Firestore rules
npm run build
firebase deploy --only hosting,functions,firestore:rules
```

### 2. Netlify

1. Build the project: `npm run build`
2. Drag the `build` folder to [Netlify Deploy](https://app.netlify.com/drop)
3. Or connect your GitHub repository to Netlify for automatic deployments

### 3. Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Or deploy the build folder
npm run build
vercel --prod ./build
```

### 4. Traditional Web Hosting

1. Build the project: `npm run build`
2. Upload the contents of the `build` folder to your web server
3. Configure your web server to serve `index.html` for all routes (SPA routing)

## Environment Variables for Production

For production deployments, make sure to set these environment variables in your hosting platform:

- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

The Gemini key is **not** an environment variable here; it is a server-side
Firebase secret (`firebase functions:secrets:set GEMINI_API_KEY`). See
[`SECURITY.md`](./SECURITY.md).

## Usage

### Basic Search
1. Enter a word in Kurdish or English in the search box
2. Click "Search" or press Enter
3. View comprehensive translation results

### Features
- **Word of the Day**: Discover new vocabulary daily
- **Random Words**: Explore random English or Kurdish words
- **Favorites**: Star words to save them for later
- **History**: View your recent searches
- **Settings**: Customize themes, fonts, and display options

## API Usage and Costs

### Google Gemini API
- The app uses Google Gemini 2.0 Flash model
- Check [Google AI pricing](https://ai.google.dev/pricing) for current rates
- Consider implementing rate limiting for production use

### Firebase
- Firestore usage depends on reads/writes
- Check [Firebase pricing](https://firebase.google.com/pricing) for details
- Consider Firebase security rules to prevent abuse

## Customization

### Adding New Languages
To add support for additional languages, modify the `languageOrder` array in `src/App.js`:

```javascript
const languageOrder = [
  { key: 'your_language_key', name: 'Language Name' },
  // ... existing languages
];
```

### Modifying UI Text
Update the `uiText` object in `src/App.js` to add new languages or modify existing translations.

### Styling
- Colors and themes are defined in the `themes` object
- Custom CSS can be added to `src/index.css`
- Tailwind classes can be customized in `tailwind.config.js`

## Security Considerations

See [`SECURITY.md`](./SECURITY.md) for the full architecture. In short:

1. **API key**: the Gemini key lives only in the Cloud Function (Firebase secret),
   never in the client bundle. Calls go through `/api/*`.
2. **Firebase rules**: [`firestore.rules`](./firestore.rules) scopes each user to
   their own data and denies everything else.
3. **Auth + rate limiting**: the proxy requires a Firebase ID token and applies a
   per-user rate limit; the prompt is built server-side so the key can't be reused
   as a general LLM.
4. **Headers**: `firebase.json` sets CSP, HSTS, X-Frame-Options, and more.
5. **Next step**: enable Firebase App Check for stronger abuse protection.

## Troubleshooting

### Common Issues

1. **Firebase Authentication Error**
   - Verify your Firebase configuration
   - Check that Firestore is enabled
   - Ensure security rules allow anonymous authentication

2. **Gemini API Error**
   - Verify your API key is correct
   - Check API quotas and usage limits
   - Ensure the API key has proper permissions

3. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors if using TypeScript

4. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check that PostCSS config is correct

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

For support or questions:
- Create an issue in the GitHub repository
- Check the Firebase and Gemini API documentation
- Review the troubleshooting section above

## Acknowledgments

- Google Gemini AI for powerful language processing
- Firebase for backend services
- Tailwind CSS for styling
- Lucide React for icons
- Vazirmatn, Noto Naskh Arabic, and Amiri fonts for Kurdish/Arabic text support

---

**Ferhengî Jîr** - Empowering Kurdish language learning through AI technology.