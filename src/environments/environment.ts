import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyAEwFKL7HiLz9MFv2oxz8q-VtUakzL0ccE",
    authDomain: "mallarauco-7e4e8.firebaseapp.com",
    projectId: "mallarauco-7e4e8",
    storageBucket: "mallarauco-7e4e8.appspot.com",
    messagingSenderId: "544615694613",
    appId: "1:544615694613:web:e36eb9b0ebde3f9944291c",
    measurementId: "G-1ZSXBT4HZ7"
  }
};


// Initialize Firebase
const app = initializeApp(environment.firebaseConfig);
const analytics = getAnalytics(app);