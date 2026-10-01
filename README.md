# EventFlow Planner PRO
### Sistema Empresarial de Planeación, Programación y Gestión de Eventos en Tiempo Real

Plataforma profesional diseñada para la **gestión centralizada de eventos, visualización de actividades proyectadas, detección matemática de conflictos y control de disponibilidad de espacios físicos y personas convocadas**.

Desarrollada bajo estándares empresariales con arquitectura moderna, reactiva, completamente tipada en **TypeScript**, estilizada con **Tailwind CSS** y optimizada para operar al **100% en capas gratuitas ($0 USD)** mediante **Firebase** y **Vercel**.

---

## 🌟 Características Principales

* 📊 **Centro de Control / Dashboard Interactivo:**
  * 11 tarjetas interactivas de indicadores de gestión con filtrado directo (drill-down).
  * Matriz horizontal de ocupación de espacios (Timeline de Recursos: Espacio vs. Horas del día).
  * Gráficas de distribución por tipo, estado y carga de trabajo por persona.
  * Widget de Alertas y Conflictos prioritarios con acciones de resolución inmediata.
* 📅 **Calendario y Planeador Multivista:**
  * Vistas interactivas de **Mes**, **Semana**, **Día** y **Agenda cronológica**.
  * Creación rápida haciendo clic directamente sobre cualquier fecha o bloque horario.
  * Código de colores distintivo por espacio físico y etiquetas visuales de estado.
* ⚡ **Motor de Detección de Simultaneidad y Conflictos en Vivo:**
  * **Nivel Bloqueo 🔴:** Impide guardar eventos si el espacio físico ya se encuentra reservado en el mismo rango horario. Mensajes humanos claros sin errores crípticos.
  * **Nivel Conflicto 🟠:** Alerta instantáneamente si alguna de las personas convocadas ya tiene programada otra actividad simultánea.
  * **Nivel Advertencia 🟡:** Alerta si el número proyectado de asistentes supera la capacidad máxima recomendada del espacio.
* 🏛️ **Módulo de Espacios Físicos:**
  * Catálogo de auditorios, estudios audiovisuales, salas de juntas, laboratorios y aulas.
  * Indicador de disponibilidad en tiempo real (Disponible / Ocupado en este momento).
  * Agenda de reservas del día por cada espacio.
* 👥 **Módulo de Personas y Convocatorias:**
  * Directorio del equipo con cargo, área de dependencia y total de asignaciones.
* ✉️ **Flujo de Confirmación de Participación por Correo:**
  * Generación automática de solicitud de participación con token criptográfico seguro.
  * Modal interactivo que simula el correo electrónico institucional recibido por la persona.
  * Botones de **Confirmar Asistencia** y **Rechazar Participación** con 1 solo clic.
  * Actualización en vivo del estado en el evento y registro de fecha/hora de respuesta.
* 🔔 **Centro de Notificaciones en Vivo:**
  * Campana con badge animado de alertas no leídas y marcas de tiempo relativo.
* 🛡️ **Seguridad y Control de Acceso RBAC:**
  * Soporte nativo para **Google Sign-In / OpenID Connect**.
  * Selector rápido de roles (`Administrador` vs `Usuario`) integrado en el menú para pruebas inmediatas.
  * Reglas de seguridad declarativas en [firestore.rules](file:///C:/Users/WinterOS/.gemini/antigravity-ide/scratch/eventflow-planner/firestore.rules).
* 📜 **Auditoría y Trazabilidad Inmutable:**
  * Registro de todas las acciones operativas (creación, cambio de horario, cancelación, respuestas).
* 📈 **Centro de Reportes y Exportación:**
  * Exportación de eventos, espacios, personas y auditoría a formato **CSV / Excel** con 1 clic.
* 🇨🇴 **Zona Horaria Estricta:**
  * Configurado para operar sin ambigüedades en **America/Bogota** (UTC-5).

---

## 🛠️ Stack Tecnológico ($0 USD / Enterprise Grade)

* **Frontend:** React 19 + TypeScript 5 + Vite 6
* **Estilos & UI:** Tailwind CSS 3 + Lucide React + Canvas Confetti
* **Tiempo Real & Persistencia:** Firebase Cloud Firestore (SDK v11 modular) + Emulador Local Reactivo sincronizado con `BroadcastChannel`
* **Autenticación:** Firebase Authentication (Google OAuth 2.0 Provider)
* **Testing:** Suite automatizada de aserciones matemáticas con Node.js (`test_core_engine.mjs`)
* **Hosting:** Vercel o Firebase Hosting ($0 USD)

---

## 🚀 Instalación y Ejecución Local

### 1. Clonar o Navegar a la Carpeta
```bash
cd "C:\Users\WinterOS\.gemini\antigravity-ide\scratch\eventflow-planner"
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Ejecutar en Modo Desarrollo
```bash
npm run dev
```
La aplicación iniciará inmediatamente en: **`http://localhost:5173/`**

### 4. Ejecutar Suite de Pruebas Automatizadas
```bash
node test_core_engine.mjs
```

### 5. Compilar para Producción
```bash
npm run build
```

---

## ⚙️ Conexión con Firebase y Google Sign-In (Opcional)

Por defecto, la aplicación incluye un **Motor Reactivo Autónomo** con datos de prueba empresariales que se sincronizan en tiempo real entre múltiples pestañas del navegador sin requerir credenciales externas.

Para conectar tu proyecto real de Firebase:
1. Crea un proyecto gratuito en [Firebase Console](https://console.firebase.google.com/) (Plan Spark - $0).
2. Habilita **Authentication** y activa el proveedor **Google**.
3. Habilita **Cloud Firestore** y copia las reglas de [firestore.rules](file:///C:/Users/WinterOS/.gemini/antigravity-ide/scratch/eventflow-planner/firestore.rules).
4. Crea un archivo `.env` en la raíz del proyecto basándote en [.env.example](file:///C:/Users/WinterOS/.gemini/antigravity-ide/scratch/eventflow-planner/.env.example):
```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_APP_TIMEZONE=America/Bogota
```

---

## 🌐 Despliegue en Línea ($0 USD)

### Opción A: Despliegue en Vercel
1. Sube el proyecto a tu repositorio de GitHub.
2. Ingresa a [Vercel](https://vercel.com/) e importa el repositorio.
3. En la sección *Environment Variables*, agrega las variables de tu archivo `.env`.
4. Haz clic en **Deploy**. Estará en línea con SSL y CDN global en menos de 1 minuto.

### Opción B: Despliegue en Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```
