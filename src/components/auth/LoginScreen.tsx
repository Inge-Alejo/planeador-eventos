import React, { useState } from 'react';
import {
  Calendar,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { loginWithEmail, registerWithEmail, resetPassword, enterAsGuest, loading } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-4 relative overflow-hidden">
      {/* Luces de fondo decorativas */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md rounded-3xl border border-slate-700/60 bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Cabecera Institucional UdeA */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-indigo-900 p-6 text-white text-center relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg text-emerald-300 mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <span className="inline-block rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200 border border-emerald-300/30 mb-1">
            Universidad de Antioquia
          </span>
          <h1 className="text-lg font-bold tracking-tight">Planeador de Eventos</h1>
          <p className="text-xs text-emerald-100 font-medium">Facultad de Medicina</p>
        </div>

        {/* Pestañas de Cambio de Modo */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
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
                setSuccessMessage(null);
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
          <div className="text-center">
            <h2 className="text-sm font-bold text-slate-800">
              {mode === 'login' && 'Ingreso al Sistema'}
              {mode === 'register' && 'Crear Cuenta Institucional'}
              {mode === 'forgot' && 'Recuperar Contraseña'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'login' && 'Ingresa con tu correo y contraseña'}
              {mode === 'register' && 'Regístrate para solicitar permisos de gestor'}
              {mode === 'forgot' && 'Te enviaremos un correo con las instrucciones'}
            </p>
          </div>

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
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Verificando credenciales...
              </span>
            ) : mode === 'login' ? (
              'Ingresar al Planeador'
            ) : mode === 'register' ? (
              'Crear Cuenta y Solicitar Acceso'
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

          {/* Opción de entrar como visitante sin iniciar sesión */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={enterAsGuest}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors py-1 cursor-pointer"
            >
              <span>Consultar calendario como visitante (Solo Lectura)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      <p className="mt-4 text-[11px] text-slate-400 text-center">
        Facultad de Medicina • Universidad de Antioquia • Medellín, Colombia
      </p>
    </div>
  );
};
