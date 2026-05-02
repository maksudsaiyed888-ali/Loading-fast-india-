# Play Store Submission Guide — Loading Fast India

## App Details
- **Package**: `com.loadingfastindia.app`
- **EAS Project**: `loading-fast-india`
- **Expo Account**: `maksudsaiyed-313`
- **Version**: 1.0.1 (versionCode: 6)
- **EAS Project ID**: `90d24ee7-082f-4a98-b2f2-e57f8c87c9d5`

---

## Step 1: EAS से Production AAB Build करें

Terminal में यह command run करें:

```bash
cd artifacts/loading-fast-india
eas build --platform android --profile production
```

- यह automatically AAB file build करेगा
- Build complete होने पर link मिलेगा: https://expo.dev/accounts/maksudsaiyed-313/projects/loading-fast-india/builds
- AAB file वहाँ से download करें

**Note**: पहली बार `eas login` run करना होगा।

---

## Step 2: Google Play Console Setup

### 2a. Play Console Account
1. https://play.google.com/console पर जाएं
2. Developer account create करें ($25 one-time fee)
3. "Create app" → App name: "Loading Fast India"

### 2b. App Setup in Play Console
- **Default language**: Hindi (hi-IN)
- **App category**: Travel & Local → Transportation
- **Content rating**: Complete questionnaire (no violence/adult content)
- **Target audience**: 18+

---

## Step 3: Play Store Listing Content

सब content `store-listing/` folder में तैयार है:

| File | Use |
|------|-----|
| `short-description.txt` | Play Store short description (80 chars) |
| `description-hi.txt` | Hindi full description |
| `description-en.txt` | English full description |
| `SCREENSHOTS_GUIDE.md` | Screenshot specifications |

### Play Console में fill करें:
- **App name**: Loading Fast India
- **Short description**: `store-listing/short-description.txt` से copy करें
- **Full description**: `store-listing/description-hi.txt` से copy करें
- **Screenshots**: minimum 2 screenshots upload करें (1080x1920 px)
- **Feature graphic**: 1024x500 px banner बनाएं

---

## Step 4: Google Play Service Account Key बनाएं

`eas submit` के लिए `google-play-key.json` चाहिए:

1. Google Play Console → Setup → API access
2. "Link to a Google Cloud Project" → Create new project
3. Google Cloud Console → IAM & Admin → Service Accounts
4. New service account बनाएं: "EAS Submit"
5. Role: **Release Manager**
6. JSON key download करें
7. File को rename करके `google-play-key.json` करें
8. File को `artifacts/loading-fast-india/google-play-key.json` पर रखें

**IMPORTANT**: यह file `.gitignore` में add करें — कभी commit न करें!

---

## Step 5: First Upload (Manual — Required for first time)

पहली बार EAS submit काम नहीं करता जब तक manually एक AAB upload न हो:

1. Step 1 से AAB file download करें
2. Play Console → Testing → Internal testing → Create new release
3. AAB file upload करें
4. Release notes add करें (Hindi में):
   ```
   पहला release — Loading Fast India
   • Live GPS tracking
   • Instant trip booking
   • KYC verification
   • Secure payments
   ```
5. "Review release" → "Start rollout to Internal testing"

---

## Step 6: EAS Submit (Future releases के लिए)

`google-play-key.json` setup होने के बाद:

```bash
cd artifacts/loading-fast-india
eas submit --platform android --profile production --latest
```

यह automatically latest build को Play Console के internal testing track पर submit करेगा।

---

## Step 7: Internal Testing Setup

1. Play Console → Internal testing → Testers
2. Email list add करें (team members)
3. Invite link share करें
4. Testers को Play Store से app install करने को कहें

---

## Checklist

- [ ] EAS account logged in (`eas login`)
- [ ] Production AAB build complete
- [ ] Google Play Console account active ($25 paid)
- [ ] App created in Play Console
- [ ] Store listing filled (title, description, screenshots)
- [ ] Content rating questionnaire complete
- [ ] google-play-key.json created and placed
- [ ] First AAB manually uploaded to internal testing
- [ ] Internal testers invited

---

## Useful Links

- EAS Builds: https://expo.dev/accounts/maksudsaiyed-313/projects/loading-fast-india/builds
- Play Console: https://play.google.com/console
- EAS Submit Docs: https://docs.expo.dev/submit/android/
- Service Account Setup: https://docs.expo.dev/submit/android/#credentials
