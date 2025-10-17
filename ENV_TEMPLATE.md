# Firebase Environment Variables Template

Create a `.env.local` file in the project root with the following variables:

```env
# Firebase Configuration
# Get these values from Firebase Console > Project Settings > General

VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Realtime Database URL (CRITICAL for cursor sync)
# Get this from Firebase Console > Realtime Database > Data tab URL
# Format: https://your-project-id-default-rtdb.firebaseio.com
VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

## Setup Instructions

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Create a new project** or select existing project
3. **Enable Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in **test mode** for development (⚠️ open rules)
4. **Enable Realtime Database**:
   - Go to Realtime Database
   - Click "Create database"
   - Start in **test mode** for development (⚠️ open rules)
5. **Enable Authentication**:
   - Go to Authentication > Sign-in methods
   - Enable **Anonymous** authentication
   - Enable **Google** sign-in (add your email as test user)
6. **Get Configuration**:
   - Go to Project Settings > General
   - Scroll to "Your apps" > Web app
   - If no web app exists, click "Add app" and create one
   - Copy the config values
7. **Create `.env.local`**:
   - Copy the template above
   - Fill in your Firebase values
   - Save as `.env.local` in project root
8. **Restart dev server**: `npm run dev`

## Security Notes

- ✅ `.env.local` is gitignored by default
- ✅ These are PUBLIC API keys (safe for client-side)
- ⚠️ Security is handled by Firebase Security Rules
- ⚠️ Test mode has OPEN rules - update for production
- 🔒 For production, set appropriate Firestore and Realtime Database rules

## Verifying Setup

After creating `.env.local`, run:

```bash
npm run dev
```

Check the browser console - you should see:
- "Firebase initialized successfully"
- "Firestore initialized: [DEFAULT]"
- "Realtime Database initialized: [DEFAULT]"
- "Auth initialized: [DEFAULT]"

If you see errors about missing environment variables, double-check your `.env.local` file.

## Database URLs Format

### Firestore (automatic)
- Uses projectId automatically
- No URL needed

### Realtime Database (requires URL)
- **US Central**: `https://PROJECT_ID-default-rtdb.firebaseio.com`
- **Other regions**: Check Firebase Console > Realtime Database > Data tab
- **Example**: `https://collab-canvas-mvp-default-rtdb.firebaseio.com`

⚠️ **The Realtime Database URL is REQUIRED** for cursor synchronization!

