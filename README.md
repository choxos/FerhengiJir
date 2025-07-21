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
3. Enable **Firestore Database** in test mode
4. Go to Project Settings → General → Your apps
5. Add a web app and copy the configuration values

### 3. Google Gemini API Setup

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key for Gemini
3. Save the API key securely

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

   # Google Gemini API Key
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 5. Firebase Security Rules

Set up Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
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

# Initialize Firebase in your project
firebase init hosting

# Build and deploy
npm run build
firebase deploy
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
- `REACT_APP_GEMINI_API_KEY`

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

1. **API Key Security**: Keep your Gemini API key secure and consider implementing server-side proxy for production
2. **Firebase Rules**: Implement proper Firestore security rules
3. **Rate Limiting**: Consider implementing rate limiting to prevent API abuse
4. **CORS**: Configure proper CORS settings for your domain

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