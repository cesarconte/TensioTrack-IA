import { useEffect } from 'react';
import { onAuthStateChanged, doc, getDoc, setDoc, serverTimestamp, db, auth } from '../firebase';
import { useAppStore } from '../store/useAppStore';

export function useAuth() {
  const { setUser, setAuthReady } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          const profile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };

          if (!userSnap.exists()) {
            const initialRole = firebaseUser.email === 'yugurta@gmail.com' ? 'admin' : 'patient';
            await setDoc(userRef, {
              ...profile,
              role: initialRole,
              createdAt: serverTimestamp()
            });
            setUser({
              ...profile,
              role: initialRole
            });
          } else {
            const userData = userSnap.data() as any;
            let currentRole = userData.role || 'patient';
            
            // Auto-promote yugurta to admin if missing
            if (firebaseUser.email === 'yugurta@gmail.com' && currentRole !== 'admin') {
              currentRole = 'admin';
              await setDoc(userRef, { role: 'admin' }, { merge: true });
            }
            
            // Prioritize Firestore data over Google Auth data for custom changes
            setUser({ 
              ...profile, 
              ...userData,
              role: currentRole,
              displayName: userData.displayName || profile.displayName,
              photoURL: userData.photoURL || profile.photoURL,
              updatedAt: userData.updatedAt
            });
          }
        } catch (error) {
          console.error("Error syncing user:", error);
          // Fallback to basic profile if Firestore fails
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
        }
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [setUser, setAuthReady]);
}
