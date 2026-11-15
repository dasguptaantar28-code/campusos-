# CampusOS — Production Deployment & Setup Guide

## 1. Supabase Cloud Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Authenticate Supabase CLI and link your project:
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```
   *(Or apply `supabase/migrations/202611120001..0010.sql` sequentially in Supabase SQL Editor.)*
3. Deploy Edge Functions & set server-only secrets:
   ```bash
   npx supabase secrets set \
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
     FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
     STRIPE_SECRET_KEY=sk_live_... \
     STRIPE_WEBHOOK_SECRET=whsec_...

   npx supabase functions deploy resolve-config
   npx supabase functions deploy remote-control
   npx supabase functions deploy send-notification
   npx supabase functions deploy create-payment-intent
   npx supabase functions deploy payment-webhook --no-verify-jwt
   npx supabase functions deploy bulk-student-import
   npx supabase functions deploy revoke-session
   ```
4. Bootstrap the first Global Super Admin:
   After registering your Super Admin user via `/login` or Supabase Auth, run once in SQL Editor:
   ```sql
   INSERT INTO public.platform_admins (user_id, role_level, is_active)
   SELECT id, 'super_admin', TRUE FROM auth.users WHERE email = 'superadmin@yourdomain.com';
   ```

---

## 2. Firebase Cloud Messaging (Android Push Notifications)
1. Create a Firebase project and register Android app package `com.campusos.campusos_mobile`.
2. Download `google-services.json` and place it at:
   `apps/mobile/android/app/google-services.json` (excluded from Git via `.gitignore`).
3. Generate a Firebase Service Account private key JSON and set it as `FIREBASE_SERVICE_ACCOUNT_JSON` in Supabase Edge Function secrets.

---

## 3. Next.js Web Deployment on Vercel
1. Push repository to GitHub (`.gitignore` excludes `.env*`, keystores, and build artifacts).
2. Import the repository into Vercel.
   - Root Directory can remain repository root (uses `vercel.json`) OR `apps/web`.
3. Add Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Server-only!)
   - `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET` (optional for payment gateway)
4. Deploy. Verify `/api/health` returns `status: "operational"`.

---

## 4. Flutter Android APK Build (Debug & Release)

### Debug APK (Testing & Emulators)
```bash
cd apps/mobile
flutter pub get
flutter build apk --debug \
  --dart-define=SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```
Output: `apps/mobile/build/app/outputs/flutter-apk/app-debug.apk`

### Signed Release APK (Production Distribution)
1. Generate a release upload keystore (keep outside Git):
   ```bash
   keytool -genkey -v -keystore campusos-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias campusos
   ```
2. Create `apps/mobile/android/key.properties` (gitignored):
   ```properties
   storePassword=YOUR_STORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=campusos
   storeFile=C:/path/to/campusos-release.jks
   ```
3. Build release APK:
   ```bash
   flutter build apk --release \
     --dart-define=SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
     --dart-define=SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```
   Output: `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`

---

## 5. Native Android Kotlin APK & MuMu Player Installation
If building directly with Android Studio / Gradle (without Flutter `dart.exe`), use [apps/mobile-android](file:///C:/Users/This%20PC/Desktop/campusos/apps/mobile-android):
```bat
cd apps\mobile-android
gradlew.bat assembleDebug
```
Then run [Install_CampusOS_To_MuMu.bat](file:///C:/Users/This%20PC/Desktop/campusos/scripts/Install_CampusOS_To_MuMu.bat) to install and launch `CampusOS-debug.apk` on MuMu Player (`127.0.0.1:16384` / `7555`).
