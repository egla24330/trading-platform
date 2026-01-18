import { initializeApp } from "firebase/app";
import {getAuth,GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCczKM25d43wjsAbrJs20UdpMYisbxK2VM",
  authDomain: "crypto-9b989.firebaseapp.com",
  projectId: "crypto-9b989",
  storageBucket: "crypto-9b989.firebasestorage.app",
  messagingSenderId: "694839636754",
  appId: "1:694839636754:web:2d56436f42560b24c139cb",
  measurementId: "G-Z54DH26QSK"

  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth =getAuth(app)
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };