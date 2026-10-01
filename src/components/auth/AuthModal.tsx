import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDismissable } from '../../hooks/useDismissable';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    enterAsGuest,
    loading,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sincronizar modo inicial con el contexto
  useEffect(() => {
    setMode(authModalMode);
    setError(null);
    setSuccessMessage(null);
  }, [authModalMode, isAuthModalOpen]);

  const { contentRef, handleBackdropClick } = useDismissable({
    onDismiss: closeAuthModal,
    isOpen: isAuthModalOpen,
  });

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    try {
      if (mode === 'login') {
        if (!password) {
          setError('Por favor ingresa tu contraseña.');
          return;
        }
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        if (!password || password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres.');
          return;
        }
        await registerWithEmail(email, password, displayName);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMessage('Te hemos enviado un correo con instrucciones para restablecer tu contraseña.');
      }
    } catch (err: any) {
      console.error('Error de autenticación:', err);
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else if (code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya tiene una cuenta registrada. Prueba iniciando sesión.');
      } else if (code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil. Usa al menos 6 caracteres.');
      } else if (code === 'auth/invalid-email') {
        setError('El formato del correo electrónico no es válido.');
      } else {
        setError(err.message || 'Ocurrió un error al procesar la solicitud.');
      }
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-auth-title"
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Cabecera Institucional */}
        <div className="relative bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 p-6 text-white overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-emerald-500/20 blur-xl"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                  Planeador de Eventos
                  <span className="rounded bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 text-[10px] font-bold border border-emerald-400/30">
                    UdeA
                  </span>
                </h2>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Facultad de Medicina
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeAuthModal();
              }}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              aria-label="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              {mode === 'login' && 'Ingresa con tu correo y contraseña institucional para gestionar eventos.'}
              {mode === 'register' && 'Crea tu cuenta institucional para solicitar permisos de gestor.'}
              {mode === 'forgot' && 'Ingresa tu correo para recuperar el acceso a tu cuenta.'}
            </p>
          </div>
        </div>

        {/* Pestañas de Cambio de Modo */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-3 text-center transition-all ${
                mode === 'login'
                  ? 'border-b-2 border-indigo-600 bg-white text-indigo-600 shadow-2xs font-extrabold'
                  : 'hover:text-slate-900'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-3 text-center transition-all ${
                mode === 'register'
                  ? 'border-b-2 border-indigo-600 bg-white text-indigo-600 shadow-2xs font-extrabold'
                  : 'hover:text-slate-900'
              }`}
            >
              Solicitar Registro
            </button>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Campo Nombre (solo en registro) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Alejandro Gómez"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Campo Correo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="usuario@udea.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Contraseña
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Botón Principal */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Verificando...
              </span>
            ) : mode === 'login' ? (
              'Ingresar al Planeador'
            ) : mode === 'register' ? (
              'Enviar Solicitud de Registro'
            ) : (
              'Enviar Enlace de Recuperación'
            )}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium py-1"
            >
              ← Volver al inicio de sesión
            </button>
          )}

          {/* Opción de continuar como visitante */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                enterAsGuest();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors py-1 cursor-pointer"
            >
              <span>Consultar calendario como visitante (Solo Lectura)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
