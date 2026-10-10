import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBDr7icyhe-uCKBf9ZDfjflNtdnSGUhpxw",
    authDomain: "suryodhaya-green-solar.firebaseapp.com",
    projectId: "suryodhaya-green-solar",
    storageBucket: "suryodhaya-green-solar.firebasestorage.app",
    messagingSenderId: "813471612798",
    appId: "1:813471612798:web:969bad2bb48ed0f7dfbd2f",
    measurementId: "G-FT02QL9YX1"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db, analytics };
