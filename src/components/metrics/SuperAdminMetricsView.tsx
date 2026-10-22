// Módulo Exclusivo de Métricas y Seguimiento Institucional
// Acceso restringido exclusivamente a la cuenta de Superadministrador (proyectostic.med@udea.edu.co)

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Building2,
  Calendar,
  Filter,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import {
  EventEntity,
  Space,
  Person,
  PeopleGroup,
  EventTask,
  EventTaskStage,
  EventTaskStatus,
  EventStatus,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { isInstitutionalSuperAdmin } from '../../services/businessRules';
import { getBogotaToday } from '../../lib/timezone';

interface SuperAdminMetricsViewProps {
  events: EventEntity[];
  spaces: Space[];
  people: Person[];
  groups: PeopleGroup[];
  onSelectEvent?: (eventId: string) => void;
}

export type TimeFilterPeriod =
  | 'hoy'
  | 'ayer'
  | 'esta_semana'
  | 'semana_anterior'
  | 'este_mes'
  | 'mes_anterior'
  | 'ultimos_30_dias'
  | 'ultimos_90_dias'
  | 'este_ano'
  | 'personalizado';

export const SuperAdminMetricsView: React.FC<SuperAdminMetricsViewProps> = ({
  events,
  spaces,
  people,
  groups,
}) => {
  const { user } = useAuth();
  const isSuperAdmin = isInstitutionalSuperAdmin(user);

  // Filtros
  const [period, setPeriod] = useState<TimeFilterPeriod>('este_mes');
  const [startDateCustom, setStartDateCustom] = useState('');
  const [endDateCustom, setEndDateCustom] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('todos');
  const [selectedPerson, setSelectedPerson] = useState<string>('todos');
  const [selectedModality, setSelectedModality] = useState<'todos' | 'presencial' | 'virtual'>('todos');
  const [selectedEventType, setSelectedEventType] = useState<string>('todos');
  const [selectedTaskStage, setSelectedTaskStage] = useState<'todos' | EventTaskStage>('todos');

  // Si no es el Superadministrador Institucional, bloquear acceso
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Módulo Restringido</h2>
        <p className="max-w-md text-sm text-slate-600 mt-2 leading-relaxed">
          El panel de <strong>Métricas y Seguimiento Institucional</strong> está reservado de manera exclusiva para la cuenta oficial del Superadministrador (<code>proyectostic.med@udea.edu.co</code>).
        </p>
      </div>
    );
  }

  // Cálculo de rangos de fechas en America/Bogota
  const today = getBogotaToday();

  const { dateRangeStart, dateRangeEnd, prevDateRangeStart, prevDateRangeEnd } = useMemo(() => {
    const [y, m, d] = today.split('-').map(Number);
    const now = new Date(Date.UTC(y, m - 1, d));

    let start = today;
    let end = today;
    let prevStart = today;
    let prevEnd = today;

    if (period === 'hoy') {
      start = today;
      end = today;
      const prevD = new Date(now);
      prevD.setUTCDate(prevD.getUTCDate() - 1);
      prevStart = prevD.toISOString().slice(0, 10);
      prevEnd = prevStart;
    } else if (period === 'ayer') {
      const yDate = new Date(now);
      yDate.setUTCDate(yDate.getUTCDate() - 1);
      start = yDate.toISOString().slice(0, 10);
      end = start;
      const bDate = new Date(now);
      bDate.setUTCDate(bDate.getUTCDate() - 2);
      prevStart = bDate.toISOString().slice(0, 10);
      prevEnd = prevStart;
    } else if (period === 'esta_semana') {
      const dayOfWeek = now.getUTCDay() || 7; // Lunes = 1
      const mon = new Date(now);
      mon.setUTCDate(mon.getUTCDate() - dayOfWeek + 1);
      const sun = new Date(mon);
      sun.setUTCDate(sun.getUTCDate() + 6);
      start = mon.toISOString().slice(0, 10);
      end = sun.toISOString().slice(0, 10);

      const pMon = new Date(mon);
      pMon.setUTCDate(pMon.getUTCDate() - 7);
      const pSun = new Date(pMon);
      pSun.setUTCDate(pSun.getUTCDate() + 6);
      prevStart = pMon.toISOString().slice(0, 10);
      prevEnd = pSun.toISOString().slice(0, 10);
    } else if (period === 'semana_anterior') {
      const dayOfWeek = now.getUTCDay() || 7;
      const pMon = new Date(now);
      pMon.setUTCDate(pMon.getUTCDate() - dayOfWeek - 6);
      const pSun = new Date(pMon);
      pSun.setUTCDate(pSun.getUTCDate() + 6);
      start = pMon.toISOString().slice(0, 10);
      end = pSun.toISOString().slice(0, 10);

      const ppMon = new Date(pMon);
      ppMon.setUTCDate(ppMon.getUTCDate() - 7);
      const ppSun = new Date(ppMon);
      ppSun.setUTCDate(ppSun.getUTCDate() + 6);
      prevStart = ppMon.toISOString().slice(0, 10);
      prevEnd = ppSun.toISOString().slice(0, 10);
    } else if (period === 'este_mes') {
      start = `${yearMonthStr(now)}-01`;
      const nextMonth = new Date(Date.UTC(y, m, 0));
      end = nextMonth.toISOString().slice(0, 10);

      const prevMonthLast = new Date(Date.UTC(y, m - 1, 0));
      prevStart = `${prevMonthLast.toISOString().slice(0, 7)}-01`;
      prevEnd = prevMonthLast.toISOString().slice(0, 10);
    } else if (period === 'mes_anterior') {
      const prevMonthLast = new Date(Date.UTC(y, m - 1, 0));
      start = `${prevMonthLast.toISOString().slice(0, 7)}-01`;
      end = prevMonthLast.toISOString().slice(0, 10);

      const twoMonthsAgoLast = new Date(Date.UTC(y, m - 2, 0));
      prevStart = `${twoMonthsAgoLast.toISOString().slice(0, 7)}-01`;
      prevEnd = twoMonthsAgoLast.toISOString().slice(0, 10);
    } else if (period === 'ultimos_30_dias') {
      const d30 = new Date(now);
      d30.setUTCDate(d30.getUTCDate() - 30);
      start = d30.toISOString().slice(0, 10);
      end = today;

      const p60 = new Date(d30);
      p60.setUTCDate(p60.getUTCDate() - 30);
      prevStart = p60.toISOString().slice(0, 10);
      prevEnd = start;
    } else if (period === 'ultimos_90_dias') {
      const d90 = new Date(now);
      d90.setUTCDate(d90.getUTCDate() - 90);
      start = d90.toISOString().slice(0, 10);
      end = today;

      const p180 = new Date(d90);
      p180.setUTCDate(p180.getUTCDate() - 90);
      prevStart = p180.toISOString().slice(0, 10);
      prevEnd = start;
    } else if (period === 'este_ano') {
      start = `${y}-01-01`;
      end = `${y}-12-31`;
      prevStart = `${y - 1}-01-01`;
      prevEnd = `${y - 1}-12-31`;
    } else {
      start = startDateCustom || today;
      end = endDateCustom || today;
      prevStart = start;
      prevEnd = end;
    }

    return {
      dateRangeStart: start,
      dateRangeEnd: end,
      prevDateRangeStart: prevStart,
      prevDateRangeEnd: prevEnd,
    };
  }, [period, today, startDateCustom, endDateCustom]);

  function yearMonthStr(d: Date) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  // Filtrado de eventos del periodo
  const periodEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.date < dateRangeStart || e.date > dateRangeEnd) return false;
      if (selectedModality === 'presencial' && e.isVirtual) return false;
      if (selectedModality === 'virtual' && !e.isVirtual) return false;
      if (selectedEventType !== 'todos' && e.type !== selectedEventType) return false;

      if (selectedPerson !== 'todos') {
        const hasPerson =
          e.responsibleId === selectedPerson ||
          (Array.isArray(e.peopleIds) && e.peopleIds.includes(selectedPerson)) ||
          (e.tasks && e.tasks.some((t) => t.responsibleIds?.includes(selectedPerson)));
        if (!hasPerson) return false;
      }

      if (selectedGroup !== 'todos') {
        const group = groups.find((g) => g.id === selectedGroup);
        if (group && group.memberIds) {
          const hasMember =
            group.memberIds.includes(e.responsibleId) ||
            group.memberIds.some((mId) => e.peopleIds?.includes(mId)) ||
            (e.tasks && e.tasks.some((t) => t.responsibleIds?.some((rId) => group.memberIds.includes(rId))));
          if (!hasMember) return false;
        }
      }

      return true;
    });
  }, [events, dateRangeStart, dateRangeEnd, selectedModality, selectedEventType, selectedPerson, selectedGroup, groups]);

  // Eventos del periodo anterior para comparativa
  const prevPeriodEvents = useMemo(() => {
    return events.filter((e) => e.date >= prevDateRangeStart && e.date <= prevDateRangeEnd);
  }, [events, prevDateRangeStart, prevDateRangeEnd]);

  // Consolidado de todas las tareas del periodo
  const periodTasks = useMemo(() => {
    const list: EventTask[] = [];
    periodEvents.forEach((e) => {
      (e.tasks || []).forEach((t) => {
        if (selectedTaskStage === 'todos' || t.stage === selectedTaskStage) {
          list.push(t);
        }
      });
    });
    return list;
  }, [periodEvents, selectedTaskStage]);

  const prevPeriodTasks = useMemo(() => {
    const list: EventTask[] = [];
    prevPeriodEvents.forEach((e) => {
      (e.tasks || []).forEach((t) => list.push(t));
    });
    return list;
  }, [prevPeriodEvents]);

  // Métricas Clave
  const totalEvents = periodEvents.length;
  const activeEvents = periodEvents.filter((e) => e.status !== 'cancelado');
  const completedEvents = periodEvents.filter((e) => e.status === 'finalizado');
  const upcomingEvents = periodEvents.filter((e) => e.status === 'programado' || e.status === 'confirmado');
  const cancelledEvents = periodEvents.filter((e) => e.status === 'cancelado');
  const urgentPendingEvents = periodEvents.filter(
    (e) => e.status === 'pendiente_autorizacion' || e.exceptionalApproval?.status === 'pendiente'
  );

  const totalTasksCount = periodTasks.length;
  const completedTasksCount = periodTasks.filter((t) => t.status === 'completada').length;
  const inProgressTasksCount = periodTasks.filter((t) => t.status === 'en_curso').length;
  const pendingTasksCount = periodTasks.filter((t) => t.status === 'pendiente').length;

  // Tareas vencidas: fecha de vencimiento menor a hoy y no completada
  const overdueTasksCount = periodTasks.filter((t) => {
    if (t.status === 'completada' || t.status === 'cancelada') return false;
    return t.dueDate < today;
  }).length;

  const complianceRate =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 100;

  // Comparativa con periodo anterior
  const diffEvents = totalEvents - prevPeriodEvents.length;
  const diffTasksCompleted = completedTasksCount - prevPeriodTasks.filter((t) => t.status === 'completada').length;

  // Métricas por Equipos
  const teamMetrics = useMemo(() => {
    return groups.map((g) => {
      const teamEvents = activeEvents.filter((e) => {
        return (
          g.memberIds.includes(e.responsibleId) ||
          g.memberIds.some((mId) => e.peopleIds?.includes(mId))
        );
      });

      const teamTasks = periodTasks.filter((t) =>
        t.responsibleIds?.some((rId) => g.memberIds.includes(rId))
      );

      const completed = teamTasks.filter((t) => t.status === 'completada').length;
      const overdue = teamTasks.filter((t) => t.status !== 'completada' && t.dueDate < today).length;
      const rate = teamTasks.length > 0 ? Math.round((completed / teamTasks.length) * 100) : 100;

      return {
        id: g.id,
        name: g.name,
        membersCount: g.memberIds.length,
        eventsCount: teamEvents.length,
        totalTasks: teamTasks.length,
        completedTasks: completed,
        pendingTasks: teamTasks.filter((t) => t.status === 'pendiente' || t.status === 'en_curso').length,
        overdueTasks: overdue,
        complianceRate: rate,
      };
    });
  }, [groups, activeEvents, periodTasks, today]);

  // Métricas por Persona
  const personMetrics = useMemo(() => {
    return people.slice(0, 15).map((p) => {
      const pEvents = activeEvents.filter(
        (e) => e.responsibleId === p.id || e.peopleIds?.includes(p.id)
      );
      const pTasks = periodTasks.filter((t) => t.responsibleIds?.includes(p.id));
      const completed = pTasks.filter((t) => t.status === 'completada').length;
      const overdue = pTasks.filter((t) => t.status !== 'completada' && t.dueDate < today).length;
      const rate = pTasks.length > 0 ? Math.round((completed / pTasks.length) * 100) : 100;

      return {
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        roleTitle: p.roleTitle || p.department,
        eventsCount: pEvents.length,
        tasksCount: pTasks.length,
        completedTasks: completed,
        pendingTasks: pTasks.filter((t) => t.status === 'pendiente' || t.status === 'en_curso').length,
        overdueTasks: overdue,
        complianceRate: rate,
      };
    });
  }, [people, activeEvents, periodTasks, today]);

  // Seguimiento por Etapas de Eventos (Previas, Durante, Posteriores)
  const stageStats = useMemo(() => {
    const previa = periodTasks.filter((t) => t.stage === 'previa');
    const durante = periodTasks.filter((t) => t.stage === 'durante');
    const posterior = periodTasks.filter((t) => t.stage === 'posterior');

    return {
      previa: {
        total: previa.length,
        completed: previa.filter((t) => t.status === 'completada').length,
        overdue: previa.filter((t) => t.status !== 'completada' && t.dueDate < today).length,
      },
      durante: {
        total: durante.length,
        completed: durante.filter((t) => t.status === 'completada').length,
        overdue: durante.filter((t) => t.status !== 'completada' && t.dueDate < today).length,
      },
      posterior: {
        total: posterior.length,
        completed: posterior.filter((t) => t.status === 'completada').length,
        overdue: posterior.filter((t) => t.status !== 'completada' && t.dueDate < today).length,
      },
    };
  }, [periodTasks, today]);

  return (
    <div className="space-y-6">
      {/* Encabezado Exclusivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Acceso Exclusivo • Superadministrador Institucional
          </div>
          <h1 className="text-xl font-black tracking-tight">
            Tablero de Métricas, Rendimiento y Seguimiento
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Facultad de Medicina • Universidad de Antioquia • Zona Horaria: America/Bogota
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-white/10 px-3.5 py-2 rounded-2xl border border-white/15">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Periodo: <strong>{dateRangeStart}</strong> a <strong>{dateRangeEnd}</strong></span>
        </div>
      </div>

      {/* BARRA DE FILTROS GLOBALES */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            Filtros Globales de Indicadores
          </span>
          <span className="text-[11px] text-slate-400">
            Los cálculos excluyen eventos y tareas canceladas de forma consistente
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
          {/* Periodo */}
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Rango Temporal</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as TimeFilterPeriod)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
            >
              <option value="este_mes">Este Mes (Calendario)</option>
              <option value="mes_anterior">Mes Anterior Completo</option>
              <option value="ultimos_30_dias">Últimos 30 Días (Móvil)</option>
              <option value="esta_semana">Esta Semana</option>
              <option value="semana_anterior">Semana Anterior</option>
              <option value="hoy">Hoy</option>
              <option value="ayer">Ayer</option>
              <option value="ultimos_90_dias">Últimos 90 Días</option>
              <option value="este_ano">Este Año Completo</option>
              <option value="personalizado">Rango Personalizado</option>
            </select>
          </div>

          {/* Modalidad */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Modalidad</label>
            <select
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="todos">Todas</option>
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>

          {/* Equipo */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Equipo</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="todos">Todos los equipos</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Etapa */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Etapa de Tarea</label>
            <select
              value={selectedTaskStage}
              onChange={(e) => setSelectedTaskStage(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="todos">Todas las etapas</option>
              <option value="previa">Previa</option>
              <option value="durante">Durante</option>
              <option value="posterior">Posterior</option>
            </select>
          </div>

          {/* Tipo de Evento */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Tipo de Evento</label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:outline-none capitalize"
            >
              <option value="todos">Todos los tipos</option>
              <option value="academico">Académico</option>
              <option value="simposio">Simposio</option>
              <option value="curso">Curso</option>
              <option value="transmision">Transmisión</option>
              <option value="catedra">Cátedra</option>
              <option value="congreso">Congreso</option>
              <option value="grabacion">Grabación</option>
              <option value="institucional">Institucional</option>
            </select>
          </div>
        </div>

        {period === 'personalizado' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-600 font-semibold">Desde:</span>
            <input
              type="date"
              value={startDateCustom}
              onChange={(e) => setStartDateCustom(e.target.value)}
              className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs"
            />
            <span className="text-xs text-slate-600 font-semibold">Hasta:</span>
            <input
              type="date"
              value={endDateCustom}
              onChange={(e) => setEndDateCustom(e.target.value)}
              className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs"
            />
          </div>
        )}
      </div>

      {/* TARJETAS DE INDICADORES GENERALES (KPIS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Eventos */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Eventos Totales</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalEvents}</span>
            <span className={`text-[11px] font-bold flex items-center ${diffEvents >= 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
              {diffEvents >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(diffEvents)} vs ant.
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="text-emerald-700 font-semibold">{upcomingEvents.length} programados</span>
            <span>•</span>
            <span className="text-rose-600 font-semibold">{cancelledEvents.length} cancelados</span>
          </div>
        </div>

        {/* Tareas Totales y % Cumplimiento */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cumplimiento Tareas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{complianceRate}%</span>
            <span className="text-[11px] font-bold text-slate-500">
              {completedTasksCount}/{totalTasksCount} listas
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${complianceRate}%` }} />
          </div>
        </div>

        {/* Tareas Vencidas */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Tareas Vencidas</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{overdueTasksCount}</span>
            <span className="text-[11px] text-slate-400">requieren atención</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {inProgressTasksCount} en curso • {pendingTasksCount} pendientes
          </p>
        </div>

        {/* Excepciones de 27 Días */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Autorizaciones Urgentes</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{urgentPendingEvents.length}</span>
            <span className="text-[11px] text-slate-400">pendientes</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Regla de 27 días presenciales evaluada
          </p>
        </div>
      </div>

      {/* SEGUIMIENTO DE ETAPAS DEL EVENTO */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Distribución y Cuellos de Botella por Etapas del Evento
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Permite identificar en qué fase (Previa, Durante o Posterior) se concentran los retrasos operativos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Previa */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
              <span>1. Etapa Previa (Preparación)</span>
              <span>{stageStats.previa.total} tareas</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
              <span className="text-emerald-700 font-semibold">{stageStats.previa.completed} completadas</span>
              <span className="text-rose-600 font-semibold">{stageStats.previa.overdue} vencidas</span>
            </div>
          </div>

          {/* Durante */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
              <span>2. Etapa Durante el Evento</span>
              <span>{stageStats.durante.total} tareas</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
              <span className="text-emerald-700 font-semibold">{stageStats.durante.completed} completadas</span>
              <span className="text-rose-600 font-semibold">{stageStats.durante.overdue} vencidas</span>
            </div>
          </div>

          {/* Posterior */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
              <span>3. Etapa Posterior (Cierre)</span>
              <span>{stageStats.posterior.total} tareas</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
              <span className="text-emerald-700 font-semibold">{stageStats.posterior.completed} completadas</span>
              <span className="text-rose-600 font-semibold">{stageStats.posterior.overdue} vencidas</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE RENDIMIENTO POR EQUIPOS */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          Carga de Trabajo y Desempeño por Equipos
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Equipo / Área</th>
                <th className="py-2.5 px-3 text-center">Integrantes</th>
                <th className="py-2.5 px-3 text-center">Eventos</th>
                <th className="py-2.5 px-3 text-center">Tareas Asignadas</th>
                <th className="py-2.5 px-3 text-center">Completadas</th>
                <th className="py-2.5 px-3 text-center">Pendientes</th>
                <th className="py-2.5 px-3 text-center">Vencidas</th>
                <th className="py-2.5 px-3 text-right">% Cumplimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamMetrics.map((tm) => (
                <tr key={tm.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{tm.name}</td>
                  <td className="py-2.5 px-3 text-center">{tm.membersCount}</td>
                  <td className="py-2.5 px-3 text-center font-semibold text-indigo-700">{tm.eventsCount}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">{tm.totalTasks}</td>
                  <td className="py-2.5 px-3 text-center text-emerald-600 font-semibold">{tm.completedTasks}</td>
                  <td className="py-2.5 px-3 text-center text-amber-600 font-semibold">{tm.pendingTasks}</td>
                  <td className="py-2.5 px-3 text-center text-rose-600 font-bold">{tm.overdueTasks}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {tm.complianceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLA DE RENDIMIENTO POR PERSONAS */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-indigo-600" />
          Seguimiento Individual de Responsabilidades y Cumplimiento
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Persona</th>
                <th className="py-2.5 px-3">Cargo / Rol</th>
                <th className="py-2.5 px-3 text-center">Eventos</th>
                <th className="py-2.5 px-3 text-center">Tareas Asignadas</th>
                <th className="py-2.5 px-3 text-center">Completadas</th>
                <th className="py-2.5 px-3 text-center">Pendientes</th>
                <th className="py-2.5 px-3 text-center">Vencidas</th>
                <th className="py-2.5 px-3 text-right">% Cumplimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {personMetrics.map((pm) => (
                <tr key={pm.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{pm.name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{pm.roleTitle}</td>
                  <td className="py-2.5 px-3 text-center font-semibold text-indigo-700">{pm.eventsCount}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">{pm.tasksCount}</td>
                  <td className="py-2.5 px-3 text-center text-emerald-600 font-semibold">{pm.completedTasks}</td>
                  <td className="py-2.5 px-3 text-center text-amber-600 font-semibold">{pm.pendingTasks}</td>
                  <td className="py-2.5 px-3 text-center text-rose-600 font-bold">{pm.overdueTasks}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-indigo-900">{pm.complianceRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
