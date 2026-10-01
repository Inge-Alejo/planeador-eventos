// Test Suite Automatizado para las Funcionalidades Críticas de EventFlow
import assert from 'node:assert';

// 1. Algoritmo de solapamiento de intervalos
function timeStringToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function doIntervalsOverlap(startA, endA, startB, endB) {
  const a1 = timeStringToMinutes(startA);
  const a2 = timeStringToMinutes(endA);
  const b1 = timeStringToMinutes(startB);
  const b2 = timeStringToMinutes(endB);
  return Math.max(a1, b1) < Math.min(a2, b2);
}

function isVirtualSpace(space) {
  if (!space) return false;
  if (space.isVirtual) return true;
  const name = (space.name || '').toLowerCase();
  const loc = (space.location || '').toLowerCase();
  return (
    name.includes('virtual') ||
    name.includes('teams') ||
    name.includes('meet') ||
    name.includes('zoom') ||
    loc.includes('virtual')
  );
}

// 2. Motor de Conflictos
function detectConflicts({ eventId, date, startTime, endTime, spaceId, peopleIds = [], existingEvents = [], spaces = [], isVirtual = false }) {
  const conflicts = [];
  const dayEvents = existingEvents.filter(
    (e) => e.date === date && e.id !== eventId && e.status !== 'cancelado'
  );

  const targetSpace = spaces.find((s) => s.id === spaceId);
  const isTargetVirtual = isVirtual || isVirtualSpace(targetSpace);

  // Conflicto de Espacio (Solo si no es virtual)
  if (spaceId && !isTargetVirtual) {
    const spaceConflict = dayEvents.find(
      (e) => e.spaceId === spaceId && !e.isVirtual && !isVirtualSpace(spaces.find((s) => s.id === e.spaceId)) && doIntervalsOverlap(startTime, endTime, e.startTime, e.endTime)
    );

    if (spaceConflict) {
      conflicts.push({
        severity: 'bloqueo',
        type: 'espacio',
        conflictingEventId: spaceConflict.id,
        title: 'Espacio no disponible (Cruce presencial)',
      });
    }
  }

  // Conflicto de Personas
  peopleIds.forEach((pid) => {
    const personConflict = dayEvents.find(
      (e) => Array.isArray(e.peopleIds) && e.peopleIds.includes(pid) && doIntervalsOverlap(startTime, endTime, e.startTime, e.endTime)
    );
    if (personConflict) {
      conflicts.push({
        severity: 'conflicto',
        type: 'persona',
        personId: pid,
        conflictingEventId: personConflict.id,
        title: 'Persona no disponible',
      });
    }
  });

  return {
    hasBlockingConflicts: conflicts.some((c) => c.severity === 'bloqueo'),
    hasWarnings: conflicts.some((c) => c.severity === 'conflicto'),
    conflicts,
  };
}

console.log('--- INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS DE EVENTFLOW ---');

// PRUEBA 1: Solapamiento temporal matemático
console.log('✓ Prueba 1: Evaluación matemática de solapamientos horarios');
assert.strictEqual(doIntervalsOverlap('10:00', '12:00', '11:00', '13:00'), true, 'Debe detectar solapamiento parcial');
assert.strictEqual(doIntervalsOverlap('10:00', '12:00', '12:00', '14:00'), false, 'Eventos contiguos NO deben solaparse');
assert.strictEqual(doIntervalsOverlap('08:00', '10:00', '11:00', '12:00'), false, 'Eventos disjuntos NO deben solaparse');
assert.strictEqual(doIntervalsOverlap('09:00', '17:00', '10:00', '11:00'), true, 'Evento contenido completamente debe solaparse');

// PRUEBA 2: Detección estricta de conflicto de espacio (Nivel Bloqueo)
console.log('✓ Prueba 2: Detección estricta de conflicto de espacio');
const mockExistingEvents = [
  {
    id: 'evt-100',
    title: 'Conferencia de Innovación',
    date: '2026-10-15',
    startTime: '10:00',
    endTime: '12:00',
    spaceId: 'auditorio-1',
    peopleIds: ['juan-perez'],
    status: 'confirmado',
  },
];

const spaceConflictTest = detectConflicts({
  date: '2026-10-15',
  startTime: '11:00',
  endTime: '13:00',
  spaceId: 'auditorio-1',
  peopleIds: [],
  existingEvents: mockExistingEvents,
});

assert.strictEqual(spaceConflictTest.hasBlockingConflicts, true);
assert.strictEqual(spaceConflictTest.conflicts[0].type, 'espacio');
assert.strictEqual(spaceConflictTest.conflicts[0].severity, 'bloqueo');

// PRUEBA 3: Detección de conflicto de persona simultánea
console.log('✓ Prueba 3: Detección de simultaneidad de personas');
const personConflictTest = detectConflicts({
  date: '2026-10-15',
  startTime: '10:30',
  endTime: '11:30',
  spaceId: 'estudio-2', // Espacio libre, pero la persona está ocupada
  peopleIds: ['juan-perez'],
  existingEvents: mockExistingEvents,
});

assert.strictEqual(personConflictTest.hasBlockingConflicts, false);
assert.strictEqual(personConflictTest.hasWarnings, true);
assert.strictEqual(personConflictTest.conflicts[0].type, 'persona');
assert.strictEqual(personConflictTest.conflicts[0].personId, 'juan-perez');

// PRUEBA 4: Evento sin conflicto
console.log('✓ Prueba 4: Aprobación sin conflicto para espacio y personas libres');
const cleanTest = detectConflicts({
  date: '2026-10-15',
  startTime: '14:00',
  endTime: '16:00',
  spaceId: 'auditorio-1',
  peopleIds: ['juan-perez'],
  existingEvents: mockExistingEvents,
});

assert.strictEqual(cleanTest.hasBlockingConflicts, false);
assert.strictEqual(cleanTest.hasWarnings, false);
assert.strictEqual(cleanTest.conflicts.length, 0);

// PRUEBA 5: Eventos Virtuales simultáneos permitidos sin bloqueo de espacio
console.log('✓ Prueba 5: Simultaneidad de eventos virtuales permitida a la misma hora');
const mockSpaces = [
  { id: 'auditorio-1', name: 'Auditorio Mayor', isVirtual: false },
  { id: 'espacio-virtual', name: 'Espacio Virtual / Teams', isVirtual: true },
];

const mockVirtualEvents = [
  {
    id: 'evt-virtual-1',
    title: 'Clase Virtual Teams Grupo A',
    date: '2026-10-15',
    startTime: '10:00',
    endTime: '12:00',
    spaceId: 'espacio-virtual',
    isVirtual: true,
    peopleIds: ['profesor-1'],
    status: 'confirmado',
  },
];

const simultaneousVirtualTest = detectConflicts({
  date: '2026-10-15',
  startTime: '10:00',
  endTime: '12:00',
  spaceId: 'espacio-virtual',
  isVirtual: true,
  peopleIds: ['profesor-2'],
  existingEvents: mockVirtualEvents,
  spaces: mockSpaces,
});

assert.strictEqual(simultaneousVirtualTest.hasBlockingConflicts, false, 'Eventos virtuales deben permitir simultaneidad');
assert.strictEqual(simultaneousVirtualTest.conflicts.length, 0, 'No debe haber conflicto de espacio para eventos virtuales');

console.log('✅ TODAS LAS PRUEBAS AUTOMATIZADAS PASARON EXITOSAMENTE (100% OK)');
