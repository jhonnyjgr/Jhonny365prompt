import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

interface User {
  id: string;
  username: string;
  role: string;
  profilePic: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        setToken(idToken);
        
        // Listen for profile changes in Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({
              id: fbUser.uid,
              username: data.username || fbUser.displayName || 'Usuario',
              role: data.role || 'Regular',
              profilePic: data.profilePic || fbUser.photoURL || 'https://picsum.photos/seed/user/200',
            });
          }
          setLoading(false);
        });
        
        return () => unsubDoc();
      } else {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error at logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
