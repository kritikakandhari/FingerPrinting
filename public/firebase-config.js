// Firebase Configuration
// TODO: Replace the values below with your specific Firebase Project keys.
// You can get these from the Firebase Console: Project Settings > General > Your Apps > SDK Setup/Config

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
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
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
