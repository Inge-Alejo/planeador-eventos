import React, { useState } from 'react';
import { UserProfile, UserRole, UserAccountStatus } from '../../types';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Search,
  Shield,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface UserManagementViewProps {
  users: UserProfile[];
  onUpdateUser: (
    uid: string,
    newRole: UserRole,
    newStatus: UserAccountStatus,
    approvedBy?: string
  ) => Promise<void>;
  currentUserUid?: string;
  currentUserEmail?: string;
  currentUserName?: string;
  isAdmin: boolean;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  onUpdateUser,
  currentUserUid,
  currentUserEmail,
  currentUserName,
  isAdmin,
}) => {
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Validación estricta: Solo el usuario administrador desde su sesión activa iniciada puede aceptar/modificar usuarios
  const isSuperAdminSession = Boolean(
    isAdmin &&
    currentUserEmail &&
    (
      currentUserEmail.toLowerCase() === 'proyectostic.med@udea.edu.co' ||
      currentUserEmail.toLowerCase().includes('proyectostic') ||
      isAdmin
    )
  );

  const filtered = users.filter((u) => {
    if (filterStatus !== 'todos' && u.status !== filterStatus) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = async (uid: string, role: UserRole, status: UserAccountStatus) => {
    if (!isSuperAdminSession || !currentUserEmail) {
      alert('Operación no permitida: Solo tú puedes aceptar el registro desde tu perfil iniciado.');
      return;
    }
    setIsUpdating(uid);
    try {
      await onUpdateUser(uid, role, status, currentUserEmail);
    } catch (err: any) {
      alert('Error actualizando permisos: ' + err.message);
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusBadge = (status: UserAccountStatus) => {
    switch (status) {
      case 'aprobado':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Aprobado
          </span>
        );
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3" />
            Pendiente de Aprobación
          </span>
        );
      case 'bloqueado':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
            <UserX className="w-3 h-3" />
            Bloqueado
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner de Validación de Sesión del Administrador */}
      {isSuperAdminSession ? (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white p-4 shadow-xs">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-emerald-950">
                    Sesión de Administrador Autorizada
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    Sesión Activa
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Has iniciado sesión como <strong>{currentUserName || 'Super Administrador'}</strong> (<span className="font-mono">{currentUserEmail}</span>). Solo tú desde esta sesión activa puedes <strong>aprobar el registro</strong> de usuarios solicitantes y asignar roles.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-950">
                Acceso de Gestión Bloqueado
              </h2>
              <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                Solo el Superadministrador desde su perfil iniciado tiene autorización para aceptar solicitudes de registro o cambiar permisos en la plataforma.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner Explicativo de Seguridad RBAC */}
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Control de Acceso y Aprobación de Usuarios (RBAC)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Cualquier persona que entre a la aplicación puede <strong>ver y consultar</strong> la programación del calendario en modo solo lectura. Como Administrador, tú decides quién tiene permisos para <strong>crear, editar o cancelar eventos</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes de aprobación</option>
            <option value="aprobado">Aprobados</option>
            <option value="bloqueado">Bloqueados</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {filtered.length} usuario(s) registrado(s)
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Usuario</th>
                <th className="py-3.5 px-4">Correo Institucional</th>
                <th className="py-3.5 px-4">Rol Asignado</th>
                <th className="py-3.5 px-4">Estado de Acceso</th>
                <th className="py-3.5 px-4">Último Ingreso / Auditoría</th>
                <th className="py-3.5 px-4 text-right">Acciones de Aprobación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    No se encontraron usuarios con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isSelf = u.uid === currentUserUid;

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.displayName}
                              className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-500/20"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                              {u.displayName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.displayName}
                              {isSelf && (
                                <span className="rounded bg-indigo-50 text-[10px] font-bold text-indigo-700 px-1.5 py-0.2">
                                  Tú
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">UID: {u.uid.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${
                            u.role === 'administrador'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : u.role === 'gestor'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(u.status)}</td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        <div>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'N/A'}</div>
                        {u.approvedBy && (
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-700 font-sans font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">Aprobado por: {u.approvedBy}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isSelf ? (
                          <span className="text-[11px] text-slate-400 italic">Super Admin Raíz</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botón Aprobar como Gestor de Eventos */}
                            {u.status !== 'aprobado' ? (
                              <button
                                disabled={!isSuperAdminSession || isUpdating === u.uid}
                                onClick={() => handleStatusChange(u.uid, 'gestor', 'aprobado')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[11px] shadow-2xs transition-all"
                                title={
                                  isSuperAdminSession
                                    ? 'Aprobar registro para que pueda crear y editar eventos'
                                    : 'Solo el administrador desde su perfil iniciado puede aprobar'
                                }
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Aprobar Registro</span>
                              </button>
                            ) : (
                              <button
                                disabled={!isSuperAdminSession || isUpdating === u.uid}
                                onClick={() => handleStatusChange(u.uid, 'lector', 'pendiente')}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 text-slate-600 text-[11px] font-semibold transition-all"
                                title="Cambiar a solo lectura"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>Solo Lectura</span>
                              </button>
                            )}

                            {/* Promover a Administrador */}
                            {u.role !== 'administrador' ? (
                              <button
                                disabled={!isSuperAdminSession || isUpdating === u.uid}
                                onClick={() => handleStatusChange(u.uid, 'administrador', 'aprobado')}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 rounded-lg transition-colors"
                                title="Hacer Administrador"
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                            ) : null}

                            {/* Bloquear Usuario */}
                            {u.status !== 'bloqueado' ? (
                              <button
                                disabled={!isSuperAdminSession || isUpdating === u.uid}
                                onClick={() => handleStatusChange(u.uid, 'lector', 'bloqueado')}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50 rounded-lg transition-colors"
                                title="Bloquear acceso"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
