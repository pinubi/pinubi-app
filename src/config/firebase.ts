import { initializeApp } from 'firebase/app';

// Optionally import the services that you want to use
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
// import {...} from 'firebase/database';
// import {...} from 'firebase/firestore';
// import {...} from 'firebase/functions';
// import {...} from 'firebase/storage';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBOCj5o23vjXamh09fQ7GHr_kwSzfU-Ii0",
  authDomain: "pinubi-app.firebaseapp.com",
  projectId: "pinubi-app",
  storageBucket: "pinubi-app.firebasestorage.app",
  messagingSenderId: "500010338081",
  appId: "1:500010338081:web:ce5a470145d9e491bd6060",
  measurementId: "G-GYRKH0PCBK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleAuthProvider = new GoogleAuthProvider();

// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
export { app, auth, googleAuthProvider };
