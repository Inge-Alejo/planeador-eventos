// Contexto de Autenticación con Usuario y Contraseña, Aprobación de Usuarios y RBAC
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, UserAccountStatus } from '../types';
import { auth, googleProvider, db, isFirebaseConfigured } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  isPending: boolean;
  isReadOnly: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoAdmin: () => void;
  loginAsDemoUser: () => void;
  switchRole: (newRole: UserRole) => void;
  logout: () => Promise<void>;
  isFirebaseActive: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'eventflow_user';

// Correos administradores configurables por entorno
const ADMIN_EMAILS: string[] = (
  (import.meta.env.VITE_ADMIN_EMAILS as string) || 'proyectostic.med@udea.edu.co'
)
  .toLowerCase()
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

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
    // Usuario inicial demo admin si no hay sesión previa
    return {
      uid: 'admin-root',
      displayName: 'Coordinación TIC (Admin)',
      email: 'proyectostic.med@udea.edu.co',
      role: 'administrador',
      status: 'aprobado',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Escuchar estado de Firebase Authentication y sincronizar con Firestore
  useEffect(() => {
    if (isFirebaseConfigured && auth && db) {
      let unsubscribeUserDoc: (() => void) | null = null;

      const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          const userEmail = (fbUser.email || '').toLowerCase();
          const userDocRef = doc(db!, 'users', fbUser.uid);

          // Verificar si el correo es Admin Raíz
          const isRootAdmin =
            ADMIN_EMAILS.includes(userEmail) ||
            userEmail === 'proyectostic.med@udea.edu.co' ||
            ADMIN_EMAILS.length === 0;

          try {
            const snap = await getDoc(userDocRef);
            if (!snap.exists()) {
              // Nuevo usuario: si es admin queda aprobado, si no queda pendiente
              const initialProfile: UserProfile = {
                uid: fbUser.uid,
                displayName: fbUser.displayName || userEmail.split('@')[0],
                email: userEmail,
                photoURL: fbUser.photoURL || undefined,
                role: isRootAdmin ? 'administrador' : 'lector',
                status: isRootAdmin ? 'aprobado' : 'pendiente',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
              };
              await setDoc(userDocRef, {
                ...initialProfile,
                timestamp: serverTimestamp(),
              });
              setUser(initialProfile);
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(initialProfile));
            } else {
              const data = snap.data() as UserProfile;
              // Si el email es admin y no tenía el rol, promoverlo
              if (isRootAdmin && data.role !== 'administrador') {
                data.role = 'administrador';
                data.status = 'aprobado';
                await setDoc(userDocRef, { role: 'administrador', status: 'aprobado' }, { merge: true });
              }
              const merged = { ...data, uid: fbUser.uid };
              setUser(merged);
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(merged));
            }

            // Escuchar cambios en vivo del documento del usuario
            unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                const liveData = docSnap.data() as UserProfile;
                setUser({ ...liveData, uid: fbUser.uid });
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(liveData));
              }
            });
          } catch (err) {
            console.error('Error sincronizando perfil en Firestore:', err);
          }
        } else {
          if (unsubscribeUserDoc) unsubscribeUserDoc();
        }
      });

      return () => {
        unsubAuth();
        if (unsubscribeUserDoc) unsubscribeUserDoc();
      };
    }
  }, []);

  // Inicio de sesión con Correo y Contraseña
  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await signInWithEmailAndPassword(auth, email.trim(), pass);
      } else {
        // Fallback local simulado
        const cleanEmail = email.trim().toLowerCase();
        const isRootAdmin =
          ADMIN_EMAILS.includes(cleanEmail) ||
          cleanEmail === 'proyectostic.med@udea.edu.co';

        const demoProfile: UserProfile = {
          uid: 'user-' + Date.now(),
          displayName: cleanEmail.split('@')[0],
          email: cleanEmail,
          role: isRootAdmin ? 'administrador' : 'lector',
          status: isRootAdmin ? 'aprobado' : 'pendiente',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        setUser(demoProfile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(demoProfile));
      }
      setIsAuthModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Registro con Correo y Contraseña
  const registerWithEmail = async (email: string, pass: string, displayName: string) => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const isRootAdmin =
        ADMIN_EMAILS.includes(cleanEmail) ||
        cleanEmail === 'proyectostic.med@udea.edu.co';

      if (isFirebaseConfigured && auth && db) {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        if (displayName) {
          await updateProfile(userCred.user, { displayName });
        }
        const newProfile: UserProfile = {
          uid: userCred.user.uid,
          displayName: displayName || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: isRootAdmin ? 'administrador' : 'lector',
          status: isRootAdmin ? 'aprobado' : 'pendiente',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', userCred.user.uid), {
          ...newProfile,
          timestamp: serverTimestamp(),
        });
        setUser(newProfile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newProfile));
      } else {
        // Fallback local simulado
        const demoProfile: UserProfile = {
          uid: 'user-' + Date.now(),
          displayName: displayName || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: isRootAdmin ? 'administrador' : 'lector',
          status: isRootAdmin ? 'aprobado' : 'pendiente',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        setUser(demoProfile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(demoProfile));
      }
      setIsAuthModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Restablecer contraseña por correo
  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email.trim());
    } else {
      alert('Se ha enviado el enlace de restablecimiento a ' + email);
    }
  };

  // Iniciar con Google (opcional)
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth && googleProvider) {
        await signInWithPopup(auth, googleProvider);
      } else {
        loginAsDemoAdmin();
      }
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Error en Google Sign-In:', err);
      alert('Error al iniciar sesión: ' + (err.message || 'Verifica la consola'));
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoAdmin = () => {
    const adminUser: UserProfile = {
      uid: 'admin-root',
      displayName: 'Coordinación TIC (Admin)',
      email: 'proyectostic.med@udea.edu.co',
      role: 'administrador',
      status: 'aprobado',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    setUser(adminUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
  };

  const loginAsDemoUser = () => {
    const regularUser: UserProfile = {
      uid: 'user-demo',
      displayName: 'Dra. Sofía Restrepo (Usuario)',
      email: 'sofia.restrepo@udea.edu.co',
      role: 'lector',
      status: 'pendiente',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    setUser(regularUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(regularUser));
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      role: newRole,
      status: newRole === 'lector' ? 'pendiente' : 'aprobado',
    };
    setUser(updated);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));

    if (isFirebaseConfigured && db && user.uid) {
      setDoc(doc(db, 'users', user.uid), { role: newRole, status: updated.status }, { merge: true }).catch(console.error);
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth);
    }
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  // Permisos granulares
  const isAdmin = user?.role === 'administrador' && user?.status === 'aprobado';
  const canEdit = (user?.role === 'administrador' || user?.role === 'gestor') && user?.status === 'aprobado';
  const isPending = user?.status === 'pendiente';
  const isReadOnly = !canEdit;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        canEdit,
        isPending,
        isReadOnly,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        loginWithGoogle,
        loginAsDemoAdmin,
        loginAsDemoUser,
        switchRole,
        logout,
        isFirebaseActive: isFirebaseConfigured,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
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
