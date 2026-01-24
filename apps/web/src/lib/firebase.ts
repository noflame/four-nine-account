import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyByckJpCVSVKl_q4bRe-yeD7pkIJbQ9r4I",
    authDomain: "lin-fan.firebaseapp.com",
    projectId: "lin-fan",
    storageBucket: "lin-fan.firebasestorage.app",
    messagingSenderId: "481202926103",
    appId: "1:481202926103:web:fe50ed7023634ee86ce252",
    measurementId: "G-5XT4N02FGP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
