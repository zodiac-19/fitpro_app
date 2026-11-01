# Fitpro App
Fitness and workout app built with React Native and Expo.

The app needs two backends. Both are free to start and are read from build-time secrets
(GitHub → repo → Settings → Secrets and variables → Actions → New repository secret).

## 1) Photo analysis + goal verification (server/)
Real analysis of the body photo (chest, shoulders, waist…). Anything that is not a clear photo of a
person (paper, cardboard, objects, screenshots) is rejected.
1. Create an API key at console.anthropic.com.
2. On vercel.com: Add New → Project → import this repo, set **Root Directory = `server`**.
3. Add the environment variable `ANTHROPIC_API_KEY`, then Deploy.
4. Add two GitHub secrets: `SCAN_URL` = `https://<your-app>.vercel.app/api/scan`
   and `VERIFY_URL` = `https://<your-app>.vercel.app/api/verify`.

## 2) Squad (Firebase)
1. console.firebase.google.com → create a project → add a **Web app** and copy its config.
2. Build → Authentication → Sign-in method → enable **Anonymous**.
3. Build → Firestore Database → Create database, then paste `firestore.rules` in the Rules tab → Publish.
4. Add GitHub secrets: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`,
   `FIREBASE_APP_ID`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_STORAGE_BUCKET`.

Then re-run the **Build APK** workflow.
