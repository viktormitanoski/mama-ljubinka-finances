import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDdj4x9cVoU-JsOu9QUtPA54pFCX9yci9k",
  authDomain: "mama-ljubinka-finances.firebaseapp.com",
  projectId: "mama-ljubinka-finances",
  storageBucket: "mama-ljubinka-finances.appspot.com",
  messagingSenderId: "401518225961",
  appId: "1:401518225961:web:778750e7a47ae0e39bca38"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);