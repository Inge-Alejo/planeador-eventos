// Módulo Exclusivo de Reportes e Informes Institucionales
// Acceso y exportación restringidos exclusivamente para el Superadministrador (proyectostic.med@udea.edu.co)

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Building2,
  Users,
  FileText,
  Clock,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Send,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Sparkles,
  BarChart3,
  PieChart,
} from 'lucide-react';
import {
  EventEntity,
  Space,
  Person,
  PeopleGroup,
  EventTask,
  ReportType,
  AutomatedReportSchedule,
  ReportExecutionLog,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { isInstitutionalSuperAdmin } from '../../services/businessRules';
import { getBogotaToday, formatFriendlyDate, format12Hour } from '../../lib/timezone';
import { sendAutomatedReportEmail } from '../../services/emailService';

interface SuperAdminReportsViewProps {
  events: EventEntity[];
  spaces: Space[];
  people: Person[];
  groups: PeopleGroup[];
  schedules: AutomatedReportSchedule[];
  logs: ReportExecutionLog[];
  onSaveSchedule: (schedule: Omit<AutomatedReportSchedule, 'id' | 'createdAt'> & { id?: string }) => Promise<string>;
  onDeleteSchedule: (id: string) => Promise<void>;
  onSaveExecutionLog: (log: Omit<ReportExecutionLog, 'id'>) => Promise<void>;
}

export const SuperAdminReportsView: React.FC<SuperAdminReportsViewProps> = ({
  events,
  spaces,
  people,
  groups,
  schedules,
  logs,
  onSaveSchedule,
  onDeleteSchedule,
  onSaveExecutionLog,
}) => {
  const { user } = useAuth();
  const isSuperAdmin = isInstitutionalSuperAdmin(user);

  const [activeTab, setActiveTab] = useState<'generacion' | 'programacion'>('generacion');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportType>('informe_mensual_gestion');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('mes_anterior');
  const [selectedTeam, setSelectedTeam] = useState<string>('todos');
  const [selectedPerson, setSelectedPerson] = useState<string>('todos');
  const [selectedModality, setSelectedModality] = useState<'todos' | 'presencial' | 'virtual'>('todos');

  // Estado para programar nuevo reporte
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedName, setNewSchedName] = useState('');
  const [newSchedType, setNewSchedType] = useState<ReportType>('informe_mensual_gestion');
  const [newSchedFreq, setNewSchedFreq] = useState<'diaria' | 'semanal' | 'mensual'>('mensual');
  const [newSchedPeriod, setNewSchedPeriod] = useState<any>('mes_anterior');
  const [newSchedFormat, setNewSchedFormat] = useState<any>('pdf');

  // Si no es el Superadministrador Institucional, bloquear acceso
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Módulo Restringido</h2>
        <p className="max-w-md text-sm text-slate-600 mt-2 leading-relaxed">
          El Centro de <strong>Reportes e Informes Institucionales</strong> está reservado de manera exclusiva para la cuenta oficial del Superadministrador (<code>proyectostic.med@udea.edu.co</code>).
        </p>
      </div>
    );
  }

  const today = getBogotaToday();

  // Cálculo de fechas del reporte seleccionado
  const { startDate, endDate, periodLabel, prevStartDate, prevEndDate } = useMemo(() => {
    const [y, m, d] = today.split('-').map(Number);
    const now = new Date(Date.UTC(y, m - 1, d));

    if (selectedPeriod === 'este_mes') {
      const start = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
      const endMonth = new Date(Date.UTC(y, m, 0));
      const end = endMonth.toISOString().slice(0, 10);

      const pLast = new Date(Date.UTC(y, m - 1, 0));
      const pStart = `${pLast.toISOString().slice(0, 7)}-01`;
      const pEnd = pLast.toISOString().slice(0, 10);
      return { startDate: start, endDate: end, periodLabel: 'Este Mes Calendario', prevStartDate: pStart, prevEndDate: pEnd };
    } else if (selectedPeriod === 'mes_anterior') {
      const pLast = new Date(Date.UTC(y, m - 1, 0));
      const start = `${pLast.toISOString().slice(0, 7)}-01`;
      const end = pLast.toISOString().slice(0, 10);

      const ppLast = new Date(Date.UTC(y, m - 2, 0));
      const pStart = `${ppLast.toISOString().slice(0, 7)}-01`;
      const pEnd = ppLast.toISOString().slice(0, 10);
      return { startDate: start, endDate: end, periodLabel: 'Mes Calendario Anterior', prevStartDate: pStart, prevEndDate: pEnd };
    } else if (selectedPeriod === 'esta_semana') {
      const dayOfWeek = now.getUTCDay() || 7;
      const mon = new Date(now);
      mon.setUTCDate(mon.getUTCDate() - dayOfWeek + 1);
      const sun = new Date(mon);
      sun.setUTCDate(sun.getUTCDate() + 6);
      return {
        startDate: mon.toISOString().slice(0, 10),
        endDate: sun.toISOString().slice(0, 10),
        periodLabel: 'Esta Semana',
        prevStartDate: '',
        prevEndDate: '',
      };
    } else {
      // Ultimos 30 días
      const d30 = new Date(now);
      d30.setUTCDate(d30.getUTCDate() - 30);
      return {
        startDate: d30.toISOString().slice(0, 10),
        endDate: today,
        periodLabel: 'Últimos 30 Días',
        prevStartDate: '',
        prevEndDate: '',
      };
    }
  }, [selectedPeriod, today]);

  // Eventos y Tareas filtradas para el reporte (con soporte para equipo y persona)
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.date < startDate || e.date > endDate) return false;
      if (selectedModality === 'presencial' && e.isVirtual) return false;
      if (selectedModality === 'virtual' && !e.isVirtual) return false;

      // Filtro por Equipo
      if (selectedTeam !== 'todos') {
        const grp = groups.find((g) => g.id === selectedTeam);
        if (grp && grp.memberIds) {
          const hasMember =
            grp.memberIds.includes(e.responsibleId) ||
            grp.memberIds.some((mId) => e.peopleIds?.includes(mId)) ||
            (e.tasks && e.tasks.some((t) => t.responsibleIds?.some((rId) => grp.memberIds.includes(rId))));
          if (!hasMember) return false;
        }
      }

      // Filtro por Persona
      if (selectedPerson !== 'todos') {
        const hasPerson =
          e.responsibleId === selectedPerson ||
          (Array.isArray(e.peopleIds) && e.peopleIds.includes(selectedPerson)) ||
          (e.tasks && e.tasks.some((t) => t.responsibleIds?.includes(selectedPerson)));
        if (!hasPerson) return false;
      }

      return true;
    });
  }, [events, startDate, endDate, selectedModality, selectedTeam, selectedPerson, groups]);

  const prevFilteredEvents = useMemo(() => {
    if (!prevStartDate || !prevEndDate) return [];
    return events.filter((e) => e.date >= prevStartDate && e.date <= prevEndDate);
  }, [events, prevStartDate, prevEndDate]);

  const allReportTasks = useMemo(() => {
    const list: EventTask[] = [];
    filteredEvents.forEach((e) => {
      (e.tasks || []).forEach((t) => list.push(t));
    });
    return list;
  }, [filteredEvents]);

  const prevReportTasks = useMemo(() => {
    const list: EventTask[] = [];
    prevFilteredEvents.forEach((e) => {
      (e.tasks || []).forEach((t) => list.push(t));
    });
    return list;
  }, [prevFilteredEvents]);

  // Cálculos consolidados para el reporte
  const activeEvents = filteredEvents.filter((e) => e.status !== 'cancelado');
  const completedEvents = filteredEvents.filter((e) => e.status === 'finalizado');
  const cancelledEvents = filteredEvents.filter((e) => e.status === 'cancelado');
  const urgentEvents = filteredEvents.filter(
    (e) => e.exceptionalApproval?.required || e.status === 'pendiente_autorizacion'
  );

  const totalTasks = allReportTasks.length;
  const completedTasks = allReportTasks.filter((t) => t.status === 'completada').length;
  const inProgressTasks = allReportTasks.filter((t) => t.status === 'en_curso').length;
  const pendingTasks = allReportTasks.filter((t) => t.status === 'pendiente').length;
  const overdueTasks = allReportTasks.filter((t) => t.status !== 'completada' && t.dueDate < today).length;
  const complianceRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Comparativo mes anterior (Sección 12.7)
  const prevTotalEvents = prevFilteredEvents.length;
  const prevCompletedTasks = prevReportTasks.filter((t) => t.status === 'completada').length;
  const diffEvents = activeEvents.length - prevTotalEvents;
  const diffTasks = completedTasks - prevCompletedTasks;

  // Generación de Recomendaciones descriptivas basadas en datos reales (Sección 12.9)
  const recommendations = useMemo(() => {
    const recs: string[] = [];
    if (overdueTasks > 0) {
      recs.push(`Se detectaron ${overdueTasks} compromisos vencidos en el periodo. Se sugiere reprogramar o redistribuir responsabilidades de forma prioritaria.`);
    }
    if (urgentEvents.length > 0) {
      recs.push(`Se radicaron ${urgentEvents.length} solicitudes de eventos presenciales excepcionales con menos de 27 días de antelación. Se recomienda reforzar la socialización de los plazos reglamentarios con las dependencias.`);
    }
    if (complianceRate < 80) {
      recs.push(`El cumplimiento operativo del periodo fue del ${complianceRate}%. Conviene revisar la carga de trabajo asignada a las etapas previas para evitar retrasos acumulados.`);
    } else {
      recs.push(`Excelente tasa de cumplimiento operativo (${complianceRate}%). Se recomienda mantener los protocolos de asignación de responsabilidades anticipadas.`);
    }
    return recs;
  }, [overdueTasks, urgentEvents, complianceRate]);

  // Cálculos para Gráficos Visuales Ejecutivos del Reporte (Sección 12.5)
  const stageStats = useMemo(() => {
    const previa = allReportTasks.filter((t) => t.stage === 'previa');
    const durante = allReportTasks.filter((t) => t.stage === 'durante');
    const posterior = allReportTasks.filter((t) => t.stage === 'posterior');
    return {
      previa: { total: previa.length, completed: previa.filter((t) => t.status === 'completada').length },
      durante: { total: durante.length, completed: durante.filter((t) => t.status === 'completada').length },
      posterior: { total: posterior.length, completed: posterior.filter((t) => t.status === 'completada').length },
    };
  }, [allReportTasks]);

  // Desempeño por Equipos en el reporte
  const reportTeamStats = useMemo(() => {
    return groups
      .map((g) => {
        const gEvents = filteredEvents.filter(
          (e) =>
            g.memberIds.includes(e.responsibleId) ||
            g.memberIds.some((mId) => e.peopleIds?.includes(mId)) ||
            e.tasks?.some((t) => t.responsibleIds?.some((rId) => g.memberIds.includes(rId)))
        );
        const tasks: EventTask[] = [];
        gEvents.forEach((e) =>
          (e.tasks || []).forEach((t) => {
            if (t.responsibleIds?.some((rId) => g.memberIds.includes(rId))) {
              tasks.push(t);
            }
          })
        );
        const completed = tasks.filter((t) => t.status === 'completada').length;
        return {
          id: g.id,
          name: g.name,
          color: g.color || '#4f46e5',
          totalEvents: gEvents.length,
          totalTasks: tasks.length,
          completedTasks: completed,
          rate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 100,
        };
      })
      .filter((g) => g.totalEvents > 0 || g.totalTasks > 0);
  }, [groups, filteredEvents]);

  // Desempeño por Personas con mayor volumen de compromisos
  const reportPersonStats = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();
    allReportTasks.forEach((t) => {
      (t.responsibleIds || []).forEach((rId) => {
        const curr = map.get(rId) || { total: 0, completed: 0 };
        curr.total += 1;
        if (t.status === 'completada') curr.completed += 1;
        map.set(rId, curr);
      });
    });
    return Array.from(map.entries())
      .map(([id, stats]) => {
        const p = people.find((item) => item.id === id);
        return {
          id,
          name: p ? `${p.firstName} ${p.lastName}` : id,
          total: stats.total,
          completed: stats.completed,
          rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [allReportTasks, people]);

  // EXPORTAR A CSV (UTF-8 con BOM)
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const filename = `Reporte_UdeA_${selectedTemplate}_${startDate}_a_${endDate}.csv`;

    if (selectedTemplate === 'informe_eventos' || selectedTemplate === 'informe_general' || selectedTemplate === 'informe_mensual_gestion') {
      headers = ['ID Evento', 'Titulo', 'Fecha', 'Inicio', 'Fin', 'Espacio', 'Modalidad', 'Responsable', 'Estado', 'Total Tareas', 'Tareas Completadas'];
      rows = filteredEvents.map((e) => [
        e.id,
        `"${e.title.replace(/"/g, '""')}"`,
        e.date,
        e.startTime,
        e.endTime,
        `"${e.spaceName}"`,
        e.isVirtual ? 'Virtual' : 'Presencial',
        `"${e.responsibleName}"`,
        e.status,
        e.tasks?.length || 0,
        e.tasks?.filter((t) => t.status === 'completada').length || 0,
      ]);
    } else if (selectedTemplate === 'informe_tareas_pendientes') {
      headers = ['ID Tarea', 'Nombre Tarea', 'Evento', 'Etapa', 'Prioridad', 'Estado', 'Fecha Limite', 'Hora', 'Responsables'];
      rows = allReportTasks.map((t) => [
        t.id,
        `"${t.name.replace(/"/g, '""')}"`,
        `"${filteredEvents.find((e) => e.id === t.eventId)?.title || t.eventId}"`,
        t.stage,
        t.priority,
        t.status,
        t.dueDate,
        t.dueTime || '',
        `"${t.responsibleIds.map((id) => people.find((p) => p.id === id)?.firstName || id).join(', ')}"`,
      ]);
    } else if (selectedTemplate === 'informe_eventos_urgentes') {
      headers = ['ID Evento', 'Titulo', 'Fecha Programada', 'Espacio', 'Solicitante', 'Estado Autorizacion', 'Justificacion Urgencia'];
      rows = urgentEvents.map((e) => [
        e.id,
        `"${e.title.replace(/"/g, '""')}"`,
        e.date,
        `"${e.spaceName}"`,
        `"${e.exceptionalApproval?.requestedBy?.name || ''}"`,
        e.exceptionalApproval?.status || 'pendiente',
        `"${(e.exceptionalApproval?.reason || '').replace(/"/g, '""')}"`,
      ]);
    } else {
      headers = ['Item', 'Valor'];
      rows = [
        ['Total Eventos', activeEvents.length],
        ['Total Tareas', totalTasks],
        ['Tareas Completadas', completedTasks],
        ['Tareas Vencidas', overdueTasks],
        ['Porcentaje Cumplimiento', `${complianceRate}%`],
      ];
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // EXPORTAR A EXCEL (XLSX Compatible XML)
  const handleExportExcel = () => {
    let rowsXml = '';
    const filename = `Reporte_UdeA_${selectedTemplate}_${startDate}.xls`;

    filteredEvents.forEach((e) => {
      rowsXml += `
        <Row>
          <Cell><Data ss:Type="String">${e.id}</Data></Cell>
          <Cell><Data ss:Type="String">${e.title}</Data></Cell>
          <Cell><Data ss:Type="String">${e.date}</Data></Cell>
          <Cell><Data ss:Type="String">${e.startTime} - ${e.endTime}</Data></Cell>
          <Cell><Data ss:Type="String">${e.spaceName}</Data></Cell>
          <Cell><Data ss:Type="String">${e.responsibleName}</Data></Cell>
          <Cell><Data ss:Type="String">${e.status}</Data></Cell>
          <Cell><Data ss:Type="Number">${e.tasks?.length || 0}</Data></Cell>
        </Row>
      `;
    });

    const excelTemplate = `<?xml version="1.0"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      <Worksheet ss:Name="Reporte Institucional">
        <Table>
          <Row>
            <Cell><Data ss:Type="String">ID Evento</Data></Cell>
            <Cell><Data ss:Type="String">Titulo del Evento</Data></Cell>
            <Cell><Data ss:Type="String">Fecha</Data></Cell>
            <Cell><Data ss:Type="String">Horario</Data></Cell>
            <Cell><Data ss:Type="String">Espacio</Data></Cell>
            <Cell><Data ss:Type="String">Responsable</Data></Cell>
            <Cell><Data ss:Type="String">Estado</Data></Cell>
            <Cell><Data ss:Type="String">Tareas Asignadas</Data></Cell>
          </Row>
          ${rowsXml}
        </Table>
      </Worksheet>
    </Workbook>`;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // IMPRESIÓN DIRECTA / PDF DEL INFORME
  const handlePrintPDF = () => {
    window.print();
  };

  // Guardar nueva programación
  const handleCreateSchedule = async () => {
    if (!newSchedName.trim()) return alert('Ingresa un nombre para la programación.');
    await onSaveSchedule({
      name: newSchedName.trim(),
      reportType: newSchedType,
      frequency: newSchedFreq,
      dataPeriod: newSchedPeriod,
      format: newSchedFormat,
      recipientEmail: 'proyectostic.med@udea.edu.co',
      active: true,
      startDate: getBogotaToday(),
    });
    setNewSchedName('');
    setShowScheduleModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Exclusivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Acceso Exclusivo • Superadministrador Institucional
          </div>
          <h1 className="text-xl font-black tracking-tight">
            Centro de Reportes, Informes y Exportaciones
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Generación manual, previsualización, exportación a PDF/Excel/CSV y programación automática
          </p>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center gap-2 bg-white/10 p-1 rounded-2xl border border-white/15">
          <button
            onClick={() => setActiveTab('generacion')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'generacion' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Generación y Exportación
          </button>
          <button
            onClick={() => setActiveTab('programacion')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'programacion' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Programación Automática ({schedules.length})
          </button>
        </div>
      </div>

      {activeTab === 'generacion' ? (
        <div className="space-y-6">
          {/* BARRA DE CONFIGURACIÓN Y FILTROS DEL INFORME */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 print:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Plantilla de Informe</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value as ReportType)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none"
                >
                  <option value="informe_mensual_gestion">F. Informe Mensual de Gestión (Prioritario)</option>
                  <option value="informe_general">A. Informe General de Gestión</option>
                  <option value="informe_equipo">B. Informe por Equipos</option>
                  <option value="informe_persona">C. Informe por Personas</option>
                  <option value="informe_eventos">D. Relación de Eventos</option>
                  <option value="informe_tareas_pendientes">E. Tareas Pendientes y Vencidas</option>
                  <option value="informe_eventos_urgentes">G. Eventos Urgentes y Excepciones 27 Días</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Periodo Evaluado</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="mes_anterior">Mes Calendario Anterior Completo</option>
                  <option value="este_mes">Este Mes Calendario</option>
                  <option value="ultimos_30_dias">Últimos 30 Días (Móvil)</option>
                  <option value="esta_semana">Esta Semana</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Modalidad</label>
                <select
                  value={selectedModality}
                  onChange={(e) => setSelectedModality(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="todos">Todas las modalidades</option>
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>

              {/* Filtro por Equipo */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Filtrar por Equipo</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none font-medium"
                >
                  <option value="todos">Todos los equipos</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Persona */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Filtrar por Persona</label>
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none font-medium"
                >
                  <option value="todos">Todas las personas</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones de Exportación */}
              <div className="flex items-end gap-1.5">
                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                  title="Imprimir o Guardar como PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                  title="Descargar libro de cálculo Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                  title="Descargar datos en formato CSV"
                >
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Chips de Filtros Activos del Informe */}
            {(selectedTeam !== 'todos' || selectedPerson !== 'todos' || selectedModality !== 'todos') && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Filtro aplicado al reporte:</span>
                {selectedTeam !== 'todos' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-xs">
                    Equipo: {groups.find((g) => g.id === selectedTeam)?.name || selectedTeam}
                    <button type="button" onClick={() => setSelectedTeam('todos')} className="hover:text-indigo-900 ml-1 font-black">✕</button>
                  </span>
                )}
                {selectedPerson !== 'todos' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs">
                    Persona: {people.find((p) => p.id === selectedPerson) ? `${people.find((p) => p.id === selectedPerson)?.firstName} ${people.find((p) => p.id === selectedPerson)?.lastName}` : selectedPerson}
                    <button type="button" onClick={() => setSelectedPerson('todos')} className="hover:text-emerald-900 ml-1 font-black">✕</button>
                  </span>
                )}
                {selectedModality !== 'todos' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200 text-xs capitalize">
                    Modalidad: {selectedModality}
                    <button type="button" onClick={() => setSelectedModality('todos')} className="hover:text-sky-900 ml-1 font-black">✕</button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTeam('todos');
                    setSelectedPerson('todos');
                    setSelectedModality('todos');
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold underline ml-2 transition-colors"
                >
                  Restablecer filtros
                </button>
              </div>
            )}
          </div>

          {/* PREVISUALIZACIÓN FORMAL DEL INFORME (DISEÑO INSTITUCIONAL UDEA - SECCIÓN 12) */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6 print:border-none print:shadow-none print:p-0">
            {/* 12.1 Identificación */}
            <div className="border-b-2 border-indigo-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
                  Universidad de Antioquia • Facultad de Medicina
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  {selectedTemplate === 'informe_mensual_gestion'
                    ? 'INFORME MENSUAL DE GESTIÓN Y SEGUIMIENTO OPERATIVO'
                    : selectedTemplate === 'informe_tareas_pendientes'
                    ? 'INFORME DE COMPROMISOS Y TAREAS PENDIENTES'
                    : selectedTemplate === 'informe_eventos_urgentes'
                    ? 'INFORME DE AUTORIZACIONES EXCEPCIONALES Y EVENTOS URGENTES'
                    : 'INFORME INSTITUCIONAL CONSOLIDADO'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periodo analizado: <strong>{startDate} a {endDate} ({periodLabel})</strong>
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <p>Fecha de emisión: {today}</p>
                <p>Destinatario: proyectostic.med@udea.edu.co</p>
              </div>
            </div>

            {/* 12.2 Resumen Ejecutivo */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                1. Resumen Ejecutivo
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Durante el periodo analizado se registraron <strong>{activeEvents.length} eventos activos</strong> y un total de <strong>{totalTasks} tareas programadas</strong> a través de las tres etapas (previa, durante y posterior). Se alcanzó un porcentaje de cumplimiento general del <strong>{complianceRate}%</strong>, con {completedTasks} tareas finalizadas satisfactoriamente.
              </p>
            </div>

            {/* 12.3 & 12.4 Cuadros de Mando: Eventos y Tareas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Eventos Programados</span>
                <p className="text-xl font-black text-slate-900 mt-1">{activeEvents.length}</p>
                <p className="text-[10px] text-slate-500">{cancelledEvents.length} cancelados</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tareas Cumplidas</span>
                <p className="text-xl font-black text-emerald-600 mt-1">{completedTasks}</p>
                <p className="text-[10px] text-slate-500">{complianceRate}% del total</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tareas en Curso / Pend.</span>
                <p className="text-xl font-black text-amber-600 mt-1">{pendingTasks + inProgressTasks}</p>
                <p className="text-[10px] text-slate-500">en seguimiento</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tareas Vencidas</span>
                <p className="text-xl font-black text-rose-600 mt-1">{overdueTasks}</p>
                <p className="text-[10px] text-rose-500">atención inmediata</p>
              </div>
            </div>

            {/* 12.5 & 12.6 Visualización Gráfica del Desempeño y Carga Operativa (Imprimible & Exportable) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Distribución y Gráficos Visuales de Gestión</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium print:hidden">
                  Gráficos vectoriales optimizados para exportación PDF
                </span>
              </div>

              {/* Gráfico 1: Barra Segmentada de Balance Operativo */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Balance Operativo de Compromisos ({totalTasks} tareas totales)</span>
                  <span className="font-mono text-indigo-700 font-bold">{complianceRate}% completado</span>
                </div>

                {/* Segmented Bar */}
                {totalTasks > 0 ? (
                  <div className="w-full h-5 rounded-full overflow-hidden flex bg-slate-200 shadow-inner">
                    <div
                      style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Completadas: ${completedTasks}`}
                    />
                    <div
                      style={{ width: `${(inProgressTasks / totalTasks) * 100}%` }}
                      className="bg-amber-400 h-full transition-all"
                      title={`En curso: ${inProgressTasks}`}
                    />
                    <div
                      style={{
                        width: `${((pendingTasks - overdueTasks > 0 ? pendingTasks - overdueTasks : 0) / totalTasks) * 100}%`,
                      }}
                      className="bg-slate-400 h-full transition-all"
                      title={`Pendientes a tiempo: ${pendingTasks}`}
                    />
                    <div
                      style={{ width: `${(overdueTasks / totalTasks) * 100}%` }}
                      className="bg-rose-500 h-full transition-all"
                      title={`Vencidas: ${overdueTasks}`}
                    />
                  </div>
                ) : (
                  <div className="w-full h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                    Sin tareas registradas en este periodo
                  </div>
                )}

                {/* Leyenda del gráfico */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-600">Completadas:</span>
                    <strong className="text-slate-900 ml-auto">{completedTasks}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-slate-600">En curso:</span>
                    <strong className="text-slate-900 ml-auto">{inProgressTasks}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                    <span className="text-slate-600">Pendientes:</span>
                    <strong className="text-slate-900 ml-auto">{pendingTasks}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-slate-600">Vencidas:</span>
                    <strong className="text-rose-700 ml-auto">{overdueTasks}</strong>
                  </div>
                </div>
              </div>

              {/* Gráficos en Dos Columnas: Carga por Etapas y Rendimiento por Equipos/Personas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gráfico 2: Carga y Avance por Etapas Operativas */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    Carga Operativa por Etapas
                  </span>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Etapa Previa (Planeación)', data: stageStats.previa, color: 'bg-indigo-600' },
                      { label: 'Durante el Evento (Ejecución)', data: stageStats.durante, color: 'bg-teal-600' },
                      { label: 'Etapa Posterior (Cierre y Memorias)', data: stageStats.posterior, color: 'bg-amber-500' },
                    ].map((stg, idx) => {
                      const pct = stg.data.total > 0 ? Math.round((stg.data.completed / stg.data.total) * 100) : 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-600">{stg.label}</span>
                            <span className="text-slate-900 font-bold font-mono">
                              {stg.data.completed} / {stg.data.total} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full ${stg.color} transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gráfico 3: Desempeño por Equipos o Personas Activas */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    {selectedTeam !== 'todos' ? 'Compromisos de Miembros del Equipo' : 'Carga por Equipos de Trabajo'}
                  </span>

                  {reportTeamStats.length > 0 ? (
                    <div className="space-y-2.5">
                      {reportTeamStats.slice(0, 4).map((tm) => (
                        <div key={tm.id} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-700 truncate max-w-[170px]" title={tm.name}>
                              {tm.name}
                            </span>
                            <span className="text-slate-900 font-bold font-mono text-[11px]">
                              {tm.completedTasks}/{tm.totalTasks} ({tm.rate}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${tm.rate}%`, backgroundColor: tm.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : reportPersonStats.length > 0 ? (
                    <div className="space-y-2.5">
                      {reportPersonStats.slice(0, 4).map((psn) => (
                        <div key={psn.id} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-700 truncate max-w-[170px]" title={psn.name}>
                              {psn.name}
                            </span>
                            <span className="text-slate-900 font-bold font-mono text-[11px]">
                              {psn.completed}/{psn.total} ({psn.rate}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                              style={{ width: `${psn.rate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      No hay suficientes datos de equipos o personas en el periodo seleccionado.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 12.7 Comparación con el Periodo Anterior */}
            {prevStartDate && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                  2. Comparativa con el Periodo Anterior ({prevStartDate} a {prevEndDate})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-indigo-100">
                    <span>Variación en Eventos Totales:</span>
                    <strong className={diffEvents >= 0 ? 'text-emerald-600' : 'text-slate-600'}>
                      {diffEvents >= 0 ? `+${diffEvents}` : diffEvents} eventos
                    </strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-indigo-100">
                    <span>Variación en Tareas Completadas:</span>
                    <strong className={diffTasks >= 0 ? 'text-emerald-600' : 'text-slate-600'}>
                      {diffTasks >= 0 ? `+${diffTasks}` : diffTasks} tareas
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* 12.8 Alertas y Aspectos por Atender */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                3. Alertas y Aspectos por Atender
              </h3>
              {overdueTasks > 0 ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    Existen <strong>{overdueTasks} tareas con fecha límite vencida</strong> que no han sido marcadas como completadas. Se detallan en la tabla de anexos.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No se presentan tareas vencidas no resueltas en el periodo analizado.</span>
                </div>
              )}
            </div>

            {/* 12.9 Recomendaciones para el Siguiente Periodo */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
              <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                4. Recomendaciones Basadas en Reglas y Datos
              </h3>
              <ul className="text-xs text-amber-900 space-y-1 list-disc pl-5">
                {recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* 12.10 Anexos: Tabla de Eventos y Tareas */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                5. Anexos: Registro Detallado de Actividades
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Evento</th>
                      <th className="py-2 px-3">Espacio / Modalidad</th>
                      <th className="py-2 px-3">Responsable</th>
                      <th className="py-2 px-3">Estado</th>
                      <th className="py-2 px-3 text-right">Tareas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEvents.slice(0, 25).map((e) => (
                      <tr key={e.id}>
                        <td className="py-2 px-3 font-mono text-[11px]">{e.date}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{e.title}</td>
                        <td className="py-2 px-3">{e.spaceName} ({e.isVirtual ? 'Virtual' : 'Presencial'})</td>
                        <td className="py-2 px-3">{e.responsibleName}</td>
                        <td className="py-2 px-3 capitalize">{e.status}</td>
                        <td className="py-2 px-3 text-right font-bold text-indigo-700">
                          {e.tasks?.filter((t) => t.status === 'completada').length || 0} / {e.tasks?.length || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PESTAÑA 2: PROGRAMACIÓN AUTOMÁTICA DE REPORTES (SECCIÓN 11) */
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Programaciones Periódicas de Informes</h3>
              <p className="text-xs text-slate-500">
                Los reportes programados se envían automáticamente al correo <code>proyectostic.med@udea.edu.co</code> sin depender de que un navegador esté abierto.
              </p>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="py-2 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Programación</span>
            </button>
          </div>

          {/* Listado de Programaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {schedules.map((sched) => (
              <div key={sched.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase">
                      {sched.frequency}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{sched.name}</h4>
                    <p className="text-xs text-slate-500">Tipo: {sched.reportType.replace(/_/g, ' ')}</p>
                  </div>
                  <button
                    onClick={() => onDeleteSchedule(sched.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p><strong>Destinatario:</strong> {sched.recipientEmail}</p>
                  <p><strong>Formato:</strong> {sched.format.toUpperCase()}</p>
                  <p><strong>Periodo cubierto:</strong> {sched.dataPeriod.replace(/_/g, ' ')}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Crear Programación */}
          {showScheduleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Programar Envío Automático</h3>
                  <button onClick={() => setShowScheduleModal(false)}>✕</button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nombre de la Programación</label>
                    <input
                      type="text"
                      placeholder="ej: Informe Mensual al Inicio de Mes"
                      value={newSchedName}
                      onChange={(e) => setNewSchedName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Plantilla</label>
                    <select
                      value={newSchedType}
                      onChange={(e) => setNewSchedType(e.target.value as ReportType)}
                      className="w-full rounded-xl border border-slate-200 p-2"
                    >
                      <option value="informe_mensual_gestion">Informe Mensual de Gestión</option>
                      <option value="informe_tareas_pendientes">Resumen de Tareas Pendientes</option>
                      <option value="informe_general">Informe General</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Frecuencia</label>
                      <select
                        value={newSchedFreq}
                        onChange={(e) => setNewSchedFreq(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 p-2"
                      >
                        <option value="mensual">Mensual</option>
                        <option value="semanal">Semanal</option>
                        <option value="diaria">Diaria</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Formato</label>
                      <select
                        value={newSchedFormat}
                        onChange={(e) => setNewSchedFormat(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 p-2"
                      >
                        <option value="pdf">PDF</option>
                        <option value="xlsx">Excel (.xlsx)</option>
                        <option value="csv">CSV</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button onClick={() => setShowScheduleModal(false)} className="px-3 py-1.5 text-xs text-slate-600">
                    Cancelar
                  </button>
                  <button onClick={handleCreateSchedule} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                    Guardar Programación
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
