// Firebase Configuration
// TODO: Replace the values below with your specific Firebase Project keys.
// You can get these from the Firebase Console: Project Settings > General > Your Apps > SDK Setup/Config

const firebaseConfig = {
    apiKey: "AIzaSyBRdec0q7iULQhOE_l2sff1NfvM3WJxuus",
    authDomain: "pz-fingerprinting.firebaseapp.com",
    projectId: "pz-fingerprinting",
    storageBucket: "pz-fingerprinting.firebasestorage.app",
    messagingSenderId: "170864222606",
    appId: "1:170864222606:web:a79135bce3af0f54b184df",
    measurementId: "G-M56PNFBCLJ"
};

// Initialize Firebase
// Using the 'compat' libraries loaded via CDN in HTML files
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

// Export auth instance for other scripts to use
// Export auth instance for other scripts to use
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Explicitly set persistence to LOCAL
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => console.log("Persistence set to LOCAL"))
    .catch((error) => console.error("Persistence Error:", error));
