# How to Reload the App and Clear Cache

The history button has been added to `app/index.tsx` but you need to reload the app to see it.

## Steps to Fix:

### Option 1: Clear Metro Bundler Cache (RECOMMENDED)
```bash
cd c:\Users\Sierra\libraproject\libra\frontend
npm start -- --clear
```

### Option 2: Manual Cache Clear
1. Stop the current development server (Ctrl+C)
2. Run these commands:
```bash
cd c:\Users\Sierra\libraproject\libra\frontend
npx expo start --clear
```

### Option 3: Hard Reload in Browser (if using web)
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or open DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

### Option 4: Reload in Expo Go App (if using mobile)
- Shake your device
- Tap "Reload"

### Option 5: Complete Reset
```bash
cd c:\Users\Sierra\libraproject\libra\frontend
rm -rf node_modules/.cache
npm start
```

## Verify the Button Exists

The button code is at lines 332-341 in `app/index.tsx`:
```tsx
{/* History button */}
<Pressable
  style={({ pressed }) => [
    styles.historyButton,
    pressed && styles.historyButtonPressed,
  ]}
  onPress={() => router.push('/history')}
>
  <Text style={styles.historyButtonText}>📚 View History</Text>
</Pressable>
```

It should appear between the "Start New Debate" button and the "BETA Version 1.0" text.
