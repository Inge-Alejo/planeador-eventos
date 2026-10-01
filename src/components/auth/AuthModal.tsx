import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    loginWithGoogle,
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
  React.useEffect(() => {
    setMode(authModalMode);
    setError(null);
    setSuccessMessage(null);
  }, [authModalMode, isAuthModalOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
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
              onClick={closeAuthModal}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
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
                  ? 'border-b-2 border-indigo-600 bg-white text-indigo-600 shadow-2xs'
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
                  ? 'border-b-2 border-indigo-600 bg-white text-indigo-600 shadow-2xs'
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
                placeholder="proyectostic.med@udea.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            {email.trim().toLowerCase() === 'proyectostic.med@udea.edu.co' && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Cuenta designada como Super Administrador
              </p>
            )}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Procesando...
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

          {/* Separador Google opcional */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
              <span className="bg-white px-2">O si prefieres</span>
            </div>
          </div>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Acceder con Cuenta de Google
          </button>

          {/* Nota de consulta pública */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[11px] text-slate-500 leading-relaxed">
            <span className="font-bold text-slate-700">Acceso Abierto:</span> Cualquier persona puede consultar los eventos del calendario sin iniciar sesión. El registro es necesario únicamente para solicitar permisos de creación y gestión de eventos.
          </div>
        </form>
      </div>
    </div>
  );
};
