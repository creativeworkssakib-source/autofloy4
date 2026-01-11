# AutoFloy Shop - Build Instructions

## 🌐 PWA (Progressive Web App)
**সবচেয়ে সহজ - কোনো extra কাজ লাগবে না!**

PWA ইতিমধ্যে ready। যেকোনো ফোন/কম্পিউটারে ব্রাউজার দিয়ে ভিজিট করুন:
- **iPhone:** Safari → Share বাটন → "Add to Home Screen"  
- **Android:** Chrome → Menu (⋮) → "Install App" / "Add to Home Screen"
- **Desktop:** Chrome → Address bar এ install আইকন

---

## 📱 Android APK বানাতে

### প্রয়োজনীয় সফটওয়্যার:
- Node.js (v18+)
- Android Studio
- Java JDK 17

### স্টেপস:

```bash
# 1. GitHub এ Export করুন (Lovable থেকে)
# তারপর আপনার কম্পিউটারে clone করুন

# 2. Dependencies install করুন
npm install

# 3. Android platform যোগ করুন
npx cap add android

# 4. Production build করুন
npm run build

# 5. ⚠️ গুরুত্বপূর্ণ: capacitor.config.ts ফাইল edit করুন
# server block মুছে দিন বা comment করুন:
# server: {
#   url: '...',
#   cleartext: true
# }

# 6. Sync করুন
npx cap sync android

# 7. Android Studio তে open করুন
npx cap open android
```

### Android Studio তে:
1. **Build** → **Generate Signed Bundle / APK**
2. **APK** সিলেক্ট করুন
3. Keystore তৈরি করুন (প্রথমবার)
4. **release** build করুন
5. APK পাবেন: `android/app/release/app-release.apk`

---

## 💻 Windows EXE বানাতে

### প্রয়োজনীয় সফটওয়্যার:
- Node.js (v18+)
- Windows OS (অথবা Wine on Linux/Mac)

### স্টেপস:

```bash
# 1. GitHub এ Export করুন এবং clone করুন

# 2. Dependencies install করুন
npm install

# 3. Electron builder install করুন
npm install electron electron-builder --save-dev

# 4. Production build করুন
npm run build

# 5. Windows EXE বানান
npx electron-builder --win --dir
```

### অথবা Installer বানাতে:
```bash
npx electron-builder --win
```

EXE পাবেন: `dist/win-unpacked/AutoFloy Shop.exe`

---

## 🔧 Production Checklist

### APK এর জন্য (গুরুত্বপূর্ণ!):
- [ ] `capacitor.config.ts` থেকে `server` block মুছে দিন
- [ ] `npm run build` করেছেন
- [ ] `npx cap sync android` করেছেন
- [ ] Release keystore তৈরি করেছেন

### EXE এর জন্য:
- [ ] `electron/main.js` এ `isDev = false` সেট করুন (production এ)
- [ ] `npm run build` করেছেন
- [ ] Code signing সেটআপ করুন (optional, কিন্তু recommended)

---

## ❓ সমস্যা হলে

### APK install হচ্ছে না?
- Settings → Security → "Unknown Sources" enable করুন
- অথবা Settings → Apps → Special Access → Install unknown apps

### Offline কাজ করছে না?
- নিশ্চিত করুন `capacitor.config.ts` থেকে `server` block মুছে দিয়েছেন
- আগে online এ একবার login করে নিন

### EXE virus warning দেখাচ্ছে?
- Code signing ছাড়া এটা স্বাভাবিক
- "More info" → "Run anyway" ক্লিক করুন

---

## 📞 সাপোর্ট
- Website: https://autofloy.com
- Email: support@autofloy.com
