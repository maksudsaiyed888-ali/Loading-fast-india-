# Loading Fast India — Project Overview

## Architecture

### Monorepo Structure (pnpm workspaces)
- `artifacts/loading-fast-india/` — Main mobile app (Expo + React Native)
- `artifacts/api-server/` — API Server (Express)
- `artifacts/mockup-sandbox/` — UI component preview sandbox

### Tech Stack
- **Mobile App**: Expo SDK 54, React Native, Expo Router (file-based routing)
- **State & Storage**: React Context API + **Firebase Firestore** (real-time, multi-device); AsyncStorage for user session only
- **Backend**: Firebase project `loding-fast` (Firestore); no API server needed for data
- **UI**: Custom components with Inter font, LinearGradient, Expo Vector Icons
- **Fonts**: Inter (400/500/600/700)

### Firebase Setup
- Project: `loding-fast` (loding-fast.firebaseapp.com)
- Config: hardcoded in `lib/firebase.ts` (standard for mobile apps)
- Firestore security rules: `firestore.rules` — currently open (allow all read/write)
- Collections: drivers, vyaparis, vehicles, trips, bilties, complaints, chatMessages, ratings, appRatings, vyapariTrips
- Real-time listeners via `onSnapshot` in AppContext — live updates across all devices

## Mobile App — Loading Fast India

### User Roles
1. **ड्राइवर (Driver)** — Register vehicles, post trips, generate bilty
2. **व्यापारी (Vyapari)** — Browse trips, book, receive bilty
3. **Admin** — View all data (password: LFI@Admin2024)

### App Screens
- `app/index.tsx` — Welcome / Role selection
- `app/login.tsx` — Login (phone-based)
- `app/driver-register.tsx` — Driver registration (Aadhaar, License, RC required)
- `app/vyapari-register.tsx` — Vyapari registration (Aadhaar required, GST optional)
- `app/(driver)/` — Driver tabs: Home, Vehicles, Post Trip, My Trips, Profile
- `app/(vyapari)/` — Vyapari tabs: Home, Browse, Bookings, Profile
- `app/admin/index.tsx` — Admin panel

### Key Files
- `lib/types.ts` — All TypeScript types, 18 vehicle types, India states
- `lib/storage.ts` — AsyncStorage CRUD helpers
- `lib/utils.ts` — ID gen, bilty numbers, commission calc, distance
- `context/AppContext.tsx` — Global state (drivers, vyaparis, vehicles, trips, bilties, complaints)
- `constants/colors.ts` — Orange (#FF6B00) + Dark Navy (#0A2540) theme
- `components/BiltyModal.tsx` — Digital bilty with UPI + IPC warnings
- `components/ComplaintModal.tsx` — Complaint system with IPC legal text

### Business Rules
- **Commission**: 2% per trip → UPI: hemaksudsaiyed888@oksbi
- **Bilty**: Auto-generated with bilty number (LFI-YYMMDD-XXXX)
- **Legal**: IPC 420 (non-payment), IPC 182 (false complaint), IPC 471 (false docs)
- **Privacy**: IT Act 2000 compliance stated

### Vehicle Types (18 total)
Tractor-Trolley, Mini Truck, Pickup, Truck 14ft, Truck 17ft, Truck/Lorry, Trailer, Tipper, Container 20ft, Container 40ft, Tanker, Flatbed, Crane Truck, Refrigerated Truck, Tempo, Auto Goods, Bullock Cart, Camel Cart

### Notification System
- Drivers set notification radius during registration: 25/50/100/200/500 km
- Vyaparis browse trips filtered by type, from/to city

### Firebase Integration
- Firebase 11.x installed but requires credentials
- Add environment secrets: EXPO_PUBLIC_FIREBASE_* for full Firebase backend
- Currently using AsyncStorage for local persistence

### Admin Access
- Navigate to Admin Panel from welcome screen
- Password: LFI@Admin2024
- Shows all drivers, vyaparis, trips, complaints
