/* =============================================
   FIREBASE-CONFIG.JS — Arvaan Collective
   ⚠️  FILL IN YOUR VALUES FROM FIREBASE CONSOLE
   Step: Firebase Console → Project Settings → Your apps → Web app config
   ============================================= */

const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export shared instances
window.db   = firebase.firestore();
window.auth = firebase.auth();

console.log('✅ Firebase initialized — Project:', firebaseConfig.projectId);
