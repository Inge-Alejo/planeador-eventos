// Contexto de Autenticación con Usuario y Contraseña, Aprobación de Usuarios y RBAC
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, UserAccountStatus } from '../types';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { sendNewUserRegistrationNotificationToSuperAdmin } from '../services/emailService';
import { addNotification, savePerson, userProfileToPerson } from '../services/store';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  isPending: boolean;
  isReadOnly: boolean;
  isGuest: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  enterAsGuest: () => void;
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
const GUEST_STORAGE_KEY = 'eventflow_is_guest';

// Correos administradores configurables por entorno
const ADMIN_EMAILS: string[] = (
  (import.meta.env.VITE_ADMIN_EMAILS as string) || 'proyectostic.med@udea.edu.co'
)
  .toLowerCase()
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado inicial siempre limpio: cada usuario/navegador tiene su propia sesión
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
    return null;
  });

  const [isGuest, setIsGuest] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (window.location.search.includes('token=')) return true;
    return localStorage.getItem(GUEST_STORAGE_KEY) === 'true';
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const enterAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem(GUEST_STORAGE_KEY, 'true');
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
            userEmail === 'proyectostic.med@udea.edu.co';

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
              try {
                const personData = userProfileToPerson(initialProfile);
                await setDoc(doc(db!, 'people', fbUser.uid), personData, { merge: true });
              } catch (e) {
                console.warn('Error sincronizando persona en Firestore al autenticar:', e);
              }
              setUser(initialProfile);
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(initialProfile));
            } else {
              const data = snap.data() as UserProfile;
              // Si el email es admin y no tenía el rol, promoverlo
              if (isRootAdmin && (data.role !== 'administrador' || data.status !== 'aprobado')) {
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
          // No hay usuario autenticado en este navegador
          if (unsubscribeUserDoc) unsubscribeUserDoc();
          setUser(null);
          localStorage.removeItem(USER_STORAGE_KEY);
        }
        setLoading(false);
      });

      return () => {
        unsubAuth();
        if (unsubscribeUserDoc) unsubscribeUserDoc();
      };
    } else {
      setLoading(false);
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
      setIsGuest(false);
      localStorage.removeItem(GUEST_STORAGE_KEY);
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
          try {
            await updateProfile(userCred.user, { displayName });
          } catch (e) {
            console.warn('No se pudo actualizar displayName en auth:', e);
          }
        }
        const newProfile: UserProfile = {
          uid: userCred.user.uid,
          displayName: displayName.trim() || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: isRootAdmin ? 'administrador' : 'lector',
          status: isRootAdmin ? 'aprobado' : 'pendiente',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        await setDoc(
          doc(db, 'users', userCred.user.uid),
          {
            ...newProfile,
            timestamp: serverTimestamp(),
          },
          { merge: true }
        );
        try {
          const personData = userProfileToPerson(newProfile);
          await setDoc(doc(db, 'people', userCred.user.uid), personData, { merge: true });
        } catch (e) {
          console.warn('Error sincronizando persona en Firestore al registrar:', e);
        }
        setUser(newProfile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newProfile));

        // Enviar correo automático al Superadministrador cuando alguien se registra por primera vez
        if (!isRootAdmin) {
          sendNewUserRegistrationNotificationToSuperAdmin({
            email: cleanEmail,
            displayName: displayName.trim() || cleanEmail.split('@')[0],
            uid: userCred.user.uid,
          }).catch((err) => {
            console.warn('No se pudo enviar correo de registro al superadmin:', err);
          });

          // Notificación en la campanita de administración
          addNotification({
            userId: 'ALL_ADMINS',
            recipientEmail: 'proyectostic.med@udea.edu.co',
            title: 'Nueva Solicitud de Registro',
            message: `El usuario ${displayName.trim() || cleanEmail} (${cleanEmail}) se ha registrado y solicita aprobación.`,
            type: 'solicitud',
          }).catch((err) => {
            console.warn('No se pudo registrar notificación en el sistema:', err);
          });
        }
      } else {
        // Fallback local simulado: validar unicidad
        const rawSaved = localStorage.getItem('eventflow_users');
        const savedUsers: UserProfile[] = rawSaved ? JSON.parse(rawSaved) : [];
        const exists = savedUsers.some((u) => u.email.toLowerCase() === cleanEmail);
        if (exists) {
          const err: any = new Error(
            'Ya existe una cuenta registrada con este correo electrónico. Por favor inicia sesión.'
          );
          err.code = 'auth/email-already-in-use';
          throw err;
        }

        const demoProfile: UserProfile = {
          uid: 'user-' + Date.now(),
          displayName: displayName || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: isRootAdmin ? 'administrador' : 'lector',
          status: isRootAdmin ? 'aprobado' : 'pendiente',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        savedUsers.push(demoProfile);
        localStorage.setItem('eventflow_users', JSON.stringify(savedUsers));
        try {
          const personData = userProfileToPerson(demoProfile);
          await savePerson(personData);
        } catch (e) {
          console.warn('Error sincronizando persona local al registrar:', e);
        }
        setUser(demoProfile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(demoProfile));

        // Enviar correo automático al Superadministrador en modo local
        if (!isRootAdmin) {
          sendNewUserRegistrationNotificationToSuperAdmin({
            email: cleanEmail,
            displayName: displayName.trim() || cleanEmail.split('@')[0],
            uid: demoProfile.uid,
          }).catch((err) => {
            console.warn('No se pudo enviar correo de registro al superadmin (local):', err);
          });

          addNotification({
            userId: 'ALL_ADMINS',
            recipientEmail: 'proyectostic.med@udea.edu.co',
            title: 'Nueva Solicitud de Registro',
            message: `El usuario ${displayName.trim() || cleanEmail} (${cleanEmail}) se ha registrado y solicita aprobación.`,
            type: 'solicitud',
          }).catch((err) => {
            console.warn('No se pudo registrar notificación local:', err);
          });
        }
      }
      setIsGuest(false);
      localStorage.removeItem(GUEST_STORAGE_KEY);
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
    setIsGuest(false);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(GUEST_STORAGE_KEY);
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
        isGuest,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        enterAsGuest,
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
