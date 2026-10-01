import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  ShieldCheck,
  User,
  LogOut,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Menu,
  Eye,
  Clock,
  Lock,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppNotification } from '../../types';

interface HeaderProps {
  onOpenNewEvent: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: (targetIds?: string[]) => void;
  onToggleMobileSidebar: () => void;
  onSelectEventFromNotification?: (eventId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewEvent,
  onSearch,
  searchQuery,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onToggleMobileSidebar,
  onSelectEventFromNotification,
}) => {
  const {
    user,
    isAdmin,
    canEdit,
    isPending,
    isReadOnly,
    switchRole,
    logout,
    openAuthModal,
  } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationRef = React.useRef<HTMLDivElement>(null);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  // Filtrado exclusivo de notificaciones por usuario
  const userNotifications = React.useMemo(() => {
    if (!user) return [];
    const email = user.email.toLowerCase();
    const uid = user.uid;
    if (isAdmin) {
      return notifications.filter(
        (n) => n.userId === 'ALL_ADMINS' || n.userId === uid || (n.userId && n.userId.toLowerCase() === email)
      );
    }
    return notifications.filter(
      (n) => n.userId === uid || (n.userId && n.userId.toLowerCase() === email)
    );
  }, [notifications, user, isAdmin]);

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  // Cierre automático al hacer clic por fuera o presionar Escape
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCreateClick = () => {
    if (!canEdit) {
      if (!user) {
        openAuthModal('login');
      } else {
        alert('Cuenta en Modo Solo Lectura:\n\nTu solicitud de acceso está pendiente de aprobación por el Administrador. Solo usuarios aprobados como Gestores o Administradores pueden registrar eventos.');
      }
      return;
    }
    onOpenNewEvent();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Lado izquierdo: Botón Menú Móvil + Buscador Global */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar eventos, espacios, personas (ej: Auditorio, Juan, Grabación)..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-200/70 rounded-full px-1.5 py-0.5"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lado derecho: Botón Acción + Notificaciones + Perfil */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Indicadores de Estado de Acceso */}
        {isPending && (
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold animate-pulse"
            title="Tu cuenta fue registrada y está pendiente de ser aprobada por el Administrador"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pendiente Aprobación</span>
          </div>
        )}

        {isReadOnly && !isPending && (
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold"
            title="Modo Consulta: puedes ver todo el calendario, pero no realizar modificaciones"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Modo Consulta</span>
          </div>
        )}

        {/* Botón "+ Nuevo Evento" */}
        <button
          onClick={handleCreateClick}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            canEdit
              ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98]'
              : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 hover:text-slate-600'
          }`}
          title={!canEdit ? 'Requiere aprobación de Administrador para crear eventos' : 'Crear nuevo evento'}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo Evento</span>
          <span className="sm:hidden">Crear</span>
        </button>

        {/* Centro de Notificaciones */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => onMarkAllNotificationsRead(userNotifications.map((n) => n.id))}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 py-1">
                {userNotifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No tienes notificaciones en este momento.
                  </div>
                ) : (
                  userNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        onMarkNotificationRead(notif.id);
                        if (notif.eventId && onSelectEventFromNotification) {
                          onSelectEventFromNotification(notif.eventId);
                          setShowNotifications(false);
                        }
                      }}
                      className={`flex items-start gap-3 p-3 transition-colors hover:bg-slate-50 cursor-pointer rounded-xl ${
                        !notif.read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {notif.type === 'confirmacion' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {notif.type === 'rechazo' && <XCircle className="w-4 h-4 text-rose-500" />}
                        {notif.type === 'solicitud' && <Calendar className="w-4 h-4 text-indigo-500" />}
                        {notif.type === 'conflicto' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        {!['confirmacion', 'rechazo', 'solicitud', 'conflicto'].includes(notif.type) && (
                          <Bell className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold ${!notif.read ? 'text-slate-900' : 'text-slate-600'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Perfil & Conmutador de Roles */}
        {!user ? (
          <button
            onClick={() => openAuthModal('login')}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>
        ) : (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition-colors"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">
                  {user.displayName ? user.displayName.charAt(0) : 'U'}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user.displayName || 'Usuario'}
                </p>
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      isAdmin ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                  ></span>
                  <span className="text-[11px] font-medium text-slate-500 capitalize">
                    {user.role || 'Invitado'}
                  </span>
                </div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="border-b border-slate-100 pb-3 px-2">
                  <p className="text-xs font-bold text-slate-900">{user.displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>

                {/* Selector Rápido de Rol (Para pruebas del usuario) */}
                <div className="py-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                    Simular Rol de Usuario
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => switchRole('administrador')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        isAdmin ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Admin
                    </button>
                    <button
                      onClick={() => switchRole('usuario')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        !isAdmin ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      Usuario
                    </button>
                  </div>
                </div>

                {/* Iniciar con otra cuenta / Salir */}
                <div className="border-t border-slate-100 pt-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      openAuthModal('login');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-slate-400" />
                    Cambiar de cuenta
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
