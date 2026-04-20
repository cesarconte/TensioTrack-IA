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
            await setDoc(userRef, {
              ...profile,
              createdAt: serverTimestamp()
            });
            setUser(profile);
          } else {
            const userData = userSnap.data() as any;
            
            // Prioritize Firestore data over Google Auth data for custom changes
            setUser({ 
              ...profile, 
              ...userData,
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
