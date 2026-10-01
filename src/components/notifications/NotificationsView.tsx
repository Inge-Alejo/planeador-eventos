import React, { useState, useMemo } from 'react';
import { AppNotification } from '../../types';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  CheckCheck,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  Clock,
  Inbox,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => Promise<void> | void;
  onMarkAllNotificationsRead: (targetIds?: string[]) => Promise<void> | void;
  onSelectEvent?: (eventId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSelectEvent,
}) => {
  const { user, isAdmin, openAuthModal } = useAuth();
  const [filterType, setFilterType] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  // Filtrado exclusivo de notificaciones por usuario
  const userNotifications = useMemo(() => {
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

  const unreadCount = useMemo(() => {
    return userNotifications.filter((n) => !n.read).length;
  }, [userNotifications]);

  const filteredNotifications = useMemo(() => {
    return userNotifications.filter((n) => {
      if (filterType === 'unread' && n.read) return false;
      if (filterType === 'solicitud' && n.type !== 'solicitud') return false;
      if (filterType === 'confirmacion' && n.type !== 'confirmacion') return false;
      if (filterType === 'rechazo' && n.type !== 'rechazo') return false;
      if (filterType === 'conflicto' && n.type !== 'conflicto') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [userNotifications, filterType, searchQuery]);

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const unreadIds = userNotifications.filter((n) => !n.read).map((n) => n.id);
      await onMarkAllNotificationsRead(unreadIds);
    } finally {
      setMarkingAll(false);
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Reciente';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    } catch {
      return 'Reciente';
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
          <Bell className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Bandeja Exclusiva de Notificaciones</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Inicia sesión con tu cuenta de la Facultad de Medicina para recibir tus invitaciones a eventos, confirmaciones y avisos personalizados.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all"
        >
          <User className="w-4 h-4" />
          <span>Iniciar Sesión para Ver Notificaciones</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              Centro de Notificaciones y Avisos
            </h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                {unreadCount} no leídas
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bandeja exclusiva para <strong>{user.displayName || user.email}</strong>{' '}
            {isAdmin && <span className="text-emerald-700 font-semibold">(Acceso Superadmin a avisos institucionales)</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 px-3.5 py-1.5 text-xs font-bold shadow-2xs transition-all active:scale-[0.98]"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{markingAll ? 'Marcando...' : 'Marcar todas como leídas'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setFilterType('todas')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filterType === 'todas'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({userNotifications.length})
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filterType === 'unread'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            No leídas ({unreadCount})
          </button>
          <button
            onClick={() => setFilterType('solicitud')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filterType === 'solicitud'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Convocatorias
          </button>
          <button
            onClick={() => setFilterType('confirmacion')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filterType === 'confirmacion'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Confirmaciones
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en notificaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Lista de Notificaciones */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No hay notificaciones</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {searchQuery || filterType !== 'todas'
                ? 'Ninguna notificación coincide con el filtro o búsqueda seleccionada.'
                : 'Tu bandeja está al día. Aquí verás avisos cuando seas convocado/a o tus eventos cambien.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notif) => {
              const isUnread = !notif.read;

              return (
                <div
                  key={notif.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-colors ${
                    isUnread ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    {/* Icono de Tipo */}
                    <div className="mt-0.5 shrink-0">
                      {notif.type === 'confirmacion' && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      {notif.type === 'rechazo' && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                          <XCircle className="w-5 h-5" />
                        </div>
                      )}
                      {notif.type === 'solicitud' && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                          <Calendar className="w-5 h-5" />
                        </div>
                      )}
                      {notif.type === 'conflicto' && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      )}
                      {!['confirmacion', 'rechazo', 'solicitud', 'conflicto'].includes(notif.type) && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <Bell className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs font-bold ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                          {notif.title}
                        </h4>
                        {isUnread && (
                          <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono ml-auto sm:ml-2">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {/* Acciones por cada Notificación */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {notif.eventId && onSelectEvent && (
                      <button
                        onClick={() => onSelectEvent(notif.eventId!)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Ver Evento</span>
                      </button>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => onMarkNotificationRead(notif.id)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                        title="Marcar como leída"
                      >
                        Marcar leída
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
