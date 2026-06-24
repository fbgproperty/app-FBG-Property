// Firebase Authentication (đăng nhập/đăng ký bằng Google) cho app.fbgproperty.vn
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDik6FB4IKdneeKYcw_VGI18ucv_cKRka0',
  authDomain: 'gen-lang-client-0722799198.firebaseapp.com',
  projectId: 'gen-lang-client-0722799198',
  storageBucket: 'gen-lang-client-0722799198.firebasestorage.app',
  messagingSenderId: '463824382309',
  appId: '1:463824382309:web:43f3ce71233a54010d598c',
};

export const fbApp = initializeApp(firebaseConfig);
export const fbAuth = getAuth(fbApp);
setPersistence(fbAuth, browserLocalPersistence).catch(() => {});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
