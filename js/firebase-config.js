// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB9B1PY4tSg25VftH5IwzCySfocX-XZUhk",
    authDomain: "vmax-vpn-service.firebaseapp.com",
    projectId: "vmax-vpn-service",
    storageBucket: "vmax-vpn-service.firebasestorage.app",
    messagingSenderId: "307318423197",
    appId: "1:307318423197:web:b7c5ec7115306b80009e74"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
