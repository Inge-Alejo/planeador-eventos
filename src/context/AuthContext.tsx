// Contexto de Autenticación Empresarial con Aprobación de Usuarios y RBAC
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, UserAccountStatus } from '../types';
import { auth, googleProvider, db, isFirebaseConfigured } from '../lib/firebase';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  isPending: boolean;
  isReadOnly: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoAdmin: () => void;
  loginAsDemoUser: () => void;
  switchRole: (newRole: UserRole) => void;
  logout: () => Promise<void>;
  isFirebaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'eventflow_user';

// Correos administradores configurables por entorno
const ADMIN_EMAILS: string[] = (
  (import.meta.env.VITE_ADMIN_EMAILS as string) || ''
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
    // Usuario por defecto para visualización inicial
    return {
      uid: 'admin-1',
      displayName: 'Alejandro Gómez (Admin)',
      email: 'alejandro.gomez@udea.edu.co',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'administrador',
      status: 'aprobado',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
  });

  const [loading, setLoading] = useState<boolean>(false);

  // Escuchar estado de Firebase Authentication y sincronizar con Firestore
  useEffect(() => {
    if (isFirebaseConfigured && auth && db) {
      let unsubscribeUserDoc: (() => void) | null = null;

      const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          const userEmail = (fbUser.email || '').toLowerCase();
          const userDocRef = doc(db!, 'users', fbUser.uid);

          // Verificar si el correo es Admin Raíz
          const isRootAdmin = ADMIN_EMAILS.length > 0
            ? ADMIN_EMAILS.includes(userEmail)
            : true; // Si no hay lista definida, el primer login es Admin

          try {
            const snap = await getDoc(userDocRef);
            if (!snap.exists()) {
              // Nuevo usuario: si es admin raíz queda aprobado, si no queda pendiente (solo lectura)
              const initialProfile: UserProfile = {
                uid: fbUser.uid,
                displayName: fbUser.displayName || 'Usuario Google',
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
              // Actualizar último login
              const data = snap.data() as UserProfile;
              // Si el email está en ADMIN_EMAILS y no era admin, promoverlo
              if (isRootAdmin && data.role !== 'administrador') {
                data.role = 'administrador';
                data.status = 'aprobado';
                await setDoc(userDocRef, { role: 'administrador', status: 'aprobado' }, { merge: true });
              }
              setUser({ ...data, uid: fbUser.uid });
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
            }

            // Escuchar cambios en vivo del documento del usuario (por si el Admin lo aprueba en tiempo real)
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

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth && googleProvider) {
        await signInWithPopup(auth, googleProvider);
      } else {
        loginAsDemoAdmin();
      }
    } catch (err: any) {
      console.error('Error en Google Sign-In:', err);
      alert('Error al iniciar sesión con Google: ' + (err.message || 'Verifica la consola'));
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoAdmin = () => {
    const adminUser: UserProfile = {
      uid: 'admin-1',
      displayName: 'Alejandro Gómez (Admin)',
      email: 'alejandro.gomez@udea.edu.co',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
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
      uid: 'user-2',
      displayName: 'Dra. Sofía Restrepo (Usuario)',
      email: 'sofia.restrepo@udea.edu.co',
      photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
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

    // Si Firebase está activo, actualizar Firestore
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

  // Cálculo de permisos granulares
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
