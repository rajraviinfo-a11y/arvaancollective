/* =============================================
   FIREBASE-CONFIG.JS — Arvaan Collective
   ============================================= */

const firebaseConfig = {
  apiKey: "AIzaSyD73FCva8IVp_Dblzcgnx4jwXVm6OSkS9Q",
  authDomain: "arvaan-collective.firebaseapp.com",
  projectId: "arvaan-collective",
  storageBucket: "arvaan-collective.firebasestorage.app",
  messagingSenderId: "897472452613",
  appId: "1:897472452613:web:3498c490dd53234913646c",
  measurementId: "G-4S37XR09B1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export shared instances
window.db   = firebase.firestore();
window.auth = firebase.auth();

console.log('✅ Firebase initialized — Project:', firebaseConfig.projectId);
