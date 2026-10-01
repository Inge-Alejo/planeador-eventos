import React, { useState } from 'react';
import { EventEntity, Space, Person, AuditLog } from '../../types';
import { FileSpreadsheet, Download, Calendar, Filter, Building2, Users } from 'lucide-react';
import { formatShortDate, format12Hour } from '../../lib/timezone';

interface ReportsViewProps {
  events: EventEntity[];
  spaces: Space[];
  people: Person[];
  auditLogs: AuditLog[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  events,
  spaces,
  people,
  auditLogs,
}) => {
  const [reportType, setReportType] = useState<'eventos' | 'espacios' | 'personas' | 'auditoria'>('eventos');

  const exportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `reporte_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === 'eventos') {
      headers = ['ID', 'Titulo', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Duracion (min)', 'Espacio', 'Responsable', 'Estado', 'Asistentes'];
      rows = events.map((e) => [
        e.id,
        `"${e.title.replace(/"/g, '""')}"`,
        e.date,
        e.startTime,
        e.endTime,
        e.durationMinutes,
        `"${e.spaceName}"`,
        `"${e.responsibleName}"`,
        e.status,
        e.attendeesCount || 0,
      ]);
    } else if (reportType === 'espacios') {
      headers = ['ID', 'Nombre', 'Tipo', 'Ubicacion', 'Capacidad', 'Estado', 'Total Eventos'];
      rows = spaces.map((s) => [
        s.id,
        `"${s.name}"`,
        s.type,
        `"${s.location || ''}"`,
        s.capacity,
        s.status,
        events.filter((e) => e.spaceId === s.id).length,
      ]);
    } else if (reportType === 'personas') {
      headers = ['ID', 'Nombre Completo', 'Email', 'Cargo', 'Area', 'Total Asignaciones'];
      rows = people.map((p) => [
        p.id,
        `"${p.firstName} ${p.lastName}"`,
        p.email,
        `"${p.roleTitle}"`,
        `"${p.department}"`,
        events.filter((e) => e.peopleIds?.includes(p.id) || e.responsibleId === p.id).length,
      ]);
    } else {
      headers = ['ID', 'Accion', 'Usuario', 'Timestamp', 'Detalles'];
      rows = auditLogs.map((l) => [
        l.id,
        l.action,
        `"${l.user.name}"`,
        l.timestamp,
        `"${JSON.stringify(l.details).replace(/"/g, '""')}"`,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Centro de Reportes y Exportación de Datos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Genera consolidados de ocupación, carga operativa y trazabilidad en formato CSV/Excel.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          <span>Exportar a CSV / Excel</span>
        </button>
      </div>

      {/* Selector de Tipo de Reporte */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setReportType('eventos')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            reportType === 'eventos'
              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-2xs font-bold'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Reporte de Eventos</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{events.length} registros</p>
        </button>

        <button
          onClick={() => setReportType('espacios')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            reportType === 'espacios'
              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-2xs font-bold'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Utilización de Espacios</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{spaces.length} espacios</p>
        </button>

        <button
          onClick={() => setReportType('personas')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            reportType === 'personas'
              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-2xs font-bold'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Participación de Personas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{people.length} integrantes</p>
        </button>

        <button
          onClick={() => setReportType('auditoria')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            reportType === 'auditoria'
              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-2xs font-bold'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Auditoría y Trazabilidad</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{auditLogs.length} acciones</p>
        </button>
      </div>

      {/* Previsualización de Datos */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Previsualización de Datos a Exportar ({reportType.toUpperCase()})
        </h3>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 sticky top-0">
              {reportType === 'eventos' && (
                <tr>
                  <th className="py-2.5 px-3">Título</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Horario</th>
                  <th className="py-2.5 px-3">Espacio</th>
                  <th className="py-2.5 px-3">Responsable</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              )}
              {reportType === 'espacios' && (
                <tr>
                  <th className="py-2.5 px-3">Espacio</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Ubicación</th>
                  <th className="py-2.5 px-3">Capacidad</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              )}
              {reportType === 'personas' && (
                <tr>
                  <th className="py-2.5 px-3">Nombre</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Cargo</th>
                  <th className="py-2.5 px-3">Área</th>
                </tr>
              )}
              {reportType === 'auditoria' && (
                <tr>
                  <th className="py-2.5 px-3">Acción</th>
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3">Fecha / Hora</th>
                  <th className="py-2.5 px-3">Detalle</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportType === 'eventos' &&
                events.slice(0, 10).map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{e.title}</td>
                    <td className="py-2.5 px-3 font-mono">{e.date}</td>
                    <td className="py-2.5 px-3 font-mono">{e.startTime} - {e.endTime}</td>
                    <td className="py-2.5 px-3">{e.spaceName}</td>
                    <td className="py-2.5 px-3">{e.responsibleName}</td>
                    <td className="py-2.5 px-3 capitalize">{e.status}</td>
                  </tr>
                ))}
              {reportType === 'espacios' &&
                spaces.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="py-2.5 px-3 capitalize">{s.type.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3">{s.location}</td>
                    <td className="py-2.5 px-3">{s.capacity} personas</td>
                    <td className="py-2.5 px-3 capitalize">{s.status}</td>
                  </tr>
                ))}
              {reportType === 'personas' &&
                people.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{p.firstName} {p.lastName}</td>
                    <td className="py-2.5 px-3 font-mono">{p.email}</td>
                    <td className="py-2.5 px-3">{p.roleTitle}</td>
                    <td className="py-2.5 px-3">{p.department}</td>
                  </tr>
                ))}
              {reportType === 'auditoria' &&
                auditLogs.slice(0, 10).map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-indigo-700">{l.action}</td>
                    <td className="py-2.5 px-3">{l.user.name}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-3 truncate max-w-xs">{JSON.stringify(l.details)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
