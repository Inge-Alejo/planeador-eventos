// Contexto de Autenticación Empresarial (Google OAuth + Demo Selector)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoAdmin: () => void;
  loginAsDemoUser: () => void;
  switchRole: (newRole: UserRole) => void;
  logout: () => Promise<void>;
  isFirebaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'eventflow_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Usuario administrador por defecto para visualización inmediata
    return {
      uid: 'admin-1',
      displayName: 'Alejandro Gómez',
      email: 'alejandro.gomez@empresa.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'administrador',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
  });

  const [loading, setLoading] = useState<boolean>(false);

  // Escuchar estado de Firebase si está configurado
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsub = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const profile: UserProfile = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || 'Usuario Google',
            email: fbUser.email || '',
            photoURL: fbUser.photoURL || undefined,
            role: 'administrador', // O asignable según claim o BD
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
          setUser(profile);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
        }
      });
      return () => unsub();
    }
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth && googleProvider) {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        const profile: UserProfile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Usuario Google',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || undefined,
          role: 'administrador',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        setUser(profile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
      } else {
        // Simulación controlada cuando no hay API Key de Google
        loginAsDemoAdmin();
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión con Google:', err);
      alert('Error en Google Sign-In: ' + (err.message || 'Verifica la consola'));
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoAdmin = () => {
    const adminUser: UserProfile = {
      uid: 'admin-1',
      displayName: 'Alejandro Gómez (Admin)',
      email: 'alejandro.gomez@empresa.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'administrador',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    setUser(adminUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
  };

  const loginAsDemoUser = () => {
    const regularUser: UserProfile = {
      uid: 'user-2',
      displayName: 'Dra. Sofía Restrepo (Usuario)',
      email: 'sofia.restrepo@empresa.com',
      photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      role: 'usuario',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    setUser(regularUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(regularUser));
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth);
    }
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === 'administrador',
        loginWithGoogle,
        loginAsDemoAdmin,
        loginAsDemoUser,
        switchRole,
        logout,
        isFirebaseActive: isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
