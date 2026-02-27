
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null; // The auth user (email/pass)
  userProfile: User | null; // The database user (name, tier, etc)
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
        
        // Update email verification status from Firebase Auth
        if (currentUser && currentUser.emailVerified !== userData.emailVerified) {
          await updateDoc(docRef, { emailVerified: currentUser.emailVerified });
          userData.emailVerified = currentUser.emailVerified;
        }
        
        setUserProfile(userData);
      } else {
        console.log("No user profile found for this auth user.");
        setUserProfile(null);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, logout, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
