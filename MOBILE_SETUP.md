# Mobile App Setup Guide

Your Bird & Co Vendor Hub is now configured as a native mobile app with full push notification support!

## 🚀 Testing on Physical Devices or Emulators

Follow these steps to run your app on iOS or Android devices:

### Prerequisites

- **For iOS**: Mac computer with Xcode installed
- **For Android**: Android Studio installed (works on Mac, Windows, or Linux)

### Step 1: Export to GitHub

1. Click the **"Export to Github"** button in Lovable
2. This will push your code to your own GitHub repository

### Step 2: Clone and Install

```bash
# Clone your repository
git clone <your-github-repo-url>
cd birdco-vendor-hub

# Install dependencies
npm install
```

### Step 3: Add iOS and/or Android Platforms

```bash
# For iOS (Mac only)
npx cap add ios

# For Android
npx cap add android

# Update native dependencies
npx cap update ios    # or android
```

### Step 4: Build the Web Assets

```bash
npm run build
```

### Step 5: Sync to Native Platforms

```bash
npx cap sync
```

**Important**: Run `npx cap sync` after every `git pull` to sync changes to the native platforms.

### Step 6: Run on Device/Emulator

```bash
# For Android
npx cap run android

# For iOS (Mac only)
npx cap run ios
```

## 📱 Push Notifications Setup

### iOS Setup (Apple Push Notification Service - APNS)

1. **Apple Developer Account**: You need an Apple Developer account ($99/year)
2. **Create App ID**: In Apple Developer portal, create an App ID with Push Notifications enabled
3. **Create Certificates**: Generate APNs certificates (Development and Production)
4. **Configure in Xcode**: 
   - Open the iOS project: `npx cap open ios`
   - Select your team in Signing & Capabilities
   - Enable Push Notifications capability

### Android Setup (Firebase Cloud Messaging - FCM)

1. **Firebase Project**: Create a project at [Firebase Console](https://console.firebase.google.com/)
2. **Add Android App**: Register your app with package name: `app.lovable.2be69bbb95e0450f83ebed9755c45ce2`
3. **Download google-services.json**: Place it in `android/app/` directory
4. **Get Server Key**: Copy the Server Key from Firebase Project Settings → Cloud Messaging

## 🔔 Sending Push Notifications

To send notifications to your vendors, you'll need to create an edge function that:

1. Fetches device tokens from the `push_tokens` table
2. Sends notifications via FCM (Android) or APNS (iOS)

### Example Use Cases

**New Job Posted**:
```json
{
  "title": "New Job Available!",
  "body": "A new catering opportunity has been posted",
  "data": {
    "type": "new_opportunity",
    "opportunity_id": "123"
  }
}
```

**Application Accepted**:
```json
{
  "title": "You're Booked!",
  "body": "You've been accepted for the Smith Wedding event",
  "data": {
    "type": "application_accepted",
    "event_id": "456"
  }
}
```

## 🔥 Hot Reload for Development

During development, the app is configured to hot-reload from the Lovable sandbox URL. This means:
- You can see changes instantly without rebuilding
- Perfect for rapid iteration
- No need to rebuild the native app for UI/logic changes

## 📝 Important Notes

- **First Run**: When you first run the app, it will request push notification permissions
- **Device Tokens**: Tokens are automatically saved to the `push_tokens` table when granted
- **Platform Detection**: The app automatically detects iOS vs Android
- **Navigation**: Tapping notifications will navigate to the appropriate screen

## 🐛 Troubleshooting

### iOS Notifications Not Working
- Ensure push notifications capability is enabled in Xcode
- Check that you're using a physical device (simulator doesn't support push)
- Verify APNs certificates are valid

### Android Notifications Not Working
- Ensure google-services.json is in the correct location
- Check Firebase project configuration
- Verify FCM server key is correct

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notifications](https://developer.apple.com/notifications/)
