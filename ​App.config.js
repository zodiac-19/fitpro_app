// Dynamic Expo config. Public env vars (EXPO_PUBLIC_*) are read in src/services.
export default ({ config }) => ({
  ...config,
  name: 'Fitpro',
  slug: 'fitpro',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  scheme: 'fitpro',
  icon: './assets/icon.png',
  splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: '#090A12' },
  
  android: {
  package: 'com.zodiac.fitpro',
  versionCode: 1,
  adaptiveIcon: {
    foregroundImage: './assets/adaptive-icon.png',
    backgroundColor: '#090A12'
  },
  permissions: ['CAMERA']
},


  plugins: [
    [
      'expo-image-picker',
      {
        photosPermission: 'Fitpro needs your photos to analyze your physique and verify progress.',
        cameraPermission: 'Fitpro needs the camera to scan your physique and verify progress.',
      },
    ],
  ],
  extra: {
    // Fill after running `eas init`
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
});
