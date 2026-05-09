import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import hydraAvatar from "./assets/hydra-avatar.png";


const HYDRA_STORAGE_KEY = "hydraTrafficLab.f2.project";
const HYDRA_PROJECTS_KEY = "hydraTrafficLab.f2.projects";
const HYDRA_RESTORE_KEY = "hydraTrafficLab.f2.restorePoints";
const HYDRA_SECTION_KEY = "hydraTrafficLab.f2.activeSection";
const HYDRA_SESSION_KEY = "hydraTrafficLab.f2.session";
const HYDRA_MAX_RESTORE_POINTS = 10;
const HYDRA_SECTIONS = ["Inicio", "Mapa del sistema", "Cruces", "Corredores", "Escenarios", "Informes", "Eventos", "Dispositivos", "Cámaras", "Configuración", "Usuarios", "Sistema"];
const HYDRA_VERSION_LABEL = "F2-V8.3-M1-R25";
const HYDRA_VERSION_SLUG = "f2-v8-3-m1-r25-release";
const DEFAULT_SETTINGS = {
  adaptive: true,
  linkedMode: true,
  autoTraffic: true,
  loopsEnabled: true,
  cameraEnabled: true,
  showCorridor: true,
  showManualLinks: true,
  manualAssist: false,
  dischargeRate: 1,
};
const HYDRA_PERMISSION_LABELS = {
  viewSystem: "Ver sistema",
  operateCrossings: "Operar cruces",
  changePlans: "Cambiar planes",
  editGeometry: "Editar geometría/fases",
  maintainHardware: "Mantenimiento hardware",
  manageUsers: "Administrar usuarios",
  viewReports: "Informes",
};
const HYDRA_ROLES = [
  {
    id: "superadmin",
    name: "Superadministrador",
    pin: "9999",
    description: "Control total del sistema, usuarios, permisos y configuración crítica.",
    permissions: ["viewSystem", "operateCrossings", "changePlans", "editGeometry", "maintainHardware", "manageUsers", "viewReports"],
  },
  {
    id: "admin",
    name: "Administrador",
    pin: "1234",
    description: "Gestión general de cruces, corredores, planes y configuración.",
    permissions: ["viewSystem", "operateCrossings", "changePlans", "editGeometry", "maintainHardware", "manageUsers", "viewReports"],
  },
  {
    id: "supervisor",
    name: "Supervisor",
    pin: "4444",
    description: "Supervisión completa y validación operativa sin administración crítica.",
    permissions: ["viewSystem", "operateCrossings", "changePlans", "viewReports"],
  },
  {
    id: "operator",
    name: "Operador",
    pin: "2222",
    description: "Uso diario, eventos, supervisión y operación permitida.",
    permissions: ["viewSystem", "operateCrossings", "viewReports"],
  },
  {
    id: "engineering",
    name: "Ingeniería",
    pin: "5555",
    description: "Fases, geometría, grupos semafóricos, conflictos y coordinación.",
    permissions: ["viewSystem", "changePlans", "editGeometry", "viewReports"],
  },
  {
    id: "maintenance",
    name: "Mantenimiento",
    pin: "3333",
    description: "Dispositivos, cámaras, lazos, ópticas, hardware y diagnóstico.",
    permissions: ["viewSystem", "maintainHardware", "viewReports"],
  },
  {
    id: "viewer",
    name: "Consulta",
    pin: "0000",
    description: "Solo lectura para informes, eventos e histórico.",
    permissions: ["viewSystem", "viewReports"],
  },
  {
    id: "emergency",
    name: "Emergencia",
    pin: "9110",
    description: "Intervención limitada para situaciones especiales, siempre registrada.",
    permissions: ["viewSystem", "operateCrossings"],
  },
];

const HYDRA_SIMULATED_USER_ACTIVITY = [
  {
    roleId: "admin",
    status: "conectado",
    section: "Inicio",
    summary: "Revisando estado general del proyecto",
    lastAction: "Cambio de plan de demanda en corredor principal",
    time: "hace 2 min",
  },
  {
    roleId: "operator",
    status: "intervencion",
    section: "Cruces",
    summary: "Viendo Cruces",
    lastAction: "Activo modo manual simulado en cruce seleccionado",
    time: "hace 5 min",
  },
  {
    roleId: "maintenance",
    status: "conectado",
    section: "Dispositivos",
    summary: "Revisando Hardware",
    lastAction: "Abrio diagnostico de opticas y fuente 24V",
    time: "hace 8 min",
  },
  {
    roleId: "supervisor",
    status: "consulta",
    section: "Eventos",
    summary: "Consultando Eventos",
    lastAction: "Marco evento de cola larga para seguimiento",
    time: "hace 12 min",
  },
  {
    roleId: "engineering",
    status: "ausente",
    section: "Configuracion",
    summary: "Editando Geometria",
    lastAction: "Preparo preset de geometria T para revision",
    time: "hace 21 min",
  },
];

const HYDRA_SIMULATED_ACTIVITY_LOG = [
  "Administrador cambio plan de demanda",
  "Mantenimiento abrio diagnostico",
  "Operador activo modo manual simulado",
  "Supervisor consulto eventos recientes",
  "Ingenieria reviso geometria del cruce",
];

const HYDRA_PERMISSION_RULES = {
  mapEdit: { permission: "editGeometry", label: "Editar mapa, crear y mover cruces" },
  crossingOperate: { permission: "operateCrossings", label: "Operar cruces y modos del regulador" },
  planChange: { permission: "changePlans", label: "Cambiar planes, coordinacion y ajustes globales" },
  hardware: { permission: "maintainHardware", label: "Gestionar hardware, camaras, lazos y opticas" },
  users: { permission: "manageUsers", label: "Administrar usuarios, proyectos y guardado critico" },
  reports: { permission: "viewReports", label: "Consultar informes, eventos y registros" },
  system: { permission: "viewSystem", label: "Ver estado general del sistema" },
};

const HYDRA_SYSTEM_STATUS_ITEMS = [
  { title: "Frontend local", status: "Servicio activo", tone: "ok", detail: "Vite/React ejecutandose en este equipo." },
  { title: "Persistencia", status: "LocalStorage", tone: "ok", detail: "Proyectos guardados por navegador y equipo." },
  { title: "Multiusuario", status: "Simulado", tone: "warn", detail: "Backend/WebSocket pendiente para usuarios reales." },
  { title: "E/S hardware", status: "Laboratorio", tone: "warn", detail: "Preparado conceptualmente; no conecta a via publica." },
];

const HYDRA_CONFIG_HELP = [
  "Proyectos/ciudades separan cruces, corredores, eventos y ajustes para no mezclar entornos.",
  "Guardado local usa el navegador actual; exportar JSON sigue siendo la copia externa recomendada.",
  "Las acciones criticas quedan bloqueadas por rol desde R25 y dejan aviso en Eventos.",
];

const HYDRA_EVENTS_HELP = [
  "Eventos mezcla registro de acciones, avisos de permisos y comprobaciones del sistema.",
  "Limpiar el registro requiere permiso administrativo porque elimina trazabilidad local.",
  "En una version con backend, esta pantalla sera auditoria con usuario, fecha, equipo y proyecto.",
];

function permissionLabel(permission) {
  return HYDRA_PERMISSION_LABELS[permission] || permission || "permiso";
}

function roleHasPermission(role, permission) {
  if (!permission) return true;
  return Boolean(role?.permissions?.includes(permission));
}

function permissionReason(role, permission) {
  if (!permission) return "";
  const roleName = role?.name || "Sin sesion";
  return `${roleName} no tiene permiso: ${permissionLabel(permission)}.`;
}

function storageAvailable() {
  try {
    const key = "__hydra_storage_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function loadHydraProject() {
  if (typeof window === "undefined" || !storageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(HYDRA_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.crossings)) return null;
    return data;
  } catch (error) {
    console.warn("No se pudo cargar el proyecto local:", error);
    return null;
  }
}

function cleanProjectName(name, fallback = "Proyecto local") {
  const cleaned = String(name || "").trim();
  return cleaned || fallback;
}

function slugProjectName(name) {
  const base = cleanProjectName(name, "proyecto")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return base || "proyecto";
}

function normalizeProjectSnapshot(snapshot = {}) {
  const crossings = Array.isArray(snapshot.crossings) ? snapshot.crossings : [];
  return {
    crossings,
    manualLinks: Array.isArray(snapshot.manualLinks) ? snapshot.manualLinks : [],
    tick: Number.isFinite(Number(snapshot.tick)) ? Number(snapshot.tick) : 0,
    selectedId: snapshot.selectedId || crossings[0]?.id || null,
    corridorIds: Array.isArray(snapshot.corridorIds) ? snapshot.corridorIds : [],
    settings: { ...DEFAULT_SETTINGS, ...(snapshot.settings || {}) },
    log: Array.isArray(snapshot.log) ? snapshot.log : [`${HYDRA_VERSION_LABEL} cargada: guardado multi-proyecto activo.`],
  };
}

function makeProjectFromSnapshot(snapshot = {}, name = "Proyecto local", id = "") {
  const now = new Date().toISOString();
  const displayName = cleanProjectName(name);
  return {
    id: id || `project-${slugProjectName(displayName)}-${Date.now().toString(36)}`,
    name: displayName,
    city: displayName,
    createdAt: snapshot.createdAt || snapshot.savedAt || now,
    updatedAt: snapshot.updatedAt || snapshot.savedAt || now,
    ...normalizeProjectSnapshot(snapshot),
  };
}

function normalizeHydraProject(project, index = 0) {
  if (!project) return makeProjectFromSnapshot({}, `Proyecto ${index + 1}`);
  const name = cleanProjectName(project.name || project.city || `Proyecto ${index + 1}`);
  return {
    ...makeProjectFromSnapshot(project, name, project.id || `project-${slugProjectName(name)}-${index + 1}`),
    name,
    city: cleanProjectName(project.city || name, name),
  };
}

function loadHydraProjects() {
  const fallback = makeProjectFromSnapshot({}, "Proyecto local", "project-local");
  if (typeof window === "undefined" || !storageAvailable()) {
    return { activeProjectId: fallback.id, projects: [fallback], migratedFromLegacy: false };
  }
  try {
    const raw = window.localStorage.getItem(HYDRA_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const projects = Array.isArray(parsed.projects) ? parsed.projects.map(normalizeHydraProject) : [];
      if (projects.length) {
        const activeProjectId = projects.some((project) => project.id === parsed.activeProjectId) ? parsed.activeProjectId : projects[0].id;
        return { activeProjectId, projects, migratedFromLegacy: false, savedAt: parsed.savedAt };
      }
    }
  } catch (error) {
    console.warn("No se pudo cargar la lista de proyectos:", error);
  }

  const legacy = loadHydraProject();
  if (legacy) {
    const project = makeProjectFromSnapshot(legacy, "Proyecto local", "project-local");
    return { activeProjectId: project.id, projects: [project], migratedFromLegacy: true, savedAt: legacy.savedAt };
  }
  return { activeProjectId: fallback.id, projects: [fallback], migratedFromLegacy: false };
}

function saveHydraProjects(bundle) {
  if (typeof window === "undefined" || !storageAvailable()) return false;
  try {
    const projects = Array.isArray(bundle.projects) ? bundle.projects.map((project, index) => normalizeHydraProject(project, index)) : [];
    window.localStorage.setItem(HYDRA_PROJECTS_KEY, JSON.stringify({
      activeProjectId: bundle.activeProjectId || projects[0]?.id || "project-local",
      projects,
      version: HYDRA_VERSION_SLUG,
      savedAt: new Date().toISOString(),
    }));
    return true;
  } catch (error) {
    console.warn("No se pudo guardar la lista de proyectos:", error);
    return false;
  }
}

function updateProjectSnapshot(projects, projectId, snapshot) {
  return projects.map((project) => project.id === projectId ? {
    ...project,
    ...normalizeProjectSnapshot(snapshot),
    updatedAt: new Date().toISOString(),
  } : project);
}

function saveHydraProject(data) {
  if (typeof window === "undefined" || !storageAvailable()) return false;
  try {
    window.localStorage.setItem(HYDRA_STORAGE_KEY, JSON.stringify({
      ...data,
      running: false,
      version: HYDRA_VERSION_SLUG,
      savedAt: new Date().toISOString(),
    }));
    return true;
  } catch (error) {
    console.warn("No se pudo guardar el proyecto local:", error);
    return false;
  }
}

function loadRestorePoints() {
  if (typeof window === "undefined" || !storageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(HYDRA_RESTORE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRestorePoint(label, snapshot) {
  if (typeof window === "undefined" || !storageAvailable()) return false;
  try {
    const point = {
      id: `RP-${Date.now()}`,
      label,
      createdAt: new Date().toISOString(),
      snapshot: { ...snapshot, running: false },
    };
    const next = [point, ...loadRestorePoints()].slice(0, HYDRA_MAX_RESTORE_POINTS);
    window.localStorage.setItem(HYDRA_RESTORE_KEY, JSON.stringify(next));
    return true;
  } catch (error) {
    console.warn("No se pudo crear punto de restauración:", error);
    return false;
  }
}

function clearHydraProjectSave() {
  if (typeof window === "undefined" || !storageAvailable()) return false;
  window.localStorage.removeItem(HYDRA_STORAGE_KEY);
  return true;
}

function clearHydraProjectsSave() {
  if (typeof window === "undefined" || !storageAvailable()) return false;
  window.localStorage.removeItem(HYDRA_PROJECTS_KEY);
  return true;
}

function getRoleById(roleId) {
  return HYDRA_ROLES.find((role) => role.id === roleId) || null;
}

function loadHydraSession() {
  if (typeof window === "undefined" || !storageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(HYDRA_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.roleId || !getRoleById(session.roleId)) return null;
    return session;
  } catch {
    return null;
  }
}

function saveHydraSession(session) {
  if (typeof window === "undefined" || !storageAvailable()) return false;
  window.localStorage.setItem(HYDRA_SESSION_KEY, JSON.stringify(session));
  return true;
}

function clearHydraSession() {
  if (typeof window === "undefined" || !storageAvailable()) return false;
  window.localStorage.removeItem(HYDRA_SESSION_KEY);
  return true;
}

function formatHydraDate(iso) {
  if (!iso) return "sin guardado";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "fecha no válida";
  }
}

function formatHydraTime(iso) {
  if (!iso) return "sin iniciar";
  try {
    return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "hora no valida";
  }
}

const GEOMETRY_OPTIONS = [
  { value: "X", label: "X · Varias vías / intersección completa" },
  { value: "I", label: "I · Vía única de doble sentido" },
  { value: "T", label: "T · Vía principal + secundaria lateral" },
  { value: "ROTONDA", label: "Rotonda / semirotonda" },
  { value: "GIRO_PROTEGIDO", label: "Giro protegido" },
  { value: "PERSONALIZADA", label: "Personalizada" },
];

function geometryValue(geometry) {
  if (!geometry) return "X";
  if (typeof geometry === "string") return geometry;
  if (typeof geometry === "object") return geometry.geometryType || geometry.type || geometry.value || "X";
  return String(geometry);
}

function geometryDisplayLabel(geometry) {
  const value = geometryValue(geometry);
  return GEOMETRY_OPTIONS.find((option) => option.value === value)?.label || value || "X · Varias vías / intersección completa";
}

function geometryLabel(geometry) {
  return geometryDisplayLabel(geometry);
}


function sanitizeCrossingId(value, fallback = "A") {
  const fallbackText = String(fallback || "A");
  const raw = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return raw.length > 0 ? raw : fallbackText;
}

function sanitizeCrossingIdDraft(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}



function makeTechnicalCrossingId(name, fallbackId = "A") {
  const rawInput = String(name || fallbackId || "A").trim();
  const normalized = rawInput
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();

  const skip = new Set(["CRUCE", "NUEVO", "CON", "DE", "DEL", "LA", "EL", "LOS", "LAS"]);
  const tokens = normalized.split(/\s+/).filter(Boolean);

  if (tokens[0] === "NUEVO" && tokens[1] === "CRUCE" && tokens[2]) {
    const suffix = tokens.slice(2).join("-");
    return `C-${suffix}-01`;
  }

  const numberToken = tokens.find((token) => /^\d+$/.test(token));
  const words = tokens.filter((token) => !/^\d+$/.test(token) && !skip.has(token));
  const base = words.length ? words.slice(0, 3).join("-") : String(fallbackId || "A").toUpperCase();
  const number = numberToken ? String(Number(numberToken)).padStart(2, "0") : "01";
  return `C-${base}-${number}`;
}



class RuntimeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Hydra Traffic Lab runtime error:", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.error) {
      return (
        <main className="runtime-error-shell">
          <div className="runtime-error-card">
            <div className="release-tag">Hydra Traffic Lab · diagnóstico de arranque</div>
            <h1>Error al renderizar la interfaz</h1>
            <p>La aplicación ha cargado, pero un componente falló. Copia este mensaje para revisarlo.</p>
            <pre>{String(this.state.error?.stack || this.state.error?.message || this.state.error)}</pre>
            {this.state.info?.componentStack && <pre>{this.state.info.componentStack}</pre>}
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}


const CENTER = [38.5411, -0.1225];
const MAX_QUEUE = 30;
const BASE_GREEN = 22;
const AMBER = 4;
const ALL_RED = 3;

const GEOMETRIES = {
  X: "Intersección en X",
  T: "Cruce en T",
  PEDESTRIAN: "Paso peatonal",
  ROUNDABOUT: "Rotonda / semirotonda",
  PROTECTED_TURN: "Giro protegido",
  MAIN_WITH_TURN: "Vía principal + giro compatible",
  ACCESS: "Acceso simple",
};

const GROUP_TYPES = {
  vehicle: "Vehículos",
  pedestrian: "Peatones",
  bus: "Bus",
  bike: "Bici",
  turn: "Giro protegido",
};

const MOVEMENT_KINDS = {
  through: "Recto / continuidad",
  left_turn: "Giro izquierda",
  right_turn: "Giro derecha",
  transversal_entry: "Entrada transversal",
  pedestrian_crossing: "Paso peatonal",
  warning: "Aviso / preaviso",
  bus_lane: "Carril bus",
  bike_lane: "Carril bici",
  custom: "Personalizada",
};

function defaultMovementKindForType(type) {
  if (type === "pedestrian") return "pedestrian_crossing";
  if (type === "turn") return "left_turn";
  if (type === "bus") return "bus_lane";
  if (type === "bike") return "bike_lane";
  return "through";
}

const HEAD_TYPES = {
  S11: {
    label: "S11 · maniobra de 1 óptica",
    defaultOptics: ["amber"],
    description: "Tipo S11: una óptica. Puede usarse como ámbar/aviso según la instalación.",
  },
  S12: {
    label: "S12 · maniobra de 2 ópticas",
    defaultOptics: ["amber_1", "amber_2"],
    description: "Tipo S12: dos ópticas. Normalmente doble ámbar, pero representa la maniobra de dos luces.",
  },
  S13_RAV: {
    label: "S13 · 3 ópticas R/A/V",
    defaultOptics: ["red", "amber", "green"],
    description: "Tipo S13: tres ópticas configuradas como rojo, ámbar y verde.",
  },
  S13_RAA: {
    label: "S13 · 3 ópticas R/A/A",
    defaultOptics: ["red", "amber_1", "amber_2"],
    description: "Tipo S13: tres ópticas configuradas como rojo, ámbar y ámbar; útil para avisos o pasos especiales.",
  },
  PED_RG: {
    label: "Peatón · rojo/verde",
    defaultOptics: ["ped_red", "ped_green"],
    description: "Maniobra peatonal de dos ópticas.",
  },
  ARROW_RAG: {
    label: "Flecha · rojo/ámbar/verde",
    defaultOptics: ["red_arrow", "amber_arrow", "green_arrow"],
    description: "Maniobra de giro protegido o permitido.",
  },
};

function defaultHeadTypeForGroupType(type) {
  if (type === "pedestrian") return "PED_RG";
  if (type === "turn") return "ARROW_RAG";
  return "S13_RAV";
}

function makeHead(id, name, movement, groupType = "vehicle", headType = defaultHeadTypeForGroupType(groupType)) {
  return {
    id,
    name,
    movement,
    groupType,
    headType,
    optics: [...(HEAD_TYPES[headType]?.defaultOptics || ["red", "amber", "green"])],
  };
}

function headStateFromGroupState(head, groupState) {
  if (groupState === "green") {
    if (head.optics.includes("green")) return "green";
    if (head.optics.includes("green_arrow")) return "green_arrow";
    if (head.optics.includes("ped_green")) return "ped_green";
    if (head.optics.includes("amber")) return "amber";
    if (head.optics.includes("amber_1")) return "amber_1";
    return head.optics[0] || "off";
  }

  if (groupState === "amber") {
    if (head.optics.includes("amber")) return "amber";
    if (head.optics.includes("amber_arrow")) return "amber_arrow";
    if (head.optics.includes("amber_1")) return "amber_1";
    if (head.optics.includes("amber_2")) return "amber_2";
    return headStateFromGroupState(head, "red");
  }

  if (head.optics.includes("red")) return "red";
  if (head.optics.includes("red_arrow")) return "red_arrow";
  if (head.optics.includes("ped_red")) return "ped_red";
  if (head.optics.includes("amber")) return "amber";
  if (head.optics.includes("amber_1")) return "amber_1";
  return head.optics[0] || "off";
}

function lightColorForOptic(optic) {
  if (String(optic).includes("green")) return "#22c55e";
  if (String(optic).includes("amber")) return "#f59e0b";
  if (String(optic).includes("red")) return "#ef4444";
  return "#64748b";
}

function lightLabel(optic) {
  const labels = {
    red: "Rojo",
    amber: "Ámbar",
    green: "Verde",
    amber_1: "Ámbar 1",
    amber_2: "Ámbar 2",
    ped_red: "No pasar",
    ped_green: "Pasar",
    red_arrow: "Rojo flecha",
    amber_arrow: "Ámbar flecha",
    green_arrow: "Verde flecha",
  };
  return labels[optic] || optic;
}


const OUTPUT_STATES = {
  red: "Rojo",
  green: "Verde",
  amber: "Ámbar",
  amber_1: "Ámbar aviso",
  amber_2: "Doble ámbar",
  ped_green: "Peatón verde",
  ped_red: "Peatón rojo",
  off: "Apagado",
};

function outputStateForHead(head, requested) {
  if (!requested) return "red";

  if (requested === "green") {
    if (head.optics.includes("green")) return "green";
    if (head.optics.includes("green_arrow")) return "green_arrow";
    if (head.optics.includes("ped_green")) return "ped_green";
    if (head.optics.includes("amber_1") && head.optics.includes("amber_2")) return "amber_2";
    if (head.optics.includes("amber")) return "amber";
  }

  if (requested === "amber" || requested === "amber_1") {
    if (head.optics.includes("amber")) return "amber";
    if (head.optics.includes("amber_arrow")) return "amber_arrow";
    if (head.optics.includes("amber_1")) return "amber_1";
    if (head.optics.includes("amber_2")) return "amber_2";
  }

  if (requested === "amber_2") {
    if (head.optics.includes("amber_2")) return "amber_2";
    if (head.optics.includes("amber_1")) return "amber_1";
    if (head.optics.includes("amber")) return "amber";
  }

  if (requested === "ped_green" && head.optics.includes("ped_green")) return "ped_green";
  if (requested === "ped_red" && head.optics.includes("ped_red")) return "ped_red";

  if (requested === "red") {
    if (head.optics.includes("red")) return "red";
    if (head.optics.includes("red_arrow")) return "red_arrow";
    if (head.optics.includes("ped_red")) return "ped_red";
    if (head.optics.includes("amber_1")) return "amber_1";
    if (head.optics.includes("amber")) return "amber";
  }

  if (requested === "off") return "off";

  return headStateFromGroupState(head, requested);
}

function defaultOutputForPhase(phase, heads) {
  const outputs = {};
  heads.forEach((head) => {
    if (phase.greenGroups?.includes(head.movement)) {
      outputs[head.id] = head.groupType === "pedestrian" ? "ped_green" : "green";
    } else {
      outputs[head.id] = head.groupType === "pedestrian" ? "ped_red" : "red";
    }
  });
  return outputs;
}

function phaseOutputs(phase, heads) {
  return { ...defaultOutputForPhase(phase, heads), ...(phase.outputs || {}) };
}

function createIndependentScenarioGeometry() {
  const signalGroups = [
    makeGroup("M_BAJADA", "Vehículos bajada vía principal", "vehicle"),
    makeGroup("M_SUBIDA", "Vehículos subida vía principal", "vehicle"),
    makeGroup("G_IZQ_BAJADA", "Giro izquierda bajando", "turn"),
    makeGroup("L_IZQ", "Calle transversal izquierda se incorpora", "vehicle"),
    makeGroup("P_PRINCIPAL", "Peatones vía principal", "pedestrian"),
    makeGroup("P_LATERAL", "Peatones calle transversal", "pedestrian"),
    makeGroup("AVISO_PP", "Aviso precaución paso peatones", "vehicle"),
  ];

  const signalHeads = [
    makeHead("M_BAJADA", "Bajada vía principal", "M_BAJADA", "vehicle", "S13_RAV"),
    makeHead("M_SUBIDA", "Subida vía principal", "M_SUBIDA", "vehicle", "S13_RAV"),
    makeHead("M_GIRO_IZQ", "Giro izquierda bajando", "G_IZQ_BAJADA", "turn", "ARROW_RAG"),
    makeHead("M_TRANSVERSAL_IZQ", "Entrada transversal izquierda", "L_IZQ", "vehicle", "S13_RAV"),
    makeHead("M_P_PRINCIPAL", "Peatón vía principal", "P_PRINCIPAL", "pedestrian", "PED_RG"),
    makeHead("M_P_SECUNDARIA", "Peatón calle transversal", "P_LATERAL", "pedestrian", "PED_RG"),
    makeHead("M_AVISO_PP", "Aviso ámbar/doble ámbar", "AVISO_PP", "vehicle", "S13_RAA"),
  ];

  return {
    geometryType: "MAIN_WITH_TURN",
    signalGroups,
    signalHeads,
    controlGroups: [
      { id: "GV", name: "Grupo vehículos", members: ["M_BAJADA", "M_SUBIDA", "G_IZQ_BAJADA", "L_IZQ"] },
      { id: "GV-Principal", name: "Vía principal", members: ["M_BAJADA", "M_SUBIDA"] },
      { id: "GV-Giro", name: "Giro izquierda bajando", members: ["G_IZQ_BAJADA"] },
      { id: "GV-Transversal", name: "Calle transversal izquierda", members: ["L_IZQ"] },
      { id: "GP", name: "Grupo peatones", members: ["P_PRINCIPAL", "P_LATERAL"] },
      { id: "AVISO", name: "Avisos ámbar peatones", members: ["AVISO_PP"] },
    ],
    phases: [
      {
        id: "F1",
        name: "Principal completa",
        greenGroups: ["M_BAJADA", "M_SUBIDA"],
        duration: 26,
        outputs: {
          M_BAJADA: "green",
          M_SUBIDA: "green",
          M_GIRO_IZQ: "red",
          M_TRANSVERSAL_IZQ: "red",
          M_P_PRINCIPAL: "ped_red",
          M_P_SECUNDARIA: "ped_red",
          M_AVISO_PP: "red",
        },
      },
      {
        id: "F2",
        name: "Bajada + giro, subida cerrada",
        greenGroups: ["M_BAJADA", "G_IZQ_BAJADA", "P_LATERAL", "AVISO_PP"],
        duration: 24,
        outputs: {
          M_BAJADA: "green",
          M_SUBIDA: "red",
          M_GIRO_IZQ: "green",
          M_TRANSVERSAL_IZQ: "red",
          M_P_PRINCIPAL: "ped_red",
          M_P_SECUNDARIA: "ped_green",
          M_AVISO_PP: "amber_2",
        },
      },
      {
        id: "F3",
        name: "Cierra principal, abre transversal",
        greenGroups: ["L_IZQ", "P_PRINCIPAL", "AVISO_PP"],
        duration: 22,
        outputs: {
          M_BAJADA: "amber",
          M_SUBIDA: "red",
          M_GIRO_IZQ: "amber",
          M_TRANSVERSAL_IZQ: "green",
          M_P_PRINCIPAL: "ped_green",
          M_P_SECUNDARIA: "ped_red",
          M_AVISO_PP: "amber_2",
        },
      },
      {
        id: "F4",
        name: "Peatones protegidos",
        greenGroups: ["P_PRINCIPAL", "P_LATERAL", "AVISO_PP"],
        duration: 16,
        outputs: {
          M_BAJADA: "red",
          M_SUBIDA: "red",
          M_GIRO_IZQ: "red",
          M_TRANSVERSAL_IZQ: "red",
          M_P_PRINCIPAL: "ped_green",
          M_P_SECUNDARIA: "ped_green",
          M_AVISO_PP: "amber_2",
        },
      },
    ],
    conflicts: [
      ["M_BAJADA", "P_PRINCIPAL"],
      ["M_SUBIDA", "P_PRINCIPAL"],
      ["G_IZQ_BAJADA", "P_PRINCIPAL"],
      ["L_IZQ", "P_LATERAL"],
      ["L_IZQ", "G_IZQ_BAJADA"],
      ["L_IZQ", "M_BAJADA"],
      ["L_IZQ", "M_SUBIDA"],
      ["M_SUBIDA", "G_IZQ_BAJADA"],
    ],
  };
}


function nextManeuverId(heads) {
  for (let i = 1; i < 999; i += 1) {
    const id = `M${i}`;
    if (!(heads || []).some((head) => head.id === id)) return id;
  }
  return `M${(heads || []).length + 1}`;
}

function defaultSignalHeadsForGeometry(geometryType, signalGroups) {
  if (geometryType === "MAIN_WITH_TURN" && signalGroups.some((group) => group.id === "S11")) {
    return [
      makeHead("M11", "Norte hacia vía principal", "S11", "vehicle", "S13_RAV"),
      makeHead("M12", "Sur vía principal", "S12", "vehicle", "S13_RAV"),
      makeHead("M13", "Giro norte izquierda/derecha", "S13", "turn", "ARROW_RAG"),
      makeHead("M14", "Entrada derecha/transversal", "S14", "vehicle", "S13_RAV"),
      makeHead("M21", "Peatón norte", "S21", "pedestrian", "PED_RG"),
      makeHead("M22", "Peatón sur", "S22", "pedestrian", "PED_RG"),
    ];
  }

  return signalGroups.map((group, index) =>
    makeHead(
      `M${index + 1}`,
      group.name,
      group.id,
      group.type,
      defaultHeadTypeForGroupType(group.type)
    )
  );
}

function normalizeHeadsForGeometry(geometry) {
  if (geometry.signalHeads && geometry.signalHeads.length) return geometry;
  return {
    ...geometry,
    signalHeads: defaultSignalHeadsForGeometry(geometry.geometryType, geometry.signalGroups),
  };
}



const DEMAND_PLAN_OPTIONS = [
  { value: "laborable", label: "Plan Diario Laborable", multiplier: 1 },
  { value: "finsemana", label: "Plan Fin de Semana", multiplier: 0.75 },
  { value: "hora_punta", label: "Plan Hora Punta", multiplier: 1.35 },
  { value: "nocturno", label: "Plan Nocturno", multiplier: 0.45 },
  { value: "manual", label: "Plan Manual", multiplier: 1 },
];

function demandPlanLabel(value) {
  return DEMAND_PLAN_OPTIONS.find((plan) => plan.value === value)?.label || "Plan Diario Laborable";
}

function demandPlanMultiplier(value) {
  return DEMAND_PLAN_OPTIONS.find((plan) => plan.value === value)?.multiplier ?? 1;
}

function getDemandPlan(crossing) {
  return crossing?.demandPlan || "laborable";
}

function getDemandFactor(crossing) {
  return clamp(crossing?.demandFactor ?? 100, 25, 250);
}

function effectiveArrival(crossing, direction) {
  const base = Number(crossing?.arrivals?.[direction] ?? 0);
  const multiplier = demandPlanMultiplier(getDemandPlan(crossing));
  const factor = getDemandFactor(crossing) / 100;
  return clamp(Math.round(base * multiplier * factor), 0, 120);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function nextId(items, prefix = "") {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const letter of alphabet) {
    const id = `${prefix}${letter}`;
    if (!items.some((item) => item.id === id)) return id;
  }
  return `${prefix}${items.length + 1}`;
}

function nextSignalCode(groups, start = 11) {
  for (let i = start; i < 99; i += 1) {
    const id = `S${i}`;
    if (!groups.some((group) => group.id === id)) return id;
  }
  return `S${groups.length + start}`;
}

function cleanGroupId(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "");
}

function replaceGroupIdInGeometry(geometry, oldId, newId) {
  const safeId = cleanGroupId(newId);
  if (!safeId || safeId === oldId) return geometry;
  if (geometry.signalGroups.some((group) => group.id === safeId)) return geometry;

  return {
    ...geometry,
    signalGroups: geometry.signalGroups.map((group) =>
      group.id === oldId ? { ...group, id: safeId } : group
    ),
    phases: geometry.phases.map((phase) => ({
      ...phase,
      greenGroups: phase.greenGroups.map((id) => (id === oldId ? safeId : id)),
    })),
    conflicts: geometry.conflicts.map(([a, b]) => [
      a === oldId ? safeId : a,
      b === oldId ? safeId : b,
    ]),
    controlGroups: (geometry.controlGroups || []).map((controlGroup) => ({
      ...controlGroup,
      members: controlGroup.members.map((id) => (id === oldId ? safeId : id)),
    })),
    signalHeads: (geometry.signalHeads || []).map((head) => ({
      ...head,
      movement: head.movement === oldId ? safeId : head.movement,
    })),
  };
}


function groupOptics(type) {
  if (type === "pedestrian") return ["red", "green"];
  if (type === "turn") return ["red", "amber", "green_arrow"];
  return ["red", "amber", "green"];
}

function makeGroup(id, name, type = "vehicle") {
  return {
    id,
    name,
    type,
    movementKind: defaultMovementKindForType(type),
    optics: groupOptics(type),
  };
}

function defaultGroupsForGeometry(geometryType) {
  if (geometryType === "PEDESTRIAN") {
    return [
      makeGroup("V1", "Vehículos sentido ida", "vehicle"),
      makeGroup("V2", "Vehículos sentido vuelta", "vehicle"),
      makeGroup("P1", "Paso peatonal", "pedestrian"),
    ];
  }

  if (geometryType === "T") {
    return [
      makeGroup("V1", "Avenida principal ida", "vehicle"),
      makeGroup("V2", "Avenida principal vuelta", "vehicle"),
      makeGroup("V3", "Calle transversal", "vehicle"),
      makeGroup("P1", "Peatón avenida", "pedestrian"),
      makeGroup("P2", "Peatón calle transversal", "pedestrian"),
    ];
  }

  if (geometryType === "ROUNDABOUT") {
    return [
      makeGroup("V1", "Entrada norte", "vehicle"),
      makeGroup("V2", "Entrada este", "vehicle"),
      makeGroup("V3", "Entrada sur", "vehicle"),
      makeGroup("V4", "Entrada oeste", "vehicle"),
      makeGroup("P1", "Paso norte", "pedestrian"),
      makeGroup("P2", "Paso sur", "pedestrian"),
    ];
  }

  if (geometryType === "PROTECTED_TURN") {
    return [
      makeGroup("V1", "Principal recto", "vehicle"),
      makeGroup("V2", "Opuesto recto", "vehicle"),
      makeGroup("G1", "Giro protegido izquierda", "turn"),
      makeGroup("P1", "Peatón cruce principal", "pedestrian"),
    ];
  }

  if (geometryType === "MAIN_WITH_TURN") {
    return [
      makeGroup("V1", "Vía principal continúa", "vehicle"),
      makeGroup("G1", "Giro desde vía principal", "turn"),
      makeGroup("V2", "Vía transversal / transversal cerrada", "vehicle"),
      makeGroup("P1", "Peatón cruce principal", "pedestrian"),
      makeGroup("P2", "Peatón cruce transversal", "pedestrian"),
    ];
  }

  if (geometryType === "ACCESS") {
    return [
      makeGroup("V1", "Vía principal", "vehicle"),
      makeGroup("V2", "Acceso transversal", "vehicle"),
      makeGroup("P1", "Paso peatonal", "pedestrian"),
    ];
  }

  return [
    makeGroup("V1", "Vehículos Norte/Sur", "vehicle"),
    makeGroup("V2", "Vehículos Este/Oeste", "vehicle"),
    makeGroup("P1", "Peatones Norte/Sur", "pedestrian"),
    makeGroup("P2", "Peatones Este/Oeste", "pedestrian"),
  ];
}

function defaultPhasesForGroups(groups) {
  const vehicles = groups.filter((g) => g.type !== "pedestrian").map((g) => g.id);
  const pedestrians = groups.filter((g) => g.type === "pedestrian").map((g) => g.id);
  const firstVehicle = vehicles.slice(0, Math.ceil(vehicles.length / 2));
  const secondVehicle = vehicles.slice(Math.ceil(vehicles.length / 2));

  const phases = [];
  if (firstVehicle.length) phases.push({ id: "F1", name: "Fase vehículos 1", greenGroups: firstVehicle, duration: BASE_GREEN });
  if (secondVehicle.length) phases.push({ id: "F2", name: "Fase vehículos 2", greenGroups: secondVehicle, duration: BASE_GREEN });
  if (pedestrians.length) phases.push({ id: "F3", name: "Fase peatones", greenGroups: pedestrians, duration: 16 });

  return phases.length ? phases : [{ id: "F1", name: "Fase principal", greenGroups: groups.slice(0, 1).map((g) => g.id), duration: BASE_GREEN }];
}

function defaultConflicts(groups) {
  const conflicts = [];
  const vehicles = groups.filter((g) => g.type !== "pedestrian");
  const pedestrians = groups.filter((g) => g.type === "pedestrian");

  vehicles.forEach((v) => pedestrians.forEach((p) => conflicts.push([v.id, p.id])));

  // Regla dura: en una intersección simple, V1 y V2 representan vías vehiculares incompatibles
  // salvo casos especiales como paso peatonal, donde V1/V2 son ambos sentidos de la misma vía.
  if (vehicles.some((g) => g.id === "V1") && vehicles.some((g) => g.id === "V2")) {
    conflicts.push(["V1", "V2"]);
  }

  if (vehicles.length > 2) {
    for (let i = 0; i < vehicles.length; i += 1) {
      for (let j = i + 1; j < vehicles.length; j += 1) {
        const pair = [vehicles[i].id, vehicles[j].id].sort().join("::");
        const exists = conflicts.some(([a, b]) => [a, b].sort().join("::") === pair);
        if (!exists && (i + j) % 2 === 1) conflicts.push([vehicles[i].id, vehicles[j].id]);
      }
    }
  }

  return conflicts;
}



function sanitizeControlGroups(groups) {
  const seen = new Set();
  return (groups || [])
    .filter((group) => group && group.id && !seen.has(group.id) && seen.add(group.id))
    .map((group) => ({
      ...group,
      members: [...new Set(group.members || [])],
    }));
}


function nextPhaseId(phases) {
  for (let i = 1; i < 99; i += 1) {
    const id = `F${i}`;
    if (!(phases || []).some((phase) => phase.id === id)) return id;
  }
  return `F${(phases || []).length + 1}`;
}

function sanitizePhases(phases) {
  const seen = new Set();
  return (phases || [])
    .filter((phase) => phase && phase.id && !seen.has(phase.id) && seen.add(phase.id))
    .map((phase) => ({
      ...phase,
      greenGroups: [...new Set(phase.greenGroups || [])],
      outputs: phase.outputs || {},
      duration: clamp(phase.duration || BASE_GREEN, 8, 55),
    }));
}

function defaultControlGroups(signalGroups) {
  const vehicles = signalGroups.filter((group) => group.type !== "pedestrian").map((group) => group.id);
  const pedestrians = signalGroups.filter((group) => group.type === "pedestrian").map((group) => group.id);
  const turns = signalGroups.filter((group) => group.type === "turn").map((group) => group.id);

  const result = [];

  if (vehicles.length) {
    result.push({ id: "GV", name: "Grupo vehículos", members: vehicles });
    if (vehicles[0]) result.push({ id: "GV-Principal", name: "Vehículos principal", members: vehicles.slice(0, Math.min(2, vehicles.length)) });
    if (turns.length) result.push({ id: "GV-Giro", name: "Giro vehículos", members: turns });
    const transversals = vehicles.filter((id) => !turns.includes(id)).slice(2);
    if (transversals.length) result.push({ id: "GV-Transversal", name: "Entrada transversal", members: transversals });
  }

  if (pedestrians.length) {
    result.push({ id: "GP", name: "Grupo peatones", members: pedestrians });
  }

  return result;
}

function createAvEuropaTurnGeometry() {
  const signalGroups = [
    makeGroup("S11", "Vehículos norte hacia vía principal", "vehicle"),
    makeGroup("S12", "Vehículos sur de la vía principal", "vehicle"),
    makeGroup("S13", "Giro izquierda/derecha desde norte", "turn"),
    makeGroup("S14", "Entrada desde vía derecha/transversal", "vehicle"),
    makeGroup("S21", "Peatón lado norte", "pedestrian"),
    makeGroup("S22", "Peatón lado sur", "pedestrian"),
  ];

  return {
    geometryType: "MAIN_WITH_TURN",
    signalGroups,
    controlGroups: [
      { id: "GV", name: "Grupo vehículos", members: ["S11", "S12", "S13", "S14"] },
      { id: "GV-Principal", name: "Vehículos principal", members: ["S11", "S12"] },
      { id: "GV-Giro", name: "Giro vehículos", members: ["S13"] },
      { id: "GV-Transversal", name: "Entrada transversal", members: ["S14"] },
      { id: "GV-Principal+Giro", name: "Principal + giro compatible", members: ["S11", "S13"] },
      { id: "GP", name: "Grupo peatones", members: ["S21", "S22"] },
    ],
    signalHeads: [
      makeHead("M11", "Norte hacia vía principal", "S11", "vehicle", "S13_RAV"),
      makeHead("M12", "Sur vía principal", "S12", "vehicle", "S13_RAV"),
      makeHead("M13", "Giro norte izquierda/derecha", "S13", "turn", "ARROW_RAG"),
      makeHead("M14", "Entrada desde vía derecha/transversal", "S14", "vehicle", "S13_RAV"),
      makeHead("M21", "Peatón lado norte", "S21", "pedestrian", "PED_RG"),
      makeHead("M22", "Peatón lado sur", "S22", "pedestrian", "PED_RG"),
    ],
    phases: [
      { id: "F1", name: "Norte + giro compatible", greenGroups: ["S11", "S13"], duration: 30 },
      { id: "F2", name: "Sur vía principal", greenGroups: ["S12"], duration: 22 },
      { id: "F3", name: "Entrada transversal", greenGroups: ["S14"], duration: 18 },
      { id: "F4", name: "Peatones", greenGroups: ["S21", "S22"], duration: 16 },
    ],
    conflicts: [
      ["S11", "S12"],
      ["S11", "S14"],
      ["S12", "S13"],
      ["S12", "S14"],
      ["S13", "S14"],
      ["S11", "S21"], ["S11", "S22"],
      ["S12", "S21"], ["S12", "S22"],
      ["S13", "S21"], ["S13", "S22"],
      ["S14", "S21"], ["S14", "S22"],
    ],
  };
}

function makeGeometry(geometryType = "X") {
  const signalGroups = defaultGroupsForGeometry(geometryType);
  let phases = defaultPhasesForGroups(signalGroups);

  let conflicts = defaultConflicts(signalGroups);

  if (geometryType === "PEDESTRIAN") {
    phases = [
      { id: "F1", name: "Vehículos ambos sentidos", greenGroups: ["V1", "V2"], duration: 28 },
      { id: "F2", name: "Paso peatonal", greenGroups: ["P1"], duration: 16 },
    ];
    conflicts = conflicts.filter(([a, b]) => !([a, b].includes("V1") && [a, b].includes("V2")));
  }

  if (geometryType === "MAIN_WITH_TURN") {
    phases = [
      { id: "F1", name: "Principal + giro", greenGroups: ["V1", "G1"], duration: 30 },
      { id: "F2", name: "Transversal / acceso", greenGroups: ["V2"], duration: 18 },
      { id: "F3", name: "Peatones", greenGroups: ["P1", "P2"], duration: 16 },
    ];
    // En esta plantilla V1 y G1 son compatibles: misma vía principal + giro.
    // Todo vehículo o giro queda incompatible con peatones.
    conflicts = [
      ["V1", "V2"],
      ["G1", "V2"],
      ["V1", "P1"], ["V1", "P2"],
      ["G1", "P1"], ["G1", "P2"],
      ["V2", "P1"], ["V2", "P2"],
    ];
  }

  return {
    geometryType,
    signalGroups,
    phases,
    conflicts,
    controlGroups: defaultControlGroups(signalGroups),
    signalHeads: defaultSignalHeadsForGeometry(geometryType, signalGroups),
  };
}

function createHardware() {
  return {
    cabinetTemp: 34,
    cpuTemp: 42,
    cpuLoad: 18,
    diskUsage: 21,
    voltage24: 24.1,
    networkMs: 12,
    ioModuleOk: true,
    loopDetectorOk: true,
    cameraOk: true,
    opticFaults: {},
  };
}

function makeCamera(id, name, direction = "NS") {
  return {
    id,
    name,
    direction,
    enabled: true,
    ok: true,
    vehicles: 4,
    queueMeters: 18,
    blockedExit: false,
    confidence: 86,
  };
}

function makeCrossing(id, name, lat, lng, index = 0, geometryType = "X") {
  return {
    id,
    name: name || `Cruce ${id}`,
    lat,
    lng,
    linked: true,
    localMode: false,
    operatorManual: false,
    offset: index * 10,
    queues: {
      NS: clamp(6 + index * 2, 0, MAX_QUEUE),
      EW: clamp(5 + index, 0, MAX_QUEUE),
    },
    arrivals: {
      NS: 12 + index * 2,
      EW: 10 + index,
    },
    demandPlan: "laborable",
    demandFactor: 100,
    pedestrianRequests: { NS: 0, EW: 0 },
    hardware: createHardware(),
    cameras: [],
    geometry: makeGeometry(geometryType),
  };
}

const INITIAL_CROSSINGS = [
  makeCrossing("A", "Av. Mediterráneo / Calle Europa", 38.5424, -0.1330, 0, "X"),
  makeCrossing("B", "Paso peatón Av. Mediterráneo", 38.5417, -0.1270, 1, "PEDESTRIAN"),
  makeCrossing("C", "Cruce en T Plaza Triangular", 38.5410, -0.1210, 2, "T"),
  makeCrossing("D", "Av. Europa · principal + giro", 38.5402, -0.1150, 3, "MAIN_WITH_TURN"),
  makeCrossing("E", "Rotonda semaforizada", 38.5451, -0.1210, 4, "ROUNDABOUT"),
];

const INITIAL_LINKS = [
  { from: "A", to: "B" },
  { from: "B", to: "C" },
  { from: "C", to: "D" },
];

function normalizeLink(a, b) {
  return [a, b].sort().join("::");
}

function toggleLink(links, a, b) {
  if (!a || !b || a === b) return links;
  const key = normalizeLink(a, b);
  if (links.some((link) => normalizeLink(link.from, link.to) === key)) {
    return links.filter((link) => normalizeLink(link.from, link.to) !== key);
  }
  return [...links, { from: a, to: b }];
}

function removeLinksForCrossing(links, id) {
  return links.filter((link) => link.from !== id && link.to !== id);
}

function sortCrossingIdsByMap(crossings, ids) {
  return [...ids].sort((a, b) => {
    const ca = crossings.find((crossing) => crossing.id === a);
    const cb = crossings.find((crossing) => crossing.id === b);
    if (!ca || !cb) return 0;
    return ca.lng - cb.lng || cb.lat - ca.lat;
  });
}

function getPrimaryGroup(crossing) {
  if (!crossing?.geometry?.signalGroups?.length) return null;
  return crossing.geometry.signalGroups.find((group) => group.type !== "pedestrian") || crossing.geometry.signalGroups[0];
}

function primaryGroupState(crossing, signal) {
  const primary = getPrimaryGroup(crossing);
  if (!primary || !signal?.groupStates) return "red";
  return signal.groupStates[primary.id] || "red";
}

function decisionReasons(crossing, signal, settings) {
  if (!crossing || !signal) return [];
  const reasons = [];
  if (crossing.operatorManual) reasons.push("selector físico en MANUAL: el PC supervisa y registra");
  if (crossing.localMode) reasons.push("modo local: usa plan fijo local y se aísla de la onda verde");
  if (!settings.adaptive) reasons.push("adaptativo desactivado: se respetan duraciones programadas");
  if (settings.loopsEnabled) {
    if (crossing.queues.NS >= 1 || crossing.queues.EW >= 1) reasons.push("lazos virtuales detectan demanda");
    if (crossing.queues.NS >= 8 || crossing.queues.EW >= 8) reasons.push("lazo medio ocupado: se considera cola media");
    if (crossing.queues.NS >= 16 || crossing.queues.EW >= 16) reasons.push("lazo largo ocupado: se considera cola larga");
  }
  if (settings.cameraEnabled) {
    const activeCameras = crossing.cameras.filter((camera) => camera.enabled && camera.ok);
    if (activeCameras.length) reasons.push(`${activeCameras.length} cámara(s) aportan estimación de cola`);
    if (activeCameras.some((camera) => camera.blockedExit)) reasons.push("cámara detecta salida saturada: se limita el verde");
  }
  if (signal.safetyFiltered) reasons.push("seguridad activa: se han bloqueado grupos incompatibles");
  if (!reasons.length) reasons.push("demanda equilibrada y fase compatible");
  return reasons;
}

function groupsConflict(crossing, a, b) {
  const key = [a, b].sort().join("::");
  return crossing.geometry.conflicts.some(([x, y]) => [x, y].sort().join("::") === key);
}

function sanitizeGreenGroups(crossing, greenGroups) {
  const safe = [];
  greenGroups.forEach((groupId) => {
    const hasConflict = safe.some((existing) => groupsConflict(crossing, existing, groupId));
    if (!hasConflict) safe.push(groupId);
  });
  return safe;
}

function demandFactor(crossing) {
  return Math.max(crossing.queues.NS, crossing.queues.EW);
}

function effectivePhaseDuration(crossing, phase, settings) {
  // Si el cruce está coordinado, mantiene el plan base para que el ciclo sea estable.
  // La adaptación no debe romper la sincronización del corredor.
  if (crossing.operatorManual || !settings.adaptive || (settings.linkedMode && crossing.linked)) return phase.duration;

  const demand = demandFactor(crossing);
  let duration = phase.duration;
  const cameraDemand = crossing.cameras
    .filter((camera) => camera.enabled && camera.ok)
    .reduce((sum, camera) => sum + camera.vehicles, 0);

  if (settings.loopsEnabled) {
    if (demand >= 8) duration += 4;
    if (demand >= 16) duration += 8;
  }

  if (settings.cameraEnabled && cameraDemand >= 8) duration += 4;
  if (demand >= 25 || crossing.cameras.some((camera) => camera.blockedExit)) duration -= 4;

  return clamp(duration, 8, 55);
}

function getSignal(crossing, tick, settings) {
  const phases = crossing.geometry.phases.length ? crossing.geometry.phases : defaultPhasesForGroups(crossing.geometry.signalGroups);
  const phaseDurations = phases.map((phase) => effectivePhaseDuration(crossing, phase, settings));
  const cycle = phaseDurations.reduce((sum, duration) => sum + duration + AMBER + ALL_RED, 0);
  // La coordinación de tiempos es independiente de que el cruce esté en plan local o remoto.
  // Solo el modo manual/persona lo aísla.
  const offset = settings.linkedMode && crossing.linked && !crossing.operatorManual ? crossing.offset : 0;
  const localTick = ((tick + offset) % cycle + cycle) % cycle;

  let cursor = 0;
  let activePhase = phases[0];
  let activeIndex = 0;
  let stage = "green";
  let elapsed = 0;
  let stageLength = phaseDurations[0];

  for (let i = 0; i < phases.length; i += 1) {
    const greenDuration = phaseDurations[i];
    if (localTick < cursor + greenDuration) {
      activePhase = phases[i];
      activeIndex = i;
      stage = "green";
      elapsed = localTick - cursor;
      stageLength = greenDuration;
      break;
    }
    cursor += greenDuration;

    if (localTick < cursor + AMBER) {
      activePhase = phases[i];
      activeIndex = i;
      stage = "amber";
      elapsed = localTick - cursor;
      stageLength = AMBER;
      break;
    }
    cursor += AMBER;

    if (localTick < cursor + ALL_RED) {
      activePhase = phases[i];
      activeIndex = i;
      stage = "allRed";
      elapsed = localTick - cursor;
      stageLength = ALL_RED;
      break;
    }
    cursor += ALL_RED;
  }

  const rawGreenGroups = activePhase.greenGroups || [];
  const safeGreenGroups = sanitizeGreenGroups(crossing, rawGreenGroups);
  const safetyFiltered = safeGreenGroups.length !== rawGreenGroups.length;

  const groupStates = {};
  crossing.geometry.signalGroups.forEach((group) => {
    if (stage === "allRed") {
      groupStates[group.id] = "red";
    } else if (stage === "amber") {
      groupStates[group.id] = safeGreenGroups.includes(group.id) && group.optics.includes("amber") ? "amber" : "red";
    } else {
      groupStates[group.id] = safeGreenGroups.includes(group.id) ? "green" : "red";
    }
  });

  const live = {
    nsCars: groupStates.V1 === "green" ? "green" : groupStates.V1 === "amber" ? "amber" : "red",
    ewCars: groupStates.V2 === "green" ? "green" : groupStates.V2 === "amber" ? "amber" : "red",
    nsPed: groupStates.P1 === "green" ? "green" : "red",
    ewPed: groupStates.P2 === "green" ? "green" : "red",
  };

  const normalizedGeometry = normalizeHeadsForGeometry(crossing.geometry);
  const requestedOutputs = phaseOutputs(activePhase, normalizedGeometry.signalHeads);
  const headStates = {};
  normalizedGeometry.signalHeads.forEach((head) => {
    const groupState = groupStates[head.movement] || "red";
    const requestedState = requestedOutputs[head.id] || groupState;
    headStates[head.id] = stage === "green" ? outputStateForHead(head, requestedState) : headStateFromGroupState(head, groupState);
  });

  return {
    cycle,
    localTick,
    activePhase: { ...activePhase, greenGroups: safeGreenGroups, rawGreenGroups },
    activeIndex,
    stage,
    groupStates,
    phaseDurations,
    safetyFiltered,
    headStates,
    live,
    remaining: Math.ceil(stageLength - elapsed),
    progress: clamp(Math.round((elapsed / Math.max(1, stageLength)) * 100), 0, 100),
  };
}

function hasConflict(crossing, greenGroups) {
  return crossing.geometry.conflicts.some(([a, b]) => greenGroups.includes(a) && greenGroups.includes(b));
}

function simulateHardware(hardware, running) {
  const next = { ...hardware, opticFaults: { ...hardware.opticFaults } };
  next.cpuLoad = clamp(next.cpuLoad + (Math.random() * 10 - 5), running ? 10 : 3, running ? 80 : 35);
  next.cpuTemp = clamp(next.cpuTemp + (next.cpuLoad > 45 ? 0.2 : -0.1) + (Math.random() * 0.7 - 0.35), 32, 82);
  next.cabinetTemp = clamp(next.cabinetTemp + (Math.random() * 0.5 - 0.2), 25, 68);
  next.diskUsage = clamp(next.diskUsage + 0.004, 0, 96);
  next.voltage24 = clamp(next.voltage24 + (Math.random() * 0.16 - 0.08), 22.4, 25.5);
  next.networkMs = Math.round(clamp(next.networkMs + (Math.random() * 8 - 4), 2, 220));
  return next;
}

function simulateCamera(camera, crossing, running) {
  if (!running || !camera.enabled) return camera;
  const queue = camera.direction === "NS" ? crossing.queues.NS : crossing.queues.EW;
  const vehicles = clamp(Math.round(queue + (Math.random() * 4 - 2)), 0, MAX_QUEUE);
  return {
    ...camera,
    vehicles,
    queueMeters: Math.round(vehicles * 5.5),
    blockedExit: vehicles >= 25,
    confidence: Math.round(clamp(camera.confidence + (Math.random() * 6 - 3), 45, 99)),
  };
}

function healthLevel(hardware) {
  if (Object.keys(hardware.opticFaults).length > 0) return "fault";
  if (!hardware.ioModuleOk || !hardware.loopDetectorOk || !hardware.cameraOk) return "warning";
  if (hardware.cpuTemp >= 75 || hardware.cabinetTemp >= 60) return "warning";
  if (hardware.voltage24 < 23 || hardware.voltage24 > 25 || hardware.networkMs > 120 || hardware.diskUsage > 90) return "warning";
  return "ok";
}

function healthText(level) {
  if (level === "fault") return "AVERÍA";
  if (level === "warning") return "AVISO";
  return "OK";
}

function healthClass(level) {
  if (level === "fault") return "state-red";
  if (level === "warning") return "state-amber";
  return "state-green";
}


function phaseExplanation(crossing, signal) {
  if (crossing.geometry.geometryType === "MAIN_WITH_TURN" && signal.activePhase?.id === "F1" && signal.stage === "green") {
    return "Vía principal abierta + giro compatible; transversal y peatones en rojo.";
  }
  if (crossing.geometry.geometryType === "MAIN_WITH_TURN" && signal.activePhase?.id === "F2" && signal.stage === "green") {
    return "Transversal/acceso abierto; vía principal, giro y peatones en rojo.";
  }
  if (crossing.geometry.geometryType === "MAIN_WITH_TURN" && signal.activePhase?.id === "F3" && signal.stage === "green") {
    return "Fase peatonal; todos los vehículos y giros en rojo.";
  }
  return "";
}

function stageName(stage) {
  if (stage === "green") return "Verde";
  if (stage === "amber") return "Ámbar";
  return "Todo rojo";
}

function stageClass(stage) {
  if (stage === "green") return "state-green";
  if (stage === "amber") return "state-amber";
  return "state-red";
}

function validateSystem(crossings, manualLinks, corridorIds, signals, settings) {
  const issues = [];

  if (crossings.length === 0) {
    issues.push({ level: "info", text: "No hay cruces en el mapa. Añade uno para iniciar programación." });
  }

  crossings.forEach((crossing) => {
    if (!crossing.name.trim()) issues.push({ level: "error", text: `${crossing.id}: nombre vacío.` });
    if (!crossing.geometry.signalGroups.length) issues.push({ level: "error", text: `${crossing.id}: sin grupos luminosos.` });
    if (!crossing.geometry.phases.length) issues.push({ level: "error", text: `${crossing.id}: sin fases.` });

    crossing.geometry.phases.forEach((phase) => {
      if (!phase.greenGroups.length) issues.push({ level: "warning", text: `${crossing.id}/${phase.id}: fase sin grupos en verde.` });
      if (hasConflict(crossing, phase.greenGroups)) issues.push({ level: "warning", text: `${crossing.id}/${phase.id}: fase contiene grupos incompatibles; el motor los bloqueará.` });
      phase.greenGroups.forEach((groupId) => {
        if (!crossing.geometry.signalGroups.some((group) => group.id === groupId)) issues.push({ level: "error", text: `${crossing.id}/${phase.id}: grupo ${groupId} no existe.` });
      });
    });

    const groupsUsed = new Set(crossing.geometry.phases.flatMap((phase) => phase.greenGroups));
    crossing.geometry.signalGroups.forEach((group) => {
      if (!groupsUsed.has(group.id)) issues.push({ level: "warning", text: `${crossing.id}: grupo ${group.id} no aparece en ninguna fase.` });
      if (!group.optics?.length) issues.push({ level: "error", text: `${crossing.id}: grupo ${group.id} no tiene ópticas.` });
    });

    if (crossing.geometry.geometryType === "PEDESTRIAN") {
      const hasPedestrianGroup = crossing.geometry.signalGroups.some((group) => group.type === "pedestrian");
      const hasPedestrianPhase = crossing.geometry.phases.some((phase) => phase.greenGroups.some((groupId) => crossing.geometry.signalGroups.find((group) => group.id === groupId)?.type === "pedestrian"));
      if (!hasPedestrianGroup) issues.push({ level: "error", text: `${crossing.id}: paso peatonal sin grupo peatonal.` });
      if (!hasPedestrianPhase) issues.push({ level: "error", text: `${crossing.id}: paso peatonal sin fase peatonal.` });
    }

    if ((crossing.operatorManual || crossing.localMode) && corridorIds.includes(crossing.id)) {
      issues.push({ level: "warning", text: `${crossing.id}: cruce manual/local sigue en corredor; se recomienda aislarlo.` });
    }
    if (crossing.localMode && crossing.linked) {
      issues.push({ level: "warning", text: `${crossing.id}: modo local con vinculación activa.` });
    }

    const signal = signals[crossing.id];
    if (signal?.safetyFiltered) issues.push({ level: "warning", text: `${crossing.id}: seguridad activa filtrando verdes incompatibles.` });
    if (signal && unsafeVehicleGreen(crossing, signal)) issues.push({ level: "error", text: `${crossing.id}: verde vehicular simultáneo N/S y E/O detectado.` });

    if (!crossing.hardware.ioModuleOk) issues.push({ level: "error", text: `${crossing.id}: módulo E/S en fallo.` });
    if (!crossing.hardware.loopDetectorOk) issues.push({ level: "warning", text: `${crossing.id}: detector de lazos en fallo.` });
    if (!crossing.hardware.cameraOk) issues.push({ level: "warning", text: `${crossing.id}: subsistema de cámara en fallo.` });
    if (Object.keys(crossing.hardware.opticFaults).length) issues.push({ level: "error", text: `${crossing.id}: ópticas con avería/sin consumo.` });
    crossing.cameras.forEach((camera) => {
      if (!camera.direction) issues.push({ level: "warning", text: `${crossing.id}/${camera.id}: cámara sin dirección.` });
      if (camera.enabled && !camera.ok) issues.push({ level: "warning", text: `${crossing.id}: cámara activa ${camera.id} está en fallo.` });
    });

    if (!settings.loopsEnabled && (crossing.queues.NS > 0 || crossing.queues.EW > 0)) {
      issues.push({ level: "info", text: `${crossing.id}: hay colas, pero los lazos están desactivados globalmente.` });
    }
  });

  manualLinks.forEach((link) => {
    if (!crossings.some((c) => c.id === link.from) || !crossings.some((c) => c.id === link.to)) {
      issues.push({ level: "error", text: `Enlace inválido ${link.from} → ${link.to}.` });
    }
  });

  corridorIds.forEach((id) => {
    if (!crossings.some((c) => c.id === id)) issues.push({ level: "error", text: `Corredor contiene cruce inexistente ${id}.` });
  });

  if (!settings.linkedMode) issues.push({ level: "info", text: "Coordinación global desactivada." });
  if (!settings.cameraEnabled) issues.push({ level: "info", text: "Cámaras desactivadas en cálculo adaptativo." });

  return issues;
}


function safeAction(fn, label = "acción") {
  return () => {
    if (typeof fn === "function") return fn();
    console.warn(`Acción no disponible: ${label}`);
    return undefined;
  };
}

function Panel({ children, className = "" }) {
  return <div className={`panel ${className}`}>{children}</div>;
}

function Button({ children, onClick, variant = "primary", disabled = false, type = "button", title = "", className = "" }) {
  return <button type={type} onClick={onClick} disabled={disabled} title={title} className={`btn btn-${variant} ${className}`.trim()}>{children}</button>;
}

function PermissionButton({ children, role, permission, onDenied, onClick, action = "", variant = "primary", disabled = false, type = "button", className = "" }) {
  const allowed = roleHasPermission(role, permission);
  const reason = !allowed ? permissionReason(role, permission) : "";

  return (
    <Button
      type={type}
      onClick={(event) => {
        if (disabled) return;
        if (!allowed) {
          onDenied?.(permission, action || String(children || "accion"));
          return;
        }
        onClick?.(event);
      }}
      disabled={disabled}
      title={disabled ? "No disponible en este estado." : reason}
      variant={variant}
      className={!allowed ? `permission-disabled ${className}`.trim() : className}
    >
      {children}
    </Button>
  );
}

function PermissionNote({ role, permission, compact = false }) {
  if (roleHasPermission(role, permission)) return null;
  return <div className={compact ? "permission-note compact" : "permission-note"}>{permissionReason(role, permission)}</div>;
}

function HelpButton({ title, items = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="help-button-wrap">
      <button type="button" className="help-button" onClick={() => setOpen((value) => !value)} aria-label={`Ayuda: ${title}`}>?</button>
      {open && (
        <div className="help-popover">
          <div className="help-popover-title">
            <strong>{title}</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar ayuda">x</button>
          </div>
          <ul>
            {items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function Pill({ children, className = "" }) {
  return <span className={`pill ${className}`}>{children}</span>;
}

function Lamp({ state }) {
  const cls = state === "green" ? "lamp-green" : state === "amber" ? "lamp-amber" : "lamp-red";
  return <span className={`lamp ${cls}`} />;
}

function TinyOptics({ signal }) {
  const entries = Object.entries(signal.groupStates).slice(0, 6);
  return (
    <div className="tiny-optics">
      {entries.map(([id, state]) => <Lamp key={id} state={state} />)}
    </div>
  );
}

function MapClickHandler({ addMode, onAdd }) {
  useMapEvents({
    click(event) {
      if (addMode) onAdd(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}


function representativeDirectionForGroup(group) {
  const text = `${group.id} ${group.name}`.toLowerCase();
  if (text.includes("este") || text.includes("oeste") || text.includes("e/o") || text.includes("ew")) return "EW";
  if (text.includes("norte") || text.includes("sur") || text.includes("n/s") || text.includes("ns")) return "NS";
  if (group.id === "V2") return "EW";
  if (group.id === "V1") return "NS";
  return "OTHER";
}

function activeVehicleDirections(crossing, signal) {
  const dirs = new Set();
  crossing.geometry.signalGroups.forEach((group) => {
    if (group.type === "pedestrian") return;
    if (signal.groupStates[group.id] !== "green") return;
    dirs.add(representativeDirectionForGroup(group));
  });
  return [...dirs];
}

function unsafeVehicleGreen(crossing, signal) {
  if (crossing.geometry.geometryType === "PEDESTRIAN") return false;

  const greenNonPed = crossing.geometry.signalGroups
    .filter((group) => group.type !== "pedestrian" && signal.groupStates[group.id] === "green")
    .map((group) => group.id);

  // Plantilla especial: la vía principal puede ir en verde junto al giro.
  // Lo que no puede ocurrir es mezclar eso con la transversal V2.
  if (crossing.geometry.geometryType === "MAIN_WITH_TURN") {
    const mainOrTurnGreen = greenNonPed.includes("V1") || greenNonPed.includes("G1");
    const transverseGreen = greenNonPed.includes("V2");
    return mainOrTurnGreen && transverseGreen;
  }

  const dirs = activeVehicleDirections(crossing, signal).filter((dir) => dir === "NS" || dir === "EW");
  return dirs.includes("NS") && dirs.includes("EW");
}

function opticsConflict(crossing, signal) {
  if (signal.safetyFiltered) return true;
  if (unsafeVehicleGreen(crossing, signal)) return true;
  const greenGroups = Object.entries(signal.groupStates).filter(([, state]) => state === "green").map(([id]) => id);
  return crossing.geometry.conflicts.some(([a, b]) => greenGroups.includes(a) && greenGroups.includes(b));
}

function primaryCorridorGroup(crossing) {
  return crossing.geometry.signalGroups.find((group) => group.type !== "pedestrian") || crossing.geometry.signalGroups[0];
}

function isPrimaryGreen(crossing, signal) {
  const group = primaryCorridorGroup(crossing);
  return group ? signal.groupStates[group.id] === "green" : false;
}

function markerStateColor(state) {
  if (state === "green") return "#22c55e";
  if (state === "amber") return "#f59e0b";
  return "#ef4444";
}

function markerGroupIcon(type) {
  if (type === "pedestrian") return "🚶";
  if (type === "bus") return "🚌";
  if (type === "bike") return "🚲";
  if (type === "turn") return "↰";
  return "🚗";
}

function markerGeometryIcon(type) {
  if (type === "PEDESTRIAN") return "🚶";
  if (type === "T") return "┬";
  if (type === "ROUNDABOUT") return "⭕";
  if (type === "PROTECTED_TURN") return "↰";
  if (type === "MAIN_WITH_TURN") return "↱";
  if (type === "ACCESS") return "↔";
  return "✕";
}

function markerModeIcon(crossing) {
  if (crossing.operatorManual) return "🖐";
  if (crossing.localMode) return "🏠";
  if (crossing.linked) return "🔗";
  return "○";
}

function markerHealthIcon(crossing) {
  const level = healthLevel(crossing.hardware);
  if (level === "fault") return "⛔";
  if (level === "warning") return "⚠";
  return "✓";
}

function markerIcon(crossing, signal, selected, inCorridor, order, linkMode, linkStartId) {
  const level = healthLevel(crossing.hardware);
  const border = crossing.id === linkStartId
    ? "#60a5fa"
    : opticsConflict(crossing, signal) || level === "fault"
    ? "#ef4444"
    : level === "warning"
    ? "#f59e0b"
    : "#22c55e";

  const bg = selected ? "rgba(16,185,129,.96)" : "rgba(2,6,23,.94)";
  const route = inCorridor ? `<span style="position:absolute;right:-7px;top:-7px;background:#34d399;color:#020617;border-radius:999px;padding:2px 6px;font-size:10px;font-weight:900;border:1px solid rgba(2,6,23,.8)">#${order + 1}</span>` : "";
  const mode = crossing.operatorManual ? "🖐" : crossing.localMode ? "🏠" : crossing.linked ? "🔗" : "○";
  const fault = opticsConflict(crossing, signal) ? "⚠" : level === "fault" ? "⛔" : level === "warning" ? "⚠" : "";
  const geom = markerGeometryIcon(crossing.geometry.geometryType);

  const lamps = crossing.geometry.signalGroups.slice(0, 6).map((group) => {
    const state = signal.groupStates[group.id] || "red";
    const color = markerStateColor(state);
    const icon = markerGroupIcon(group.type);
    return `
      <div title="${group.id} · ${group.name}" style="display:flex;align-items:center;gap:2px;height:17px">
        <span style="font-size:13px;line-height:1">${icon}</span>
        <span style="width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 7px ${color};display:inline-block"></span>
      </div>`;
  }).join("");

  const extra = crossing.geometry.signalGroups.length > 6 ? `<span style="font-size:9px;color:#94a3b8">+${crossing.geometry.signalGroups.length - 6}</span>` : "";
  const title = `${crossing.id} · ${crossing.name} · ${GEOMETRIES[crossing.geometry.geometryType]}`;

  const html = `
    <div title="${title}" style="
      position:relative;width:76px;min-height:78px;border-radius:20px;
      background:${bg};border:2px solid ${border};box-shadow:0 10px 24px rgba(0,0,0,.38);
      color:white;font-family:system-ui,sans-serif;padding:6px;">
      ${route}
      <div style="display:flex;align-items:center;justify-content:space-between;gap:2px">
        <strong style="font-size:16px;line-height:1">${crossing.id}</strong>
        <span style="font-size:14px">${geom}</span>
        <span style="font-size:12px">${mode}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:2px;margin-top:5px;align-items:center;justify-items:center">
        ${lamps}${extra}
      </div>
      ${fault ? `<div style="position:absolute;left:-7px;bottom:-7px;border-radius:999px;background:#ef4444;color:white;font-size:11px;padding:2px 5px;border:1px solid rgba(2,6,23,.8)">${fault}</div>` : ""}
    </div>`;

  return L.divIcon({ html, className: "", iconSize: [82, 88], iconAnchor: [41, 44] });
}


function LeafletMapView({
  crossings,
  signals,
  selectedId,
  corridorIds,
  addMode,
  linkMode,
  linkStartId,
  manualLinks,
  settings,
  onAdd,
  onSelect,
  onMove,
  onToggleCorridor,
  onMarkerLinkClick,
}) {
  const corridor = corridorIds.map((id) => crossings.find((c) => c.id === id)).filter(Boolean);
  const corridorLine = corridor.map((c) => [c.lat, c.lng]);

  const manualLines = manualLinks
    .map((link) => {
      const from = crossings.find((c) => c.id === link.from);
      const to = crossings.find((c) => c.id === link.to);
      if (!from || !to) return null;
      return { key: `${link.from}-${link.to}`, positions: [[from.lat, from.lng], [to.lat, to.lng]] };
    })
    .filter(Boolean);

  return (
    <Panel className="map-panel">
      <div className="panel-header">
        <div>
          <h2>Mapa operativo</h2>
          <p>Minimapa limpio: iconos de semáforo/peatón con lámparas de color, sin tarjetas grandes.</p>
        </div>
        <span className="tag">{crossings.length} cruce(s)</span>
      </div>

      <div className="map-shell">
        <MapContainer center={CENTER} zoom={15} scrollWheelZoom className="leaflet-map" doubleClickZoom={false}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler addMode={addMode} onAdd={onAdd} />

          {settings.showManualLinks && manualLines.map((line) => (
            <Polyline key={line.key} positions={line.positions} pathOptions={{ color: "#60a5fa", weight: 5 }} />
          ))}

          {settings.showCorridor && corridorLine.length >= 2 && (
            <Polyline positions={corridorLine} pathOptions={{ color: "#10b981", weight: 6, dashArray: "8 8" }} />
          )}

          {crossings.map((crossing) => {
            const signal = signals[crossing.id];
            const inCorridor = corridorIds.includes(crossing.id);
            const order = corridorIds.indexOf(crossing.id);

            return (
              <Marker
                key={crossing.id}
                position={[crossing.lat, crossing.lng]}
                draggable
                icon={markerIcon(crossing, signal, selectedId === crossing.id, inCorridor, order, linkMode, linkStartId)}
                eventHandlers={{
                  click: () => {
                    if (linkMode) onMarkerLinkClick(crossing.id);
                    else onSelect(crossing.id);
                  },
                  dragend: (event) => {
                    const latlng = event.target.getLatLng();
                    onMove(crossing.id, latlng.lat, latlng.lng);
                  },
                }}
              >
                <Popup>
                  <div style={{ minWidth: 260 }}>
                    <strong>{crossing.name}</strong><br />
                    ID: {crossing.id}<br />
                    Tipo: {GEOMETRIES[crossing.geometry.geometryType]}<br />
                    Grupos: {crossing.geometry.signalGroups.length}<br />
                    Fases: {crossing.geometry.phases.length}<br />
                    Cámaras: {crossing.cameras.length}<br />
                    <button onClick={() => onToggleCorridor(crossing.id)} style={{ marginTop: 8, padding: "6px 10px" }}>
                      {inCorridor ? "Quitar corredor" : "Añadir corredor"}
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </Panel>
  );
}

function Check({ label, value, set, disabled = false, title = "" }) {
  return (
    <label className="check">
      {label}
      <input type="checkbox" checked={value} disabled={disabled} title={title} onChange={(event) => set(event.target.checked)} />
    </label>
  );
}

function Info({ title, value }) {
  return <div className="info"><div className="muted">{title}</div><strong>{value}</strong></div>;
}

function Queue({ title, value }) {
  return (
    <div className="queue">
      <div className="row small"><span>{title}</span><span>{Math.round(value)}</span></div>
      <div className="bar"><div style={{ width: `${clamp((value / MAX_QUEUE) * 100, 0, 100)}%` }} /></div>
    </div>
  );
}

function Optic({ label, state }) {
  return (
    <div className="optic-card">
      <div className="muted">{label}</div>
      <div className="optic-row"><Lamp state={state} /><strong>{String(state).toUpperCase()}</strong></div>
    </div>
  );
}

function ControlPanel({
  selected,
  settings,
  setSettings,
  corridorIds,
  manualLinks,
  linkMode,
  linkStartId,
  onToggleManual,
  onToggleCorridor,
  onUpdateSelected,
  onRenameCrossingId,
  onSetGeometry,
  onSetLinkMode,
  onClearLinkStart,
  onRemoveAllLinks,
}) {
  const selectedLinks = manualLinks.filter((link) => link.from === selected.id || link.to === selected.id);
  const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);
  const [showOperationInfo, setShowOperationInfo] = useState(false);
  const [showLinkInfo, setShowLinkInfo] = useState(false);
  const [showViewInfo, setShowViewInfo] = useState(false);
  const [idDraft, setIdDraft] = useState(selected.id);
  useEffect(() => { setIdDraft(selected.id); }, [selected.id]);
  const inCorridor = corridorIds.includes(selected.id);

  return (
    <Panel className="crossing-control-wide">
      <div className="wide-panel-header">
        <div>
          <h2>Control del cruce</h2>
          <p>{selected.id} · {selected.name}</p>
        </div>
        <span className="tag">{selected.operatorManual ? "Manual" : selected.localMode ? "Local" : selected.linked ? "Auto vinculado" : "Auto"}</span>
      </div>

      <div className="crossing-control-wide-grid">
        <section className="wide-control-card identity-card compact-identity-card">
        <div className="identity-card-title-row">
          <h3>Identificación</h3>
          <button type="button" className="info-mini-button identity-info-button" onClick={() => setShowTechnicalInfo((value) => !value)} title="Información del ID técnico">?</button>
        </div>

        <div className="identity-clean-grid">
          <label className="compact-field">
            <span>Nombre del cruce</span>
            <input
              value={selected.name}
              onChange={(event) => onUpdateSelected("name", event.target.value)}
            />
          </label>

          <label className="compact-field">
            <span>Geometría</span>
            <select value={geometryValue(selected.geometry)} onChange={(event) => onUpdateSelected("geometry", event.target.value)}>
              {GEOMETRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="compact-field">
            <span>ID del cruce</span>
            <input
              value={idDraft}
              onFocus={(event) => event.currentTarget.select()}
              title="Puedes borrar el campo para escribir desde cero. Si sales vacío, se conserva el ID anterior."
              onChange={(event) => {
                setIdDraft(sanitizeCrossingIdDraft(event.target.value));
              }}
              onBlur={() => {
                if (idDraft.trim().length === 0) {
                  setIdDraft(selected.id);
                  return;
                }
                const safeId = sanitizeCrossingId(idDraft, selected.id);
                setIdDraft(safeId);
                onRenameCrossingId(selected.id, safeId);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
            />
          </label>
        </div>

        {showTechnicalInfo && (
          <div className="info-popover identity-info-popover">
            <button type="button" className="info-popover-close" onClick={() => setShowTechnicalInfo(false)}>×</button>
            <strong>Información del ID técnico</strong>
            <p>El nombre identifica el cruce para el usuario. La geometría define el tipo de cruce: X para varias vías, I para vía única de doble sentido, T para vía principal con secundaria lateral, rotonda o giro protegido. El ID del cruce sirve como referencia interna para guardado, enlaces, sincronización y exportación.</p>
          </div>
        )}
      </section>

        <section className="wide-control-card operation-card help-card">
          <div className="help-card-title-row">
            <h3>Operación</h3>
            <button type="button" className="info-mini-button help-info-button" onClick={() => setShowOperationInfo((value) => !value)} title="Información de Operación">?</button>
          </div>
          {showOperationInfo && (
            <div className="info-popover control-info-popover">
              <button type="button" className="info-popover-close" onClick={() => setShowOperationInfo(false)}>×</button>
              <strong>Operación</strong>
              <p>Gestiona el modo de trabajo del cruce: manual por persona, automático, pertenencia al corredor y desfase/offset para sincronización.</p>
            </div>
          )}
          <div className="button-grid compact-wide-buttons">
            <Button onClick={onToggleManual} variant={selected.operatorManual ? "danger" : "secondary"}>
              {selected.operatorManual ? "Volver AUTO" : "Manual persona"}
            </Button>
            <Button onClick={() => onToggleCorridor(selected.id)}>
              {inCorridor ? "Quitar corredor" : "Añadir corredor"}
            </Button>
          </div>
          <label className="field">
            Offset: +{selected.offset}s
            <input type="range" min="0" max="90" value={selected.offset} onChange={(event) => onUpdateSelected("offset", Number(event.target.value))} />
          </label>
        </section>

        <section className="wide-control-card link-card compact-link-card help-card">
          <div className="help-card-title-row">
            <h3>Unir cruces manualmente</h3>
            <button type="button" className="info-mini-button help-info-button" onClick={() => setShowLinkInfo((value) => !value)} title="Información de Unir cruces">?</button>
          </div>
          {showLinkInfo && (
            <div className="info-popover control-info-popover">
              <button type="button" className="info-popover-close" onClick={() => setShowLinkInfo(false)}>×</button>
              <strong>Unir cruces manualmente</strong>
              <p>Activa el modo de unión y pulsa dos cruces del mapa para crear o quitar un enlace directo. Cancelar limpia la selección y Borrar enlaces elimina los enlaces manuales.</p>
            </div>
          )}
          <div className="button-grid compact-wide-buttons compact-link-actions">
            <Button onClick={() => onSetLinkMode(!linkMode)} variant={linkMode ? "warning" : "secondary"}>
              {linkMode ? "Modo unir ON" : "Modo unir cruces"}
            </Button>
            <Button onClick={onClearLinkStart} variant="secondary">Cancelar</Button>
            <Button onClick={onRemoveAllLinks} variant="danger">Borrar enlaces</Button>
          </div>
          <div className="notice compact-notice">
            {linkMode
              ? linkStartId
                ? `Seleccionado ${linkStartId}. Pulsa otro cruce para unir/quitar.`
                : "Pulsa el primer cruce que quieres unir."
              : "Modo unir desactivado."}
          </div>
          <div className="muted">Enlaces del cruce seleccionado: {selectedLinks.length}</div>
        </section>

        <section className="wide-control-card view-card help-card">
          <div className="help-card-title-row">
            <h3>Vista y cálculo</h3>
            <button type="button" className="info-mini-button help-info-button" onClick={() => setShowViewInfo((value) => !value)} title="Información de Vista y cálculo">?</button>
          </div>
          {showViewInfo && (
            <div className="info-popover control-info-popover view-info-popover">
              <button type="button" className="info-popover-close" onClick={() => setShowViewInfo(false)}>×</button>
              <strong>Vista y cálculo</strong>
              <ul>
                <li><b>Control adaptativo:</b> ajusta verdes según demanda.</li>
                <li><b>Coordinación activa:</b> usa offsets y corredor.</li>
                <li><b>Tráfico automático:</b> genera flujo simulado.</li>
                <li><b>Lazos virtuales:</b> usa detectores de parada, medio y largo.</li>
                <li><b>Cámaras en cálculo:</b> considera cola/visión simulada.</li>
                <li><b>Ver corredor:</b> muestra la ruta sincronizada.</li>
                <li><b>Ver enlaces manuales:</b> muestra uniones creadas.</li>
              </ul>
            </div>
          )}
          <div className="checks compact-wide-checks">
            <Check label="Control adaptativo" value={settings.adaptive} set={(value) => setSettings((old) => ({ ...old, adaptive: value }))} />
            <Check label="Coordinación activa" value={settings.linkedMode} set={(value) => setSettings((old) => ({ ...old, linkedMode: value }))} />
            <Check label="Tráfico automático" value={settings.autoTraffic} set={(value) => setSettings((old) => ({ ...old, autoTraffic: value }))} />
            <Check label="Lazos virtuales" value={settings.loopsEnabled} set={(value) => setSettings((old) => ({ ...old, loopsEnabled: value }))} />
            <Check label="Cámaras en cálculo" value={settings.cameraEnabled} set={(value) => setSettings((old) => ({ ...old, cameraEnabled: value }))} />
            <Check label="Ver corredor" value={settings.showCorridor} set={(value) => setSettings((old) => ({ ...old, showCorridor: value }))} />
            <Check label="Ver enlaces manuales" value={settings.showManualLinks} set={(value) => setSettings((old) => ({ ...old, showManualLinks: value }))} />
          </div>
        </section>
      </div>
    </Panel>
  );
}

function GlobalSettingsPanel({ settings, setSettings, selected, onFaultMode, onSafeStep, onClearActiveQueue, onSetRegulatorMode, onSetLocalMode }) {
  const status = selected.operatorManual ? "Manual persona" : selected.localMode ? "Automático local" : "Automático remoto";

  return (
    <Panel className="regulator-control-panel">
      <div className="panel-header">
        <div>
          <h2>Centro de control del regulador</h2>
          <p>Se aplica al regulador/cruce seleccionado. Compactado para ganar espacio bajo el mapa.</p>
        </div>
        <span className="tag">{status}</span>
      </div>

      <div className="regulator-control-layout">
        <div className="control-block global-settings-block">
          <h3>Ajustes globales</h3>
          <div className="checks compact-checks">
            <Check label="Coordinación activa" value={settings.linkedMode} set={(value) => setSettings((old) => ({ ...old, linkedMode: value }))} />
            <Check label="Manual asistido" value={settings.manualAssist} set={(value) => setSettings((old) => ({ ...old, manualAssist: value }))} />
            <Check label="Control adaptativo" value={settings.adaptive} set={(value) => setSettings((old) => ({ ...old, adaptive: value }))} />
            <Check label="Lazos virtuales" value={settings.loopsEnabled} set={(value) => setSettings((old) => ({ ...old, loopsEnabled: value }))} />
            <Check label="Cámara virtual" value={settings.cameraEnabled} set={(value) => setSettings((old) => ({ ...old, cameraEnabled: value }))} />
            <Check label="Llegadas automáticas" value={settings.autoTraffic} set={(value) => setSettings((old) => ({ ...old, autoTraffic: value }))} />
          </div>

          <label className="field compact-discharge">
            Descarga en verde: {settings.dischargeRate} veh/s
            <input type="range" min="1" max="3" value={settings.dischargeRate} onChange={(event) => setSettings((old) => ({ ...old, dischargeRate: Number(event.target.value) }))} />
          </label>
        </div>

        <div className="regulator-action-grid">
          <div className="control-block control-mini-card">
            <h3>Selector del regulador</h3>
            <div className="button-grid compact-buttons">
              <Button onClick={() => onSetRegulatorMode(selected.id, false)}>Automático remoto</Button>
              <Button onClick={() => onSetLocalMode(selected.id, true)} variant="secondary">Automático local</Button>
              <Button onClick={() => onSetRegulatorMode(selected.id, true)} variant="danger">Manual persona</Button>
              <Button onClick={() => onSetLocalMode(selected.id, false)} variant="warning">Salir local</Button>
            </div>
            <div className="notice">Estado: {status}</div>
          </div>

          <div className="control-block control-mini-card">
            <h3>Intervención rápida</h3>
            <div className="button-grid compact-buttons">
              <Button onClick={onSafeStep} variant="warning" disabled={!settings.manualAssist}>Avanzar etapa segura</Button>
              <Button onClick={onClearActiveQueue} variant="secondary" disabled={!settings.manualAssist}>Priorizar cola activa</Button>
              <Button onClick={onFaultMode} variant="danger">Avería local</Button>
            </div>
            <p className="muted">Acciones rápidas con secuencia segura: verde → ámbar → todo rojo.</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function TrafficDemandPanel({ selected, onVehicle, onPedestrian, onArrivalRate, onDemandPlan, onDemandFactor }) {
  const [showTrafficInfo, setShowTrafficInfo] = useState(false);
  const demandPlan = getDemandPlan(selected);
  const demandFactor = getDemandFactor(selected);
  const nsEffective = effectiveArrival(selected, "NS");
  const ewEffective = effectiveArrival(selected, "EW");
  const nsDemand = clamp(Math.round((nsEffective / 45) * 100), 0, 100);
  const ewDemand = clamp(Math.round((ewEffective / 45) * 100), 0, 100);
  const nsTraffic = Math.round(nsEffective * 34.3);
  const ewTraffic = Math.round(ewEffective * 32.5);

  return (
    <Panel className="traffic-summary-panel traffic-help-panel">
      <div className="traffic-title-row">
        <h2>Tráfico y demanda · {selected.name || "cruce seleccionado"}</h2>
        <button type="button" className="info-mini-button traffic-info-button" onClick={() => setShowTrafficInfo((value) => !value)} title="Información de Tráfico y demanda">?</button>
      </div>

      {showTrafficInfo && (
        <div className="info-popover traffic-info-popover">
          <button type="button" className="info-popover-close" onClick={() => setShowTrafficInfo(false)}>×</button>
          <strong>Tráfico y demanda</strong>
          <ul>
                <li><b>Demanda actual:</b> porcentaje calculado con llegadas base, plan activo y factor de ajuste.</li>
                <li><b>Tráfico actual:</b> estimación en vehículos/hora para cada eje del cruce.</li>
                <li><b>Plan de demanda activo:</b> escenario base: laborable, fin de semana, hora punta, nocturno o manual.</li>
                <li><b>Factor de ajuste:</b> margen manual aplicado encima del plan. No sustituye al plan; lo afina.</li>
                <li><b>Llegadas base simuladas:</b> flujo simulado de laboratorio. En un sistema real vendría de lazos, cámaras o IA.</li>
                <li><b>Pruebas manuales:</b> +1, +5 y -3 solo modifican cola simulada para probar el algoritmo.</li>
                <li><b>Peatón:</b> simula pulsador peatonal; más adelante puede combinarse con cámara/IA.</li>
              </ul>
        </div>
      )}

      <div className="traffic-summary-grid">
        <div className="traffic-summary-card">
          <h3>Demanda actual</h3>
          <div className="traffic-line">
            <span>Norte / Sur</span>
            <div className="traffic-bar"><i style={{ width: `${nsDemand}%` }} /></div>
            <b>{nsDemand}%</b>
          </div>
          <div className="traffic-line">
            <span>Este / Oeste</span>
            <div className="traffic-bar"><i style={{ width: `${ewDemand}%` }} /></div>
            <b>{ewDemand}%</b>
          </div>
        </div>

        <div className="traffic-summary-card">
          <h3>Tráfico actual</h3>
          <div className="traffic-metric">
            <span>Norte / Sur</span>
            <b>{nsTraffic} veh/h</b>
          </div>
          <div className="traffic-metric">
            <span>Este / Oeste</span>
            <b>{ewTraffic} veh/h</b>
          </div>
        </div>

        <div className="traffic-summary-card traffic-plan-card">
          <h3>Plan de demanda activo</h3>
          <select value={demandPlan} onChange={(event) => onDemandPlan(selected.id, event.target.value)}>
            {DEMAND_PLAN_OPTIONS.map((plan) => (
              <option key={plan.value} value={plan.value}>{plan.label}</option>
            ))}
          </select>
          <div className="traffic-small-note">Activo: {demandPlanLabel(demandPlan)}</div>
        </div>

        <div className="traffic-summary-card traffic-factor-card">
          <h3>Factor de ajuste</h3>
          <div className="factor-row editable-factor-row">
            <input
              type="number"
              min="25"
              max="250"
              value={demandFactor}
              onChange={(event) => onDemandFactor(selected.id, Number(event.target.value))}
            />
            <b>%</b>
          </div>
          <input
            className="traffic-factor-slider"
            type="range"
            min="25"
            max="250"
            step="5"
            value={demandFactor}
            onChange={(event) => onDemandFactor(selected.id, Number(event.target.value))}
          />
        </div>
      </div>

      <div className="traffic-adjust-grid">
        {(["NS", "EW"]).map((direction) => (
          <div key={direction} className="traffic-adjust-card">
            <h3>{direction === "NS" ? "Norte/Sur" : "Este/Oeste"}</h3>
            <label>
              Llegadas base simuladas: {selected.arrivals[direction]} veh/min · efectivas: {effectiveArrival(selected, direction)} veh/min
              <input type="range" min="0" max="45" value={selected.arrivals[direction]} onChange={(event) => onArrivalRate(selected.id, direction, Number(event.target.value))} />
            </label>
            <div className="traffic-adjust-actions">
              <Button onClick={() => onVehicle(selected.id, direction, 1)}>+1 prueba</Button>
              <Button onClick={() => onVehicle(selected.id, direction, 5)} variant="secondary">+5 cola</Button>
              <Button onClick={() => onVehicle(selected.id, direction, -3)} variant="danger">-3 cola</Button>
              <Button onClick={() => onPedestrian(selected.id, direction)} variant="warning">Peatón / pulsador</Button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DetectorPanel({ selected, settings }) {
  const rows = [
    { direction: "NS", label: "Norte/Sur" },
    { direction: "EW", label: "Este/Oeste" },
  ];

  return (
    <Panel className="detectors-rail-panel">
      <h2>Detectores · {selected.name || "cruce seleccionado"}</h2>
      <div className="detectors-rail-list">
        {rows.map(({ direction, label }) => {
          const queue = selected.queues[direction];
          const stopLoop = settings.loopsEnabled && queue >= 1;
          const midLoop = settings.loopsEnabled && queue >= 8;
          const longLoop = settings.loopsEnabled && queue >= 16;
          const cameraQueueMeters = settings.cameraEnabled ? Math.round(queue * 5.5) : 0;
          const exitBlocked = settings.cameraEnabled && queue >= 25;

          const cell = (name, active) => (
            <div className={active ? "detector-rail-cell active" : "detector-rail-cell"}>
              <span>{name}</span>
              <b>{active ? "Activo" : "Libre"}</b>
            </div>
          );

          return (
            <section key={direction} className="detector-rail-direction">
              <h3>{label}</h3>
              <div className="detector-rail-grid">
                {cell("Lazo parada", stopLoop)}
                {cell("Lazo medio", midLoop)}
                {cell("Lazo largo", longLoop)}
              </div>
              <div className="detector-rail-summary">
                <span>Cola: <b>{queue}</b> veh.</span>
                <span>Cámara: <b>{settings.cameraEnabled ? `${cameraQueueMeters} m` : "OFF"}</b></span>
                <span className={exitBlocked ? "danger-text" : "ok-text"}>{exitBlocked ? "Salida saturada" : "Salida libre"}</span>
              </div>
            </section>
          );
        })}
      </div>
    </Panel>
  );
}

function CameraPanel({ selected, settings, onToggleCamera, onToggleCameraOk, onAddCamera, onRemoveCamera }) {
  const [cameraPage, setCameraPage] = useState(0);
  const cameras = selected.cameras || [];
  const maxPage = Math.max(0, cameras.length - 3);
  const visibleCameras = cameras.slice(cameraPage, cameraPage + 3);

  useEffect(() => {
    setCameraPage(0);
  }, [selected.id]);

  useEffect(() => {
    setCameraPage((page) => Math.min(page, Math.max(0, cameras.length - 3)));
  }, [cameras.length]);

  return (
    <Panel className="camera-contained-panel">
      <div className="panel-header camera-contained-header">
        <div>
          <h2>Cámaras del cruce · {selected.name || "cruce seleccionado"}</h2>
          <p>Vista simulada de cámaras asociadas al cruce seleccionado. Flechas dentro del recuadro.</p>
        </div>
        <div className="camera-header-actions">
          <Button onClick={() => onAddCamera(selected.id)}>+ Añadir cámara</Button>
          <span className="tag">{cameras.length} cámara(s)</span>
        </div>
      </div>

      {cameras.length === 0 ? (
        <div className="camera-empty-state">
          <strong>Sin cámaras añadidas</strong>
          <span>Este cruce no trae cámaras por defecto. Añade una cámara para empezar.</span>
          <Button onClick={() => onAddCamera(selected.id)}>+ Añadir primera cámara</Button>
        </div>
      ) : (
        <div className="camera-contained-carousel">
          <button
            className="camera-inside-arrow left"
            onClick={() => setCameraPage((page) => Math.max(0, page - 1))}
            disabled={cameraPage <= 0}
            title="Cámaras anteriores"
          >
            ‹
          </button>

          <div className="camera-contained-track">
            {visibleCameras.map((camera) => (
              <div key={camera.id} className="camera-card camera-contained-card">
                <button
                  className="camera-remove-x"
                  onClick={() => onRemoveCamera(selected.id, camera.id)}
                  title={`Quitar ${camera.name}`}
                >
                  ×
                </button>
                <div className="camera-screen">
                  <div className="camera-road">
                    <div className="lane-line" />
                    {Array.from({ length: clamp(camera.vehicles, 0, 12) }).map((_, index) => (
                      <span key={index} className="car-dot" style={{ left: `${10 + (index % 6) * 13}%`, top: `${28 + Math.floor(index / 6) * 30}%` }} />
                    ))}
                  </div>
                  <div className="camera-overlay">
                    <strong title={camera.name}>{camera.name}</strong>
                    <span>{camera.enabled ? camera.ok ? "ONLINE" : "FALLO" : "OFF"}</span>
                  </div>
                </div>

                <div className="info-grid camera-info-compact">
                  <Info title="Dirección" value={camera.direction} />
                  <Info title="Vehículos" value={camera.vehicles} />
                  <Info title="Cola" value={`${camera.queueMeters} m`} />
                  <Info title="Visibilidad" value={`${camera.confidence}%`} />
                </div>

                <div className="pills camera-status-pills">
                  <Pill className={camera.enabled ? "state-green" : "state-neutral"}>{camera.enabled ? "Activa" : "Desactivada"}</Pill>
                  <Pill className={camera.ok ? "state-green" : "state-red"}>{camera.ok ? "Cámara operativa" : "Cámara con fallo"}</Pill>
                  <Pill className={camera.blockedExit ? "state-red" : "state-green"}>{camera.blockedExit ? "Salida saturada" : "Salida libre"}</Pill>
                </div>

                <div className="button-grid camera-card-actions">
                  <Button onClick={() => onToggleCamera(selected.id, camera.id)} variant="secondary">{camera.enabled ? "Desactivar" : "Activar"}</Button>
                  <Button onClick={() => onToggleCameraOk(selected.id, camera.id)} variant={camera.ok ? "secondary" : "danger"}>{camera.ok ? "Simular fallo" : "Reparar"}</Button>
                </div>
              </div>
            ))}
          </div>

          <button
            className="camera-inside-arrow right"
            onClick={() => setCameraPage((page) => Math.min(maxPage, page + 1))}
            disabled={cameraPage >= maxPage}
            title="Cámaras siguientes"
          >
            ›
          </button>
        </div>
      )}
    </Panel>
  );
}

function HardwareHealthPanel({ selected, onToggleOpticFault, onToggleHardwareFlag }) {
  const hardware = selected.hardware;
  const level = healthLevel(hardware);
  const faultCount = Object.keys(hardware.opticFaults).length;
  const metricClass = (bad) => bad ? "metric warning" : "metric";

  const opticKeys = selected.geometry.signalGroups.flatMap((group) => group.optics.map((optic) => `${group.id}_${optic}`));

  return (
    <Panel>
      <div className="panel-header">
        <div>
          <h2>Estado hardware · {selected.name || "cruce seleccionado"}</h2>
          <p>Diagnóstico de mini PC, E/S, fuente, red, cámaras y ópticas.</p>
        </div>
        <Pill className={healthClass(level)}>{healthText(level)}</Pill>
      </div>

      <div className="hardware-grid">
        <div className={metricClass(hardware.cabinetTemp >= 60)}><span>Armario</span><strong>{hardware.cabinetTemp.toFixed(1)}°C</strong></div>
        <div className={metricClass(hardware.cpuTemp >= 75)}><span>CPU temp.</span><strong>{hardware.cpuTemp.toFixed(1)}°C</strong></div>
        <div className={metricClass(hardware.cpuLoad >= 80)}><span>CPU</span><strong>{hardware.cpuLoad.toFixed(0)}%</strong></div>
        <div className={metricClass(hardware.diskUsage >= 90)}><span>Disco</span><strong>{hardware.diskUsage.toFixed(1)}%</strong></div>
        <div className={metricClass(hardware.voltage24 < 23 || hardware.voltage24 > 25)}><span>Fuente</span><strong>{hardware.voltage24.toFixed(1)}V</strong></div>
        <div className={metricClass(hardware.networkMs > 120)}><span>Red</span><strong>{hardware.networkMs} ms</strong></div>
      </div>

      <div className="demand-grid">
        <button onClick={() => onToggleHardwareFlag(selected.id, "ioModuleOk")} className={hardware.ioModuleOk ? "module ok" : "module fault"}><strong>Módulo E/S</strong><span>{hardware.ioModuleOk ? "Operativo" : "Fallo"}</span></button>
        <button onClick={() => onToggleHardwareFlag(selected.id, "loopDetectorOk")} className={hardware.loopDetectorOk ? "module ok" : "module fault"}><strong>Detector lazos</strong><span>{hardware.loopDetectorOk ? "Operativo" : "Fallo"}</span></button>
        <button onClick={() => onToggleHardwareFlag(selected.id, "cameraOk")} className={hardware.cameraOk ? "module ok" : "module fault"}><strong>Subsistema cámara</strong><span>{hardware.cameraOk ? "Operativo" : "Fallo"}</span></button>
      </div>

      <div className="optic-block">
        <div className="panel-header">
          <h3>Diagnóstico de ópticas por grupo</h3>
          <Pill className={faultCount ? "state-red" : "state-green"}>{faultCount ? `${faultCount} avería(s)` : "sin averías"}</Pill>
        </div>
        <div className="optic-diagnostic-grid">
          {opticKeys.map((key) => {
            const failed = Boolean(hardware.opticFaults[key]);
            return (
              <button key={key} onClick={() => onToggleOpticFault(selected.id, key)} className={failed ? "optic-diagnostic failed" : "optic-diagnostic"}>
                <strong>{key}</strong>
                <span>{failed ? "Fundida / sin consumo" : "OK"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function RulesPanel() {
  return (
    <Panel>
      <h2>Reglas duras</h2>
      <ul className="rule-list">
        <li>No se ejecutan verdes conflictivos: el motor filtra grupos incompatibles.</li>
        <li>Ámbar bloquea peatones.</li>
        <li>Todo rojo separa fases.</li>
        <li>Verde mínimo y máximo obligatorios.</li>
        <li>Modo manual/persona deja al PC en supervisión.</li>
        <li>Manual asistido no salta directamente entre verdes incompatibles.</li>
        <li>El estado hardware puede forzar aviso o avería.</li>
        <li>El sistema sigue siendo simulación educativa/laboratorio.</li>
      </ul>
    </Panel>
  );
}

function SystemCheckPanel({ issues, onRunCheck, activeRole, onPermissionDenied }) {
  const errors = issues.filter((issue) => issue.level === "error").length;
  const warnings = issues.filter((issue) => issue.level === "warning").length;

  return (
    <Panel>
      <div className="panel-header">
        <div>
          <h2>Comprobación del sistema</h2>
          <p>Valida cruces, fases, grupos, enlaces, corredor, hardware y reglas de seguridad.</p>
        </div>
        <div className="panel-tools">
          <HelpButton
            title="Comprobacion del sistema"
            items={[
              "Revisa errores de fases, grupos semaforicos, enlaces, corredor y hardware.",
              "No modifica el sistema; solo actualiza la lista de incidencias.",
              "Queda registrado en Eventos para saber quien ejecuto la revision.",
            ]}
          />
          <PermissionButton role={activeRole} permission="viewSystem" onDenied={onPermissionDenied} onClick={safeAction(onRunCheck, "comprobar")} action="comprobar sistema" variant="warning">Comprobar ahora</PermissionButton>
        </div>
      </div>
      <div className="stats mini">
        <Info title="Errores" value={errors} />
        <Info title="Avisos" value={warnings} />
        <Info title="Total" value={issues.length} />
      </div>
      <div className="log-list">
        {issues.length === 0 ? (
          <div className="log-item ok">Sin incidencias detectadas.</div>
        ) : issues.map((issue, index) => (
          <div key={index} className={`log-item ${issue.level}`}>{issue.text}</div>
        ))}
      </div>
    </Panel>
  );
}

function LogPanel({ log, onClear, activeRole, onPermissionDenied }) {
  return (
    <Panel>
      <div className="panel-header">
        <div>
          <h2>Registro</h2>
          <p>Eventos, errores, acciones manuales y cambios de configuración.</p>
        </div>
        <div className="panel-tools">
          <HelpButton title="Registro de eventos" items={HYDRA_EVENTS_HELP} />
          <PermissionButton role={activeRole} permission="manageUsers" onDenied={onPermissionDenied} onClick={onClear} action="limpiar registro de eventos" variant="secondary">Limpiar</PermissionButton>
        </div>
      </div>
      <div className="log-list">
        {log.map((item, index) => <div key={`${item}-${index}`} className="log-item">{item}</div>)}
      </div>
    </Panel>
  );
}


function trafficGroupIcon(group) {
  const type = group?.type;
  const kind = group?.movementKind;
  if (type === "pedestrian" || kind === "pedestrian_crossing") return "🚶";
  if (type === "bus" || kind === "bus_lane") return "🚌";
  if (type === "bike" || kind === "bike_lane") return "🚲";
  if (type === "turn" || kind === "left_turn" || kind === "right_turn") return "↱";
  if (kind === "warning") return "⚠";
  return "🚦";
}

function movementLabelForGroup(group) {
  const kind = group?.movementKind || defaultMovementKindForType(group?.type || "vehicle");
  return MOVEMENT_KINDS[kind] || "Personalizada";
}

function GeometryEditor({ selected, onUpdateGeometry }) {
  const geometry = selected.geometry;
  const [selectedConfigGroupId, setSelectedConfigGroupId] = useState(geometry.signalGroups[0]?.id || "");
  const selectedConfigGroup = geometry.signalGroups.find((group) => group.id === selectedConfigGroupId) || geometry.signalGroups[0] || null;
  const allSignalHeads = geometry.signalHeads || defaultSignalHeadsForGeometry(geometry.geometryType, geometry.signalGroups);
  const selectedGroupHeads = allSignalHeads.filter((head) => !selectedConfigGroup || head.movement === selectedConfigGroup.id);


  function addGroup(type, useSignalCode = false) {
    const prefix = type === "pedestrian" ? "P" : type === "turn" ? "G" : type === "bus" ? "B" : type === "bike" ? "BI" : "V";
    const id = useSignalCode ? nextSignalCode(geometry.signalGroups) : nextId(geometry.signalGroups, prefix);
    const group = makeGroup(id, `${GROUP_TYPES[type]} ${id}`, type);
    const nextGroups = [...geometry.signalGroups, group];

    const nextConflicts = [...geometry.conflicts];
    if (type === "pedestrian") {
      geometry.signalGroups
        .filter((existing) => existing.type !== "pedestrian")
        .forEach((existing) => nextConflicts.push([existing.id, id]));
    } else {
      geometry.signalGroups
        .filter((existing) => existing.type === "pedestrian")
        .forEach((existing) => nextConflicts.push([existing.id, id]));
    }

    onUpdateGeometry(selected.id, { ...geometry, signalGroups: nextGroups, conflicts: nextConflicts });
    setSelectedConfigGroupId(id);
  }

  function removeGroup(groupId) {
    const nextGroups = geometry.signalGroups.filter((g) => g.id !== groupId);
    const nextPhases = geometry.phases.map((phase) => ({ ...phase, greenGroups: phase.greenGroups.filter((id) => id !== groupId) }));
    const nextConflicts = geometry.conflicts.filter(([a, b]) => a !== groupId && b !== groupId);
    const nextControlGroups = (geometry.controlGroups || []).map((group) => ({
      ...group,
      members: group.members.filter((id) => id !== groupId),
    }));
    const nextSignalHeads = (geometry.signalHeads || []).filter((head) => head.movement !== groupId);
    onUpdateGeometry(selected.id, { ...geometry, signalGroups: nextGroups, phases: nextPhases, conflicts: nextConflicts, controlGroups: nextControlGroups, signalHeads: nextSignalHeads });
    if (selectedConfigGroupId === groupId) setSelectedConfigGroupId(nextGroups[0]?.id || "");
  }

  function updateGroup(groupId, field, value) {
    const nextGroups = geometry.signalGroups.map((g) => {
      if (g.id !== groupId) return g;
      if (field === "type") return { ...g, type: value, movementKind: defaultMovementKindForType(value), optics: groupOptics(value) };
      return { ...g, [field]: value };
    });
    onUpdateGeometry(selected.id, { ...geometry, signalGroups: nextGroups });
  }

  function renameGroupId(oldId, newId) {
    const nextGeometry = replaceGroupIdInGeometry(geometry, oldId, newId);
    onUpdateGeometry(selected.id, nextGeometry);
  }











  function headsForCurrentGeometry() {
    return geometry.signalHeads || defaultSignalHeadsForGeometry(geometry.geometryType, geometry.signalGroups);
  }

  function closedOutputForHead(head) {
    return head.groupType === "pedestrian" ? "ped_red" : "red";
  }

  function openOutputForHead(head) {
    return head.groupType === "pedestrian" ? "ped_green" : "green";
  }

  function outputsAfterGreenGroupChange(phase, groupId, shouldOpen) {
    const outputs = { ...(phase.outputs || {}) };
    headsForCurrentGeometry()
      .filter((head) => head.movement === groupId)
      .forEach((head) => {
        outputs[head.id] = shouldOpen ? openOutputForHead(head) : closedOutputForHead(head);
      });
    return outputs;
  }

  function setPhaseGreenGroups(phaseId, nextGreenGroups) {
    const cleanGreenGroups = [...new Set(nextGreenGroups || [])];

    const nextPhases = sanitizePhases(geometry.phases || []).map((phase) => {
      if (phase.id !== phaseId) return phase;

      const previous = new Set(phase.greenGroups || []);
      const next = new Set(cleanGreenGroups);
      let outputs = { ...(phase.outputs || {}) };

      headsForCurrentGeometry().forEach((head) => {
        if (previous.has(head.movement) && !next.has(head.movement)) {
          outputs[head.id] = closedOutputForHead(head);
        }
        if (!previous.has(head.movement) && next.has(head.movement)) {
          outputs[head.id] = openOutputForHead(head);
        }
      });

      if (cleanGreenGroups.length === 0) outputs = {};

      return {
        ...phase,
        greenGroups: cleanGreenGroups,
        outputs,
      };
    });

    onUpdateGeometry(selected.id, { ...geometry, phases: nextPhases });
  }

  function addPhase() {
    const id = nextPhaseId(geometry.phases);
    const nextPhase = {
      id,
      name: `Nueva fase ${id}`,
      greenGroups: [],
      duration: BASE_GREEN,
      outputs: {},
    };
    onUpdateGeometry(selected.id, {
      ...geometry,
      phases: sanitizePhases([...(geometry.phases || []), nextPhase]),
    });
  }

  function duplicatePhase(phaseId) {
    const source = (geometry.phases || []).find((phase) => phase.id === phaseId);
    if (!source) return;
    const id = nextPhaseId(geometry.phases);
    const copy = {
      ...source,
      id,
      name: `${source.name || source.id} copia`,
      greenGroups: [...(source.greenGroups || [])],
      outputs: { ...(source.outputs || {}) },
    };
    onUpdateGeometry(selected.id, {
      ...geometry,
      phases: sanitizePhases([...(geometry.phases || []), copy]),
    });
  }

  function removePhase(phaseId) {
    const current = sanitizePhases(geometry.phases || []);
    const nextPhases = current.filter((phase) => phase.id !== phaseId);
    onUpdateGeometry(selected.id, {
      ...geometry,
      phases: nextPhases,
    });
  }

  function clearPhase(phaseId) {
    const nextPhases = sanitizePhases(geometry.phases || []).map((phase) =>
      phase.id === phaseId
        ? { ...phase, greenGroups: [], outputs: {} }
        : phase
    );
    onUpdateGeometry(selected.id, { ...geometry, phases: nextPhases });
  }

  function clearPhaseGreenGroups(phaseId) {
    setPhaseGreenGroups(phaseId, []);
  }

  function removePhaseGreenGroup(phaseId, groupId) {
    const phase = (geometry.phases || []).find((item) => item.id === phaseId);
    if (!phase) return;
    setPhaseGreenGroups(phaseId, (phase.greenGroups || []).filter((id) => id !== groupId));
  }

  function updatePhase(phaseId, field, value) {
    const nextPhases = sanitizePhases(geometry.phases || []).map((phase) =>
      phase.id === phaseId ? { ...phase, [field]: value } : phase
    );
    onUpdateGeometry(selected.id, { ...geometry, phases: nextPhases });
  }

  function togglePhaseGroup(phaseId, groupId) {
    const phase = (geometry.phases || []).find((item) => item.id === phaseId);
    if (!phase) return;

    const current = phase.greenGroups || [];
    const nextGreenGroups = current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId];

    setPhaseGreenGroups(phaseId, nextGreenGroups);
  }

  function toggleConflict(a, b) {
    if (a === b) return;
    const key = [a, b].sort().join("::");
    const exists = geometry.conflicts.some(([x, y]) => [x, y].sort().join("::") === key);
    const conflicts = exists
      ? geometry.conflicts.filter(([x, y]) => [x, y].sort().join("::") !== key)
      : [...geometry.conflicts, [a, b]];
    onUpdateGeometry(selected.id, { ...geometry, conflicts });
  }


  function addControlGroup(prefix = "GV", name = "") {
    const currentGroups = sanitizeControlGroups(geometry.controlGroups || []);
    let id;

    if (prefix === "GV") {
      const preferred = ["GV-Principal", "GV-Giro", "GV-Transversal", "GV-Bus", "GV-Bici", "GV-Extra"];
      id = preferred.find((item) => !currentGroups.some((group) => group.id === item)) || `GV-${currentGroups.length + 1}`;
    } else if (prefix === "GP") {
      id = !currentGroups.some((group) => group.id === "GP") ? "GP" : `GP-${currentGroups.length + 1}`;
    } else {
      id = nextId(currentGroups, prefix);
    }

    if (currentGroups.some((group) => group.id === id)) return;

    const nextControlGroups = sanitizeControlGroups([
      ...currentGroups,
      { id, name: name || id.replace("GV-", "Vehículos ").replace("GP", "Grupo peatones"), members: [] },
    ]);

    onUpdateGeometry(selected.id, { ...geometry, controlGroups: nextControlGroups });
  }

  function updateControlGroup(groupId, field, value) {
    const currentGroups = sanitizeControlGroups(geometry.controlGroups || []);

    // El ID interno del grupo queda estable para evitar duplicados al borrar/escribir.
    // Se puede editar el nombre operativo, pero no el código en caliente.
    if (field === "id") return;

    const nextControlGroups = currentGroups.map((group) =>
      group.id === groupId ? { ...group, [field]: value } : group
    );

    onUpdateGeometry(selected.id, { ...geometry, controlGroups: sanitizeControlGroups(nextControlGroups) });
  }

  function removeControlGroup(groupId) {
    const currentGroups = sanitizeControlGroups(geometry.controlGroups || []);
    const nextControlGroups = currentGroups.filter((group) => group.id !== groupId);
    onUpdateGeometry(selected.id, { ...geometry, controlGroups: nextControlGroups });
  }

  function toggleControlGroupMember(groupId, memberId) {
    const currentGroups = sanitizeControlGroups(geometry.controlGroups || []);
    const nextControlGroups = currentGroups.map((group) => {
      if (group.id !== groupId) return group;
      const members = group.members.includes(memberId)
        ? group.members.filter((id) => id !== memberId)
        : [...group.members, memberId];
      return { ...group, members: [...new Set(members)] };
    });
    onUpdateGeometry(selected.id, { ...geometry, controlGroups: sanitizeControlGroups(nextControlGroups) });
  }

  function updatePhaseOutput(phaseId, headId, value) {
    const nextPhases = geometry.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        outputs: {
          ...(phase.outputs || {}),
          [headId]: value,
        },
      };
    });
    onUpdateGeometry(selected.id, { ...geometry, phases: nextPhases });
  }

  function applyIndependentScenarioPreset() {
    onUpdateGeometry(selected.id, createIndependentScenarioGeometry());
  }

  function addPhaseFromControlGroup(controlGroup) {
    const id = `F${geometry.phases.length + 1}`;
    const nextPhase = {
      id,
      name: `Fase ${controlGroup.id} · ${controlGroup.name}`,
      greenGroups: [...controlGroup.members],
      duration: BASE_GREEN,
    };
    onUpdateGeometry(selected.id, { ...geometry, phases: [...geometry.phases, nextPhase] });
  }


  function applyGvGpConvention() {
    const nextControlGroups = defaultControlGroups(geometry.signalGroups || []);
    onUpdateGeometry(selected.id, {
      ...geometry,
      controlGroups: sanitizeControlGroups(nextControlGroups),
    });
  }

  function applyAvEuropaTurnPreset() {
    onUpdateGeometry(selected.id, createAvEuropaTurnGeometry());
  }


  function addSignalHead(groupId = geometry.signalGroups[0]?.id) {
    if (!groupId) return;
    const group = geometry.signalGroups.find((item) => item.id === groupId);
    const heads = geometry.signalHeads || defaultSignalHeadsForGeometry(geometry.geometryType, geometry.signalGroups);
    const id = nextManeuverId(heads);
    const head = makeHead(id, `Maniobra ${id}`, groupId, group?.type || "vehicle", defaultHeadTypeForGroupType(group?.type || "vehicle"));
    onUpdateGeometry(selected.id, { ...geometry, signalHeads: [...heads, head] });
  }

  function updateSignalHead(headId, field, value) {
    const heads = geometry.signalHeads || defaultSignalHeadsForGeometry(geometry.geometryType, geometry.signalGroups);
    const nextHeads = heads.map((head) => {
      if (head.id !== headId) return head;
      if (field === "headType") {
        return {
          ...head,
          headType: value,
          optics: [...(HEAD_TYPES[value]?.defaultOptics || head.optics)],
        };
      }
      if (field === "groupType") {
        return {
          ...head,
          groupType: value,
          headType: defaultHeadTypeForGroupType(value),
          optics: [...(HEAD_TYPES[defaultHeadTypeForGroupType(value)]?.defaultOptics || head.optics)],
        };
      }
      return { ...head, [field]: value };
    });
    onUpdateGeometry(selected.id, { ...geometry, signalHeads: nextHeads });
  }

  function removeSignalHead(headId) {
    const heads = geometry.signalHeads || defaultSignalHeadsForGeometry(geometry.geometryType, geometry.signalGroups);
    onUpdateGeometry(selected.id, { ...geometry, signalHeads: heads.filter((head) => head.id !== headId) });
  }


  return (
    <Panel className="configurator-panel">
      <div className="configurator-header">
        <div>
          <h2>Configurador de Grupos y Maniobras</h2>
          <p>Selecciona un grupo, configura qué maniobra hace y asigna sus maniobras semafóricas. La configuración avanzada queda debajo para no perder funciones.</p>
        </div>
        <span className="configurator-badge">{GEOMETRIES[geometry.geometryType]}</span>
      </div>

      <div className="configurator-section group-section">
        <div className="configurator-section-title">
          <span>1. Configuración de Grupos</span>
          <small>G1, G2, G3… representan grupos del cruce. La posición real se verá con iconos en el mapa.</small>
        </div>

        <div className="configurator-grid">
          <div className="selected-group-card">
            <div className="selected-group-preview">
              <div className="large-signal-icon">{selectedConfigGroup ? trafficGroupIcon(selectedConfigGroup) : "＋"}</div>
              <strong>{selectedConfigGroup?.id || "Sin grupo"}</strong>
              <span>{selectedConfigGroup ? "Grupo activo" : "Crea un grupo"}</span>
            </div>

            {selectedConfigGroup && (
              <div className="selected-group-form">
                <label>
                  Nombre del grupo
                  <input value={selectedConfigGroup.name} onChange={(event) => updateGroup(selectedConfigGroup.id, "name", event.target.value)} />
                </label>
                <label>
                  Tipo de grupo
                  <select value={selectedConfigGroup.type} onChange={(event) => updateGroup(selectedConfigGroup.id, "type", event.target.value)}>
                    {Object.entries(GROUP_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
                <label>
                  Maniobra que realiza
                  <select value={selectedConfigGroup.movementKind || defaultMovementKindForType(selectedConfigGroup.type)} onChange={(event) => updateGroup(selectedConfigGroup.id, "movementKind", event.target.value)}>
                    {Object.entries(MOVEMENT_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
                <label>
                  Descripción / ubicación
                  <input value={selectedConfigGroup.description || ""} onChange={(event) => updateGroup(selectedConfigGroup.id, "description", event.target.value)} placeholder="Ej: vía principal, bajada, giro protegido…" />
                </label>
                <div className="mini-note">S11/S12/S13 se configuran en las maniobras. Aquí solo defines qué hace el grupo.</div>
              </div>
            )}
          </div>

          <div className="group-picker-panel">
            <div className="group-picker-title">Grupos</div>
            <div className="group-tile-grid">
              <button className="group-tile add" onClick={() => addGroup("vehicle")}>
                <span>＋</span>
                <small>Añadir grupo</small>
              </button>
              {geometry.signalGroups.map((group) => (
                <button key={group.id} onClick={() => setSelectedConfigGroupId(group.id)} className={selectedConfigGroup?.id === group.id ? "group-tile active" : "group-tile"}>
                  <strong>{group.id}</strong>
                  <span>{trafficGroupIcon(group)}</span>
                  <small>{movementLabelForGroup(group)}</small>
                </button>
              ))}
            </div>
            <div className="quick-add-row">
              <Button onClick={() => addGroup("vehicle")} variant="secondary">+ Vehículo</Button>
              <Button onClick={() => addGroup("pedestrian")} variant="secondary">+ Peatón</Button>
              <Button onClick={() => addGroup("turn")} variant="secondary">+ Giro</Button>
              <Button onClick={() => addGroup("bus")} variant="secondary">+ Transporte</Button>
              <Button onClick={() => addGroup("bike")} variant="secondary">+ Bici</Button>
              {selectedConfigGroup && <Button onClick={() => removeGroup(selectedConfigGroup.id)} variant="danger">Eliminar grupo</Button>}
            </div>
          </div>
        </div>
      </div>

      <div className="configurator-section maneuver-section">
        <div className="configurator-section-title blue">
          <span>2. Configuración de Maniobras</span>
          <small>Las maniobras son maniobras asignadas al grupo seleccionado. Aquí decides qué maniobra controla cada grupo y qué ópticas usa.</small>
        </div>
        <div className="quick-add-row">
          <Button onClick={() => addSignalHead(selectedConfigGroup?.id || geometry.signalGroups[0]?.id)} variant="secondary">+ Añadir maniobra</Button>
        </div>
        <div className="maneuver-card-grid">
          {selectedConfigGroup && selectedGroupHeads.length === 0 && (
            <div className="empty-maneuver-card">
              <strong>{selectedConfigGroup.id}</strong>
              <span>Este grupo todavía no tiene maniobras/maniobras asignadas.</span>
              <Button onClick={() => addSignalHead(selectedConfigGroup.id)}>Añadir maniobra</Button>
            </div>
          )}
          {selectedGroupHeads.map((head) => (
            <div key={head.id} className="maneuver-card">
              <div className="maneuver-card-header">
                <strong>{head.id}</strong>
                <Button onClick={() => removeSignalHead(head.id)} variant="danger">Quitar</Button>
              </div>
              <label>
                Nombre de la maniobra
                <input value={head.name} onChange={(event) => updateSignalHead(head.id, "name", event.target.value)} />
              </label>
              <label>
                Grupo que controla
                <select value={head.movement} onChange={(event) => updateSignalHead(head.id, "movement", event.target.value)}>
                  {geometry.signalGroups.map((group) => <option key={group.id} value={group.id}>{group.id} · {group.name}</option>)}
                </select>
              </label>
              <label>
                Tipo de óptica / ópticas
                <select value={head.headType} onChange={(event) => updateSignalHead(head.id, "headType", event.target.value)}>
                  {Object.entries(HEAD_TYPES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                </select>
              </label>
              <div className="head-lamps">
                {head.optics.map((optic) => (
                  <div key={optic} className="head-lamp">
                    <span style={{ backgroundColor: lightColorForOptic(optic), boxShadow: `0 0 10px ${lightColorForOptic(optic)}` }} />
                    <small>{lightLabel(optic)}</small>
                  </div>
                ))}
              </div>
              <div className="mini-note">{HEAD_TYPES[head.headType]?.description}</div>
            </div>
          ))}
          <button className="maneuver-add-card" onClick={() => addSignalHead(selectedConfigGroup?.id || geometry.signalGroups[0]?.id)}>
            <span>＋</span>
            <small>Añadir maniobra</small>
          </button>
        </div>
      </div>

      <details className="advanced-config">
        <summary>Configuración avanzada: fases, tiempos, incompatibilidades y validación</summary>
        <div className="advanced-config-body">

<div className="editor-grid">
        <div className="editor-box">
          <h3>Grupos del cruce</h3>
          <div className="button-grid">
            <Button onClick={() => addGroup("vehicle")} variant="secondary">+ Vehículo</Button>
            <Button onClick={() => addGroup("pedestrian")} variant="secondary">+ Peatón</Button>
            <Button onClick={() => addGroup("turn")} variant="secondary">+ Giro</Button>
            <Button onClick={() => addGroup("bus")} variant="secondary">+ Bus</Button>
            <Button onClick={() => addGroup("bike")} variant="secondary">+ Bici</Button>
          </div>

          <div className="notice strong">
            Aquí creas maniobras del cruce: recto, giro izquierda, giro derecha, transversal, paso peatonal o aviso. S11/S12/S13 se define después en “Maniobras semafóricas”, porque S indica las ópticas físicas de la maniobra.
          </div>

          <div className="group-list">
            {geometry.signalGroups.map((group) => (
              <div key={group.id} className="group-card">
                <div className="group-head">
                  <label className="mini-field">
                    Código maniobra
                    <input
                      value={group.id}
                      onChange={(event) => renameGroupId(group.id, event.target.value)}
                      placeholder="V1 / P1 / G1"
                    />
                  </label>
                  <Button onClick={() => removeGroup(group.id)} variant="danger">Quitar</Button>
                </div>
                <label className="mini-field">
                  Nombre
                  <input value={group.name} onChange={(event) => updateGroup(group.id, "name", event.target.value)} />
                </label>
                <label className="mini-field">
                  Tipo
                  <select value={group.type} onChange={(event) => updateGroup(group.id, "type", event.target.value)}>
                    {Object.entries(GROUP_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
                <label className="mini-field">
                  Maniobra que realiza
                  <select value={group.movementKind || defaultMovementKindForType(group.type)} onChange={(event) => updateGroup(group.id, "movementKind", event.target.value)}>
                    {Object.entries(MOVEMENT_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
                <div className="muted">Ópticas base de maniobra: {group.optics.join(", ")} · El tipo S real se define en “Maniobras semafóricas”.</div>
              </div>
            ))}
          </div>
        </div>

        <div className="editor-box">
          <h3>Fases configurables</h3>
          <p className="muted">Puedes añadir, duplicar, vaciar o quitar fases sin eliminar el cruce.</p>
          <Button onClick={addPhase}>+ Añadir fase</Button>

          <div className="phase-list">
            {geometry.phases.map((phase) => {
              const conflict = hasConflict(selected, phase.greenGroups);
              return (
                <div key={phase.id} className={`phase-card ${conflict ? "phase-conflict" : ""}`}>
                  <div className="group-head">
                    <strong>{phase.id}</strong>
                    <div className="button-grid">
                      <Button onClick={() => duplicatePhase(phase.id)} variant="secondary">Duplicar</Button>
                      <Button onClick={() => clearPhase(phase.id)} variant="warning">Vaciar fase</Button>
                      <Button onClick={() => removePhase(phase.id)} variant="danger">Quitar</Button>
                    </div>
                  </div>
                  <input value={phase.name} onChange={(event) => updatePhase(phase.id, "name", event.target.value)} />
                  <label className="field compact">
                    Duración: {phase.duration}s
                    <input type="range" min="8" max="55" value={phase.duration} onChange={(event) => updatePhase(phase.id, "duration", Number(event.target.value))} />
                  </label>
                  <div className="phase-green-header">
                    <div className="muted">Grupos en verde:</div>
                    <Button onClick={() => clearPhaseGreenGroups(phase.id)} variant="warning" disabled={(phase.greenGroups || []).length === 0}>
                      Limpiar grupos en verde
                    </Button>
                  </div>

                  <div className="phase-groups">
                    {geometry.signalGroups.map((group) => {
                      const isGreen = (phase.greenGroups || []).includes(group.id);
                      return (
                        <button
                          key={group.id}
                          onClick={() => togglePhaseGroup(phase.id, group.id)}
                          className={isGreen ? "group-toggle active" : "group-toggle"}
                          title={isGreen ? "Quitar de grupos en verde" : "Añadir a grupos en verde"}
                        >
                          {isGreen ? `✓ ${group.id}` : `+ ${group.id}`}
                        </button>
                      );
                    })}
                  </div>
                  <div className="phase-output-editor">
                    <div className="muted">Estado por maniobra en esta fase:</div>
                    {(geometry.signalHeads || defaultSignalHeadsForGeometry(geometry.geometryType, geometry.signalGroups)).map((head) => {
                      const heads = geometry.signalHeads || defaultSignalHeadsForGeometry(geometry.geometryType, geometry.signalGroups);
                      const outputs = phaseOutputs(phase, heads);
                      return (
                        <label key={head.id} className="mini-field">
                          {head.id} · {head.name}
                          <select value={outputs[head.id] || "red"} onChange={(event) => updatePhaseOutput(phase.id, head.id, event.target.value)}>
                            {Object.entries(OUTPUT_STATES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                          </select>
                        </label>
                      );
                    })}
                  </div>
                  {conflict && <div className="conflict-text">Conflicto: el motor bloqueará los grupos incompatibles.</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="editor-box full">
        <div className="panel-header">
          <div>
            <h3>Maniobras semafóricas</h3>
            <p>S11/S12/S13 indican cantidad/configuración de ópticas de la maniobra. La maniobra —recto, giro, transversal, peatón o aviso— se define en Grupos del cruce.</p>
          </div>
          <Button onClick={() => addSignalHead()} variant="secondary">+ Maniobra</Button>
        </div>

        <div className="head-grid">
          {(geometry.signalHeads || defaultSignalHeadsForGeometry(geometry.geometryType, geometry.signalGroups)).map((head) => (
            <div key={head.id} className="head-card">
              <div className="group-head">
                <strong>{head.id}</strong>
                <Button onClick={() => removeSignalHead(head.id)} variant="danger">Quitar</Button>
              </div>

              <label className="mini-field">
                Nombre de la maniobra
                <input value={head.name} onChange={(event) => updateSignalHead(head.id, "name", event.target.value)} />
              </label>

              <label className="mini-field">
                Grupo que controla
                <select value={head.movement} onChange={(event) => updateSignalHead(head.id, "movement", event.target.value)}>
                  {geometry.signalGroups.map((group) => <option key={group.id} value={group.id}>{group.id} · {group.name}</option>)}
                </select>
              </label>

              <label className="mini-field">
                Tipo de óptica / ópticas
                <select value={head.headType} onChange={(event) => updateSignalHead(head.id, "headType", event.target.value)}>
                  {Object.entries(HEAD_TYPES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                </select>
              </label>

              <div className="head-lamps">
                {head.optics.map((optic) => (
                  <div key={optic} className="head-lamp">
                    <span style={{ backgroundColor: lightColorForOptic(optic), boxShadow: `0 0 10px ${lightColorForOptic(optic)}` }} />
                    <small>{lightLabel(optic)}</small>
                  </div>
                ))}
              </div>

              <div className="muted">{HEAD_TYPES[head.headType]?.description}</div>
            </div>
          ))}
        </div>

        <div className="notice strong">
          Ejemplo: una maniobra puede ser S13 rojo/ámbar/verde, otra S12 doble ámbar, otra S11 solo ámbar. La fase decide qué maniobra se abre; la maniobra decide qué ópticas existen.
        </div>
      </div>

      <div className="editor-box full">
        <div className="panel-header">
          <div>
            <h3>Grupos operativos GV/GP</h3>
            <p>Convención recomendada: GV para vehículos y GP para peatones. La posición concreta la muestran las miniaturas del mapa y el nombre editable de cada maniobra.</p>
          </div>
          <div className="button-grid">
            <Button onClick={() => addControlGroup("GV", "Grupo vehículos")} variant="secondary">+ GV</Button>
            <Button onClick={() => addControlGroup("GP", "Grupo peatones")} variant="secondary">+ GP</Button>
            <Button onClick={applyGvGpConvention} variant="warning">Aplicar GV/GP</Button>
            <Button onClick={applyAvEuropaTurnPreset} variant="warning">Plantilla Av. Europa giro</Button>
            <Button onClick={applyIndependentScenarioPreset} variant="warning">Escenario maniobras independientes</Button>
          </div>
        </div>

        <div className="control-group-grid">
          {sanitizeControlGroups(geometry.controlGroups || []).map((controlGroup) => (
            <div key={controlGroup.id} className="control-group-card">
              <div className="group-head">
                <label className="mini-field">
                  Código grupo
                  <input value={controlGroup.id} readOnly title="Código interno estable. Para cambiarlo, crea otro grupo y borra este." />
                </label>
                <Button onClick={() => removeControlGroup(controlGroup.id)} variant="danger">Quitar</Button>
              </div>
              <label className="mini-field">
                Nombre
                <input value={controlGroup.name} onChange={(event) => updateControlGroup(controlGroup.id, "name", event.target.value)} />
              </label>

              <div className="muted">Maniobras incluidas:</div>
              <div className="phase-groups">
                {geometry.signalGroups.map((signalGroup) => (
                  <button
                    key={signalGroup.id}
                    onClick={() => toggleControlGroupMember(controlGroup.id, signalGroup.id)}
                    className={controlGroup.members.includes(signalGroup.id) ? "group-toggle active" : "group-toggle"}
                    title={signalGroup.name}
                  >
                    {signalGroup.id}
                  </button>
                ))}
              </div>

              <div className="notice">
                {controlGroup.id}: {controlGroup.members.length ? controlGroup.members.join(" + ") : "sin maniobras asignadas"}
              </div>

              <div className="button-grid">
                <Button onClick={() => addPhaseFromControlGroup(controlGroup)} variant="secondary">Crear fase con este grupo</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="notice strong">
          Ejemplo: GV agrupa todos los vehículos; GV-Principal agrupa la vía principal, GV-Giro el giro y GP los peatones. Una fase puede abrir una maniobra concreta más un giro compatible, dejando el resto en rojo.
        </div>
      </div>

      <div className="editor-box full">
        <h3>Incompatibilidades</h3>
        <p>Marca pares que nunca deben estar en verde a la vez.</p>
        <div className="conflict-grid">
          {geometry.signalGroups.map((a) => geometry.signalGroups.map((b) => {
            if (a.id >= b.id) return null;
            const key = [a.id, b.id].sort().join("::");
            const active = geometry.conflicts.some(([x, y]) => [x, y].sort().join("::") === key);
            return (
              <button key={key} onClick={() => toggleConflict(a.id, b.id)} className={active ? "conflict active" : "conflict"}>
                {a.id} ↔ {b.id}
              </button>
            );
          }))}
        </div>
      </div>
    
        </div>
      </details>
    </Panel>
  );
}

function CrossingDetails({ selected, signal }) {
  const activeConflict = signal.stage === "green" && signal.safetyFiltered;

  return (
    <Panel>
      <div className="panel-header">
        <div>
          <h2>Ficha completa del cruce seleccionado</h2>
          <p>{selected.name}</p>
        </div>
        <TinyOptics signal={signal} />
      </div>

      <div className="details-grid">
        <Info title="ID del cruce" value={selected.id} />
        <Info title="Geometría" value={GEOMETRIES[selected.geometry.geometryType]} />
        <Info title="Modo" value={selected.operatorManual ? "Manual persona" : selected.localMode ? "Local" : "Automático"} />
        <Info title="Fase activa" value={signal.activePhase.name} />
        <Info title="Estado" value={stageName(signal.stage)} />
        <Info title="Restante" value={`${signal.remaining}s`} />
        <Info title="Progreso" value={`${signal.progress}%`} />
        <Info title="Latitud" value={selected.lat.toFixed(6)} />
        <Info title="Longitud" value={selected.lng.toFixed(6)} />
        <Info title="Grupos" value={selected.geometry.signalGroups.length} />
        <Info title="Fases" value={selected.geometry.phases.length} />
        <Info title="Cámaras" value={selected.cameras.length} />
      </div>

      <div className="optic-block">
        <div className="section-label">Situación de ópticas por grupo</div>
        <div className="optic-grid wide">
          {selected.geometry.signalGroups.map((group) => (
            <Optic key={group.id} label={`${group.id} · ${group.name}`} state={signal.groupStates[group.id]} />
          ))}
        </div>
      </div>

      <div className="optic-block">
        <div className="section-label">Maniobras semafóricas reales</div>
        <div className="head-grid compact">
          {(selected.geometry.signalHeads || defaultSignalHeadsForGeometry(selected.geometry.geometryType, selected.geometry.signalGroups)).map((head) => (
            <div key={head.id} className="head-card">
              <div className="row">
                <strong>{head.id}</strong>
                <span className="muted">{HEAD_TYPES[head.headType]?.label}</span>
              </div>
              <div className="muted">{head.name}</div>
              <div className="head-lamps">
                {head.optics.map((optic) => {
                  const activeOptic = signal.headStates?.[head.id] === optic;
                  return (
                    <div key={optic} className="head-lamp">
                      <span style={{ backgroundColor: activeOptic ? lightColorForOptic(optic) : "#334155", boxShadow: activeOptic ? `0 0 10px ${lightColorForOptic(optic)}` : "none" }} />
                      <small>{lightLabel(optic)}</small>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={activeConflict ? "alert danger" : "alert ok"}>
        {activeConflict ? "Seguridad activa: se bloquearon grupos incompatibles para evitar verdes conflictivos." : "Combinación compatible según matriz actual."}
      </div>
      {phaseExplanation(selected, signal) && (
        <div className="notice strong">
          {phaseExplanation(selected, signal)}
        </div>
      )}
    </Panel>
  );
}


function circularTimingError(actualDelay, plannedDelay, cycle) {
  if (!cycle || cycle <= 0) return Math.abs(actualDelay - plannedDelay);
  const half = cycle / 2;
  let error = actualDelay - plannedDelay;
  while (error > half) error -= cycle;
  while (error < -half) error += cycle;
  return Math.abs(error);
}

function SyncComparisonPanel({ corridorIds, crossings, signals, selectedId, onSelect, onToggleCorridor }) {
  const corridor = corridorIds.map((id) => crossings.find((c) => c.id === id)).filter(Boolean);
  const base = corridor[0] ? signals[corridor[0].id] : null;
  const baseTick = base?.localTick || 0;

  return (
    <Panel>
      <div className="panel-header">
        <div>
          <h2>Sincronización visible</h2>
          <p>Compara el corredor. La geometría de cada cruce puede ser distinta.</p>
        </div>
        <span className="tag">{corridor.length} seleccionados</span>
      </div>

      <div className="sync-grid">
        {corridor.map((crossing, index) => {
          const signal = signals[crossing.id];
          const rawDelay = signal.localTick - baseTick;
          const plannedDelay = crossing.offset - (corridor[0]?.offset || 0);
          const timingError = circularTimingError(rawDelay, plannedDelay, Math.min(signal.cycle || 1, base?.cycle || signal.cycle || 1));
          const primary = getPrimaryGroup(crossing);
          const primaryState = primary ? signal.groupStates[primary.id] : "red";
          const basePrimary = corridor[0] ? getPrimaryGroup(corridor[0]) : null;
          const basePrimaryOpen = basePrimary ? base?.groupStates?.[basePrimary.id] === "green" : false;
          const thisPrimaryOpen = primaryState === "green";
          const sync = index === 0
            ? "referencia"
            : thisPrimaryOpen === basePrimaryOpen && signal.stage === base.stage && timingError <= 3
            ? "ventana alineada"
            : timingError <= 12
            ? `leve desvío ${Math.round(timingError)}s`
            : `desfase ${Math.round(timingError)}s`;

          const syncClass = index === 0
            ? "state-neutral"
            : (sync === "sincronizado" || sync === "ventana alineada")
            ? "state-green"
            : sync.startsWith("leve")
            ? "state-amber"
            : "state-neutral";

          return (
            <button key={crossing.id} onClick={() => onSelect(crossing.id)} className={`sync-card ${selectedId === crossing.id ? "selected" : ""}`}>
              <div className="row">
                <div><div className="muted">Orden #{index + 1}</div><div className="big-id">{crossing.id}</div></div>
                <TinyOptics signal={signal} />
              </div>

              <div className="title">{crossing.name}</div>

              <div className="pills">
                <Pill className={stageClass(signal.stage)}>{stageName(signal.stage)}</Pill>
                <Pill className={syncClass}>{sync}</Pill>
                <Pill className={crossing.operatorManual ? "state-red" : "state-green"}>{crossing.operatorManual ? "MANUAL" : "AUTO"}</Pill>
              </div>

              <div className="info-grid">
                <Info title="Geometría" value={GEOMETRIES[crossing.geometry.geometryType]} />
                <Info title="Grupo principal" value={primary ? `${primary.id} · ${primaryState}` : "—"} />
                <Info title="Fase" value={signal.activePhase.id} />
                <Info title="Restante" value={`${signal.remaining}s`} />
                <Info title="Diferencia plan" value={index === 0 ? "0s" : `${plannedDelay >= 0 ? "+" : ""}${plannedDelay}s`} />
                <Info title="Error sync" value={index === 0 ? "0s" : `${Math.round(timingError)}s`} />
                <Info title="Offset" value={`+${crossing.offset}s`} />
                <Info title="Grupos" value={crossing.geometry.signalGroups.length} />
              </div>

              <div className="progress">
                <div className="row small"><span>Progreso</span><span>{signal.progress}%</span></div>
                <div className="bar"><div style={{ width: `${signal.progress}%` }} /></div>
              </div>

              <div className="optic-block">
                <div className="section-label">Ópticas activas</div>
                <div className="optic-grid">
                  {crossing.geometry.signalGroups.slice(0, 4).map((group) => (
                    <Optic key={group.id} label={`${group.id} · ${group.name}`} state={signal.groupStates[group.id]} />
                  ))}
                </div>
              </div>

              <div className="queue-grid">
                <Queue title="Cola N/S" value={crossing.queues.NS} />
                <Queue title="Cola E/O" value={crossing.queues.EW} />
              </div>

              <div onClick={(event) => { event.stopPropagation(); onToggleCorridor(crossing.id); }} className="remove-sync">
                Quitar de sincronización
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}


function EmptySelectionPanel({ addMode, onAddFirst, onToggleAddMode }) {
  return (
    <Panel className="empty-selection-panel">
      <h2>Sin cruce seleccionado</h2>
      <p>No hay cruces en el mapa o no hay ninguno seleccionado. Puedes crear el primero directamente o activar el modo añadir y pulsar sobre el mapa.</p>
      <div className="empty-actions">
        <Button onClick={onAddFirst}>+ Añadir primer cruce</Button>
        <Button onClick={onToggleAddMode} variant={addMode ? "warning" : "secondary"}>
          {addMode ? "Modo añadir ON" : "Activar modo añadir"}
        </Button>
      </div>
      <div className="notice">
        Modo añadir en mapa: {addMode ? "activado" : "desactivado"}
      </div>
    </Panel>
  );
}

function CorridorPanel({ crossings, corridorIds, signals, selectedId, onSelect, onToggleCorridor, onUseFirstN, onOrderByMap, onOptimize }) {
  const corridor = corridorIds.map((id) => crossings.find((crossing) => crossing.id === id)).filter(Boolean);
  const linkedCount = corridor.filter((crossing) => crossing.linked).length;
  const avgCycle = corridor.length
    ? Math.round(corridor.reduce((sum, crossing) => sum + (signals[crossing.id]?.cycle || 0), 0) / Math.max(1, corridor.length))
    : 0;
  const greenWave = corridor.length ? Math.round((linkedCount / corridor.length) * 100) : 0;
  const lengthKm = corridor.length ? (corridor.length * 0.24).toFixed(1) : "0.0";

  return (
    <Panel className="corridor-target-panel">
      <div className="corridor-target-header">
        <div>
          <h2>Cruces seleccionados</h2>
          <p>Vista resumida del corredor, onda verde, desfases y estado de los cruces en secuencia.</p>
        </div>
        <span className="tag">{corridor.length} cruce(s)</span>
      </div>

      <div className="corridor-target-layout">
        <div className="corridor-config-card">
          <select className="target-select" value={corridor.length ? `COR-${corridorIds.join("-")}` : "Sin corredor"} disabled title="Resumen del corredor activo; el orden se cambia con los botones Ordenar y Aplicar onda.">
            <option>{corridor.length ? `COR-01 · ${corridor.map((item) => item.id).join(" → ")}` : "Sin corredor"}</option>
          </select>

          <div className="corridor-state-grid">
            <span>Estado: <b className={corridor.length ? "ok-text" : "warn-text"}>{corridor.length ? "Activo" : "Vacío"}</b></span>
            <span>Cruces: <b>{corridor.length}</b></span>
            <span>Sentido: <b>según mapa</b></span>
            <span>Onda verde: <b className={greenWave >= 60 ? "ok-text" : "warn-text"}>{settingsSafeText(greenWave)}</b></span>
          </div>

          <div className="corridor-actions-row">
            <Button onClick={() => onUseFirstN(4)} variant="secondary" disabled={!crossings.length}>Usar 4</Button>
            <Button onClick={() => onUseFirstN(5)} variant="secondary" disabled={!crossings.length}>Usar 5</Button>
            <Button onClick={onOrderByMap} variant="warning" disabled={!corridor.length}>Ordenar</Button>
            <Button onClick={safeAction(onOptimize, "optimizar onda")} disabled={!corridor.length}>Aplicar onda</Button>
          </div>
        </div>

        <div className="corridor-flow-card">
          {corridor.length === 0 && <div className="notice">No hay cruces en el corredor. Pulsa “Corredor” en un cruce o usa 4/5 cruces.</div>}
          {corridor.map((crossing, index) => {
            const signal = signals[crossing.id];
            const health = healthLevel(crossing.hardware);
            const selected = selectedId === crossing.id;
            return (
              <div key={crossing.id} className="corridor-flow-item-wrap">
                <button onClick={() => onSelect(crossing.id)} title={crossing.name} className={selected ? "corridor-flow-item selected" : "corridor-flow-item"}>
                  <TinyOptics signal={signal} />
                  <strong>{crossing.name || crossing.id}</strong>
                  <span>ID {crossing.id}</span>
                  <small className={health === "ok" ? "ok-text" : health === "warning" ? "warn-text" : "danger-text"}>{healthText(health)}</small>
                  <small>Offset: {crossing.offset}s</small>
                </button>
                {index < corridor.length - 1 && <div className="corridor-flow-arrow">→</div>}
              </div>
            );
          })}
        </div>

        <div className="corridor-summary-card">
          <h3>Resumen del corredor</h3>
          <div><span>Longitud:</span><b>{lengthKm} km</b></div>
          <div><span>Tiempo de ciclo:</span><b>{avgCycle || "—"} s</b></div>
          <div><span>Velocidad objetivo:</span><b>50 km/h</b></div>
          <div><span>Vehículos onda verde:</span><b>{greenWave}%</b></div>
        </div>
      </div>
    </Panel>
  );
}

function settingsSafeText(value) {
  return value >= 60 ? "Activa" : value > 0 ? "Parcial" : "OFF";
}

function DecisionPanel({ selected, signal, settings }) {
  const reasons = decisionReasons(selected, signal, settings);
  const primary = getPrimaryGroup(selected);
  const primaryState = primary ? signal.groupStates[primary.id] : "red";

  return (
    <Panel>
      <div className="panel-header">
        <div>
          <h2>Decisión del cruce {selected.name || "cruce seleccionado"}</h2>
          <p>Motivos de duración, fase activa, grupo principal y bloqueos de seguridad.</p>
        </div>
        <Pill className={signal.safetyFiltered ? "state-amber" : "state-green"}>{signal.safetyFiltered ? "filtrado seguro" : "compatible"}</Pill>
      </div>

      <div className="details-grid">
        <Info title="Fase activa" value={signal.activePhase.name} />
        <Info title="Estado" value={stageName(signal.stage)} />
        <Info title="Restante" value={`${signal.remaining}s`} />
        <Info title="Ciclo" value={`${signal.cycle}s`} />
        <Info title="Grupo principal" value={primary ? `${primary.id} · ${primary.name}` : "—"} />
        <Info title="Estado principal" value={primaryState} />
      </div>

      <div className="editor-box full">
        <h3>Motivos</h3>
        <ul className="rule-list">
          {reasons.map((reason, index) => <li key={index}>{reason}</li>)}
        </ul>
      </div>

      <div className="phase-list">
        {selected.geometry.phases.map((phase, index) => {
          const planned = phase.greenGroups.join(", ") || "sin grupos";
          const active = signal.activePhase.id === phase.id;
          const conflict = hasConflict(selected, phase.greenGroups);
          return (
            <div key={phase.id} className={`phase-card ${conflict ? "phase-conflict" : ""}`}>
              <div className="group-head">
                <strong>{phase.id} · {phase.name}</strong>
                {active && <Pill className="state-green">activa</Pill>}
              </div>
              <div className="muted">Duración programada: {phase.duration}s · duración efectiva: {signal.phaseDurations[index] ?? phase.duration}s</div>
              <div className="muted">Verdes programados: {planned}</div>
              {conflict && <div className="conflict-text">Contiene incompatibilidades. El motor bloqueará grupos conflictivos.</div>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}


function LeftSidebar({ active = "Inicio", systemOk = true, onSelect = () => {} }) {
  const items = [
    ["🏠", "Inicio"],
    ["🗺️", "Mapa del sistema"],
    ["🚦", "Cruces"],
    ["🔗", "Corredores"],
    ["🧪", "Escenarios"],
    ["📄", "Informes"],
    ["⚠️", "Eventos"],
    ["🧰", "Dispositivos"],
    ["📷", "Cámaras"],
    ["⚙️", "Configuración"],
    ["👤", "Usuarios"],
    ["🛡️", "Sistema"],
  ];

  return (
    <aside className="hydra-sidebar">
      <div className="hydra-brand">
        <div className="hydra-logo" aria-label="Hydra Traffic Lab">
          <img src={hydraAvatar} alt="" />
        </div>
        <div>
          <strong>Hydra Traffic Lab</strong>
          <span>Regulación inteligente</span>
        </div>
      </div>

      <nav className="hydra-nav">
        {items.map(([icon, label]) => (
          <button key={label} className={label === active ? "hydra-nav-item active" : "hydra-nav-item"} onClick={() => onSelect(label)}>
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="hydra-status-card">
        <strong>Estado del sistema</strong>
        <div><span className={systemOk ? "dot ok" : "dot warn"} />Servidor <b>{systemOk ? "Conectado" : "Aviso"}</b></div>
        <div><span className="dot ok" />Base de datos <b>Conectada</b></div>
        <div><span className="dot ok" />Comunicaciones <b>Conectadas</b></div>
      </div>

      <div className="hydra-license">
        <span>Hydra Traffic Lab {HYDRA_VERSION_LABEL}</span>
        <strong>Licencia: Hydra Company</strong>
      </div>
    </aside>
  );
}


function RightControlPanel({
  selected,
  settings,
  setSettings,
  tick,
  crossings,
  liveIssues,
  corridorIds,
  onSetRegulatorMode,
  onSetLocalMode,
  onFaultMode,
  onSafeStep,
  onClearActiveQueue,
  onAddCrossing,
  running,
  onToggleRunning,
  onToggleLinkMode,
  linkMode,
  onOptimize,
  onRunCheck,
  onDelete,
  onExport,
  onReset,
  onSelectCrossing,
  activeRole,
  onPermissionDenied,
}) {
  const status = selected.operatorManual ? "Manual persona" : selected.localMode ? "Automático local" : "Automático remoto";

  return (
    <section className="center-control-strip">
      <div className="center-control-title-row">
        <h2>Centro de Control</h2>
        <span className="tag">{status}</span>
      </div>

      <div className="target-control-grid">
        <div className="target-card target-settings-card">
          <h3>⚙️ Ajustes globales</h3>
          <div className="target-check-list">
            <Check label="Coordinación activa" value={settings.linkedMode} set={(value) => setSettings((old) => ({ ...old, linkedMode: value }))} />
            <Check label="Manual asistido" value={settings.manualAssist} set={(value) => setSettings((old) => ({ ...old, manualAssist: value }))} />
            <Check label="Control adaptativo" value={settings.adaptive} set={(value) => setSettings((old) => ({ ...old, adaptive: value }))} />
            <Check label="Lazos virtuales" value={settings.loopsEnabled} set={(value) => setSettings((old) => ({ ...old, loopsEnabled: value }))} />
            <Check label="Cámara virtual" value={settings.cameraEnabled} set={(value) => setSettings((old) => ({ ...old, cameraEnabled: value }))} />
            <Check label="Llegadas automáticas" value={settings.autoTraffic} set={(value) => setSettings((old) => ({ ...old, autoTraffic: value }))} />
          </div>

          <label className="target-range">
            <span>Descarga en verde: {settings.dischargeRate} veh/s</span>
            <input type="range" min="1" max="3" value={settings.dischargeRate} onChange={(event) => setSettings((old) => ({ ...old, dischargeRate: Number(event.target.value) }))} />
          </label>
        </div>

        <div className="target-card target-selector-card">
          <h3>Selector del regulador</h3>
          <select className="target-select" value={selected.id} onChange={(event) => onSelectCrossing(event.target.value)}>
            {crossings.map((crossing) => (
              <option key={crossing.id} value={crossing.id}>{crossing.id} · {crossing.name}</option>
            ))}
          </select>
          <div className="target-status-line">Estado: <b>{status}</b></div>
          <div className="target-mode-grid">
            <Button onClick={() => onSetRegulatorMode(selected.id, false)}>Automático remoto</Button>
            <Button onClick={() => onSetLocalMode(selected.id, true)} variant="secondary">Automático local</Button>
            <Button onClick={() => onSetRegulatorMode(selected.id, true)} variant="danger">Manual persona</Button>
            <Button onClick={() => onSetLocalMode(selected.id, false)} variant="warning">Salir local</Button>
          </div>
        </div>

        <div className="target-card target-intervention-card">
          <h3>Intervención rápida</h3>
          <div className="target-intervention-buttons">
            <Button onClick={onSafeStep} variant="warning" disabled={!settings.manualAssist}>Avanzar etapa segura</Button>
            <Button onClick={onClearActiveQueue} variant="secondary" disabled={!settings.manualAssist}>Priorizar cola activa</Button>
            <Button onClick={onFaultMode} variant="danger">Avería local</Button>
          </div>
        </div>

        <div className="target-card target-actions-card">
          <h3>Acciones rápidas</h3>
          <div className="target-actions-grid">
            <Button onClick={onToggleRunning}>{running ? "⏸ Pausar" : "▶ Iniciar"}</Button>
            <Button onClick={() => typeof onAddCrossing === "function" && onAddCrossing()}>+ Añadir cruce</Button>
            <Button onClick={onToggleLinkMode} variant={linkMode ? "warning" : "secondary"}>{linkMode ? "Unir ON" : "Unir cruces"}</Button>
            <Button onClick={onOptimize} variant="warning">Optimizar onda</Button>
            <Button onClick={onRunCheck} variant="warning">Comprobar</Button>
            <Button onClick={onDelete} variant="danger" disabled={!selected}>Eliminar</Button>
            <Button onClick={onExport} variant="secondary">Exportar JSON</Button>
            <Button onClick={onReset} variant="secondary">Nuevo proyecto</Button>
          </div>
        </div>

        <div className="target-card target-summary-card">
          <h3>Resumen del sistema</h3>
          <div className="target-summary-grid">
            <div><span>Tiempo</span><strong>{tick}s</strong></div>
            <div><span>Cruces</span><strong>{crossings.length}</strong></div>
            <div><span>Seleccionado</span><strong>{selected?.id || "—"}</strong></div>
            <div><span>Incidencias</span><strong className={liveIssues.length ? "danger-number" : ""}>{liveIssues.length}</strong></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RecentEventsBar({ log }) {
  const items = log.slice(0, 5);
  return (
    <Panel className="recent-events-panel">
      <div className="recent-events-header">
        <h2>Eventos recientes</h2>
        <span>Ver todos</span>
      </div>
      <div className="recent-events-list">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="recent-event-item">
            <span className={index % 3 === 0 ? "event-dot red" : index % 3 === 1 ? "event-dot amber" : "event-dot green"} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function FloatingEventsWindow({ log, open, minimized, onOpen, onMinimize, onMaximize, onClose }) {
  const items = log.slice(0, 8);
  if (!open) {
    return <button className="events-dock-item" onClick={onOpen}>Eventos recientes · {items.length}</button>;
  }
  if (minimized) {
    return <button className="events-dock-item" onClick={onMaximize}>Eventos recientes · minimizado · {items.length}</button>;
  }
  return (
    <div className="floating-events-window">
      <div className="floating-events-header">
        <strong>Eventos recientes</strong>
        <div>
          <button onClick={onMinimize}>_</button>
          <button onClick={onMaximize}>□</button>
          <button onClick={onClose}>×</button>
        </div>
      </div>
      <div className="floating-events-body">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="floating-event-line">
            <span className={index % 3 === 0 ? "event-dot red" : index % 3 === 1 ? "event-dot amber" : "event-dot green"} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}



function ProjectStoragePanel({ storageStatus, activeRole, onPermissionDenied, onSave, onCreatePoint, onRestore, onClearSave }) {
  const restoreCount = loadRestorePoints().length;
  return (
    <Panel className="project-storage-panel">
      <div className="storage-header">
        <div>
          <h2>Guardado del proyecto</h2>
          <p>Guardado automático local. Exportar JSON sigue siendo la copia externa recomendada.</p>
        </div>
        <div className="panel-tools">
          <HelpButton
            title="Guardado del proyecto"
            items={[
              "Guardar ahora actualiza la copia local del proyecto activo.",
              "Crear punto guarda una restauracion manual antes de cambios delicados.",
              "Restaurar y borrar guardado son acciones criticas y quedan limitadas por permisos.",
            ]}
          />
          <span className="tag">{restoreCount} punto(s)</span>
        </div>
      </div>
      <div className="storage-status-line">{storageStatus}</div>
      <div className="storage-actions-grid">
        <PermissionButton role={activeRole} permission="viewSystem" onDenied={onPermissionDenied} onClick={onSave} action="guardar proyecto">Guardar ahora</PermissionButton>
        <PermissionButton role={activeRole} permission="changePlans" onDenied={onPermissionDenied} onClick={() => onCreatePoint("Punto manual")} action="crear punto de restauracion" variant="secondary">Crear punto</PermissionButton>
        <Button onClick={onRestore} variant="warning">Restaurar último</Button>
        <Button onClick={onClearSave} variant="danger">Borrar guardado local</Button>
      </div>
    </Panel>
  );
}

function ProjectCityPanel({ projects, activeProjectId, activeRole, onPermissionDenied, onSwitchProject, onCreateProject, onRenameProject }) {
  const activeProject = projects.find((project) => project.id === activeProjectId) || projects[0] || null;
  const isSuperAdmin = activeRole?.id === "superadmin";
  return (
    <Panel className="project-city-panel">
      <div className="storage-header">
        <div>
          <h2>Proyectos y ciudades</h2>
          <p>Cada ciudad mantiene sus propios cruces, corredores, eventos y configuracion.</p>
        </div>
        <span className="tag">{projects.length} proyecto(s)</span>
      </div>
      <div className="project-switcher-row">
        <label>
          <span>Proyecto activo</span>
          <select value={activeProject?.id || ""} onChange={(event) => onSwitchProject(event.target.value)}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </label>
        <div className="project-switcher-actions">
          <Button onClick={onCreateProject}>Crear ciudad/proyecto</Button>
          <Button onClick={onRenameProject} variant="secondary">Renombrar activo</Button>
        </div>
      </div>
      {isSuperAdmin ? (
        <div className="project-global-grid">
          {projects.map((project) => (
            <button
              type="button"
              key={project.id}
              className={`project-global-card ${project.id === activeProjectId ? "active" : ""}`}
              onClick={() => onSwitchProject(project.id)}
            >
              <strong>{project.name}</strong>
              <span>{project.crossings?.length || 0} cruce(s)</span>
              <span>{project.corridorIds?.length || 0} en corredor</span>
              <span>{project.log?.length || 0} evento(s)</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="activity-limited-note">
          <strong>Vista de proyecto activo</strong>
          <span>La vista global de ciudades queda reservada al Superadministrador.</span>
        </div>
      )}
    </Panel>
  );
}

function ProjectStoragePanelR25({ storageStatus, activeRole, onPermissionDenied, onSave, onCreatePoint, onRestore, onClearSave }) {
  const restoreCount = loadRestorePoints().length;
  return (
    <Panel className="project-storage-panel">
      <div className="storage-header">
        <div>
          <h2>Guardado del proyecto</h2>
          <p>Guardado automatico local. Exportar JSON sigue siendo la copia externa recomendada.</p>
        </div>
        <div className="panel-tools">
          <HelpButton
            title="Guardado del proyecto"
            items={[
              "Guardar ahora actualiza la copia local del proyecto activo.",
              "Crear punto guarda una restauracion manual antes de cambios delicados.",
              "Restaurar y borrar guardado son acciones criticas y quedan limitadas por permisos.",
            ]}
          />
          <span className="tag">{restoreCount} punto(s)</span>
        </div>
      </div>
      <div className="storage-status-line">{storageStatus}</div>
      <div className="storage-actions-grid">
        <PermissionButton role={activeRole} permission="viewSystem" onDenied={onPermissionDenied} onClick={onSave} action="guardar proyecto">Guardar ahora</PermissionButton>
        <PermissionButton role={activeRole} permission="changePlans" onDenied={onPermissionDenied} onClick={() => onCreatePoint("Punto manual")} action="crear punto de restauracion" variant="secondary">Crear punto</PermissionButton>
        <PermissionButton role={activeRole} permission="changePlans" onDenied={onPermissionDenied} onClick={onRestore} action="restaurar ultimo punto" variant="warning">Restaurar ultimo</PermissionButton>
        <PermissionButton role={activeRole} permission="manageUsers" onDenied={onPermissionDenied} onClick={onClearSave} action="borrar guardado local" variant="danger">Borrar guardado local</PermissionButton>
      </div>
    </Panel>
  );
}

function ProjectCityPanelR25({ projects, activeProjectId, activeRole, onPermissionDenied, onSwitchProject, onCreateProject, onRenameProject }) {
  const activeProject = projects.find((project) => project.id === activeProjectId) || projects[0] || null;
  const isSuperAdmin = activeRole?.id === "superadmin";
  return (
    <Panel className="project-city-panel">
      <div className="storage-header">
        <div>
          <h2>Proyectos y ciudades</h2>
          <p>Cada ciudad mantiene sus propios cruces, corredores, eventos y configuracion.</p>
        </div>
        <div className="panel-tools">
          <HelpButton
            title="Proyectos y ciudades"
            items={[
              "Cada ciudad/proyecto mantiene cruces, corredores, eventos, configuracion y seleccion activa por separado.",
              "Superadministrador ve el resumen global de todas las ciudades.",
              "Crear o renombrar proyectos requiere permiso de administracion.",
            ]}
          />
          <span className="tag">{projects.length} proyecto(s)</span>
        </div>
      </div>
      <div className="project-switcher-row">
        <label>
          <span>Proyecto activo</span>
          <select value={activeProject?.id || ""} onChange={(event) => onSwitchProject(event.target.value)}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </label>
        <div className="project-switcher-actions">
          <PermissionButton role={activeRole} permission="manageUsers" onDenied={onPermissionDenied} onClick={onCreateProject} action="crear ciudad/proyecto">Crear ciudad/proyecto</PermissionButton>
          <PermissionButton role={activeRole} permission="manageUsers" onDenied={onPermissionDenied} onClick={onRenameProject} action="renombrar proyecto activo" variant="secondary">Renombrar activo</PermissionButton>
        </div>
      </div>
      {isSuperAdmin ? (
        <div className="project-global-grid">
          {projects.map((project) => (
            <button
              type="button"
              key={project.id}
              className={`project-global-card ${project.id === activeProjectId ? "active" : ""}`}
              onClick={() => onSwitchProject(project.id)}
            >
              <strong>{project.name}</strong>
              <span>{project.crossings?.length || 0} cruce(s)</span>
              <span>{project.corridorIds?.length || 0} en corredor</span>
              <span>{project.log?.length || 0} evento(s)</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="activity-limited-note">
          <strong>Vista de proyecto activo</strong>
          <span>La vista global de ciudades queda reservada al Superadministrador.</span>
        </div>
      )}
    </Panel>
  );
}

function ConfigurationOverviewPanel({ activeProject, activeRole }) {
  return (
    <Panel className="r25-overview-panel">
      <div className="panel-header">
        <div>
          <h2>Configuracion R25</h2>
          <p>Organiza proyecto, guardado y permisos sin mezclar la operacion diaria del cruce.</p>
        </div>
        <HelpButton title="Configuracion" items={HYDRA_CONFIG_HELP} />
      </div>
      <div className="r25-kpi-grid">
        <Info title="Proyecto" value={activeProject?.name || "Proyecto local"} />
        <Info title="Rol activo" value={activeRole?.name || "Sin sesion"} />
        <Info title="Permisos" value={activeRole?.permissions?.length || 0} />
      </div>
      <div className="permission-rule-grid">
        {Object.values(HYDRA_PERMISSION_RULES).map((rule) => (
          <div key={rule.permission} className={roleHasPermission(activeRole, rule.permission) ? "permission-rule allowed" : "permission-rule denied"}>
            <strong>{rule.label}</strong>
            <span>{roleHasPermission(activeRole, rule.permission) ? "Permitido" : "Bloqueado para este rol"}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function EventsDashboardPanel({ log, issues, activeRole }) {
  const errors = issues.filter((issue) => issue.level === "error").length;
  const warnings = issues.filter((issue) => issue.level === "warning").length;
  const permissionBlocks = log.filter((item) => item.toLowerCase().includes("bloqueado")).length;
  return (
    <Panel className="events-dashboard-panel">
      <div className="panel-header">
        <div>
          <h2>Resumen de eventos</h2>
          <p>Lectura rapida del registro, incidencias y bloqueos por permisos.</p>
        </div>
        <HelpButton title="Eventos" items={HYDRA_EVENTS_HELP} />
      </div>
      <div className="r25-kpi-grid">
        <Info title="Eventos" value={log.length} />
        <Info title="Errores" value={errors} />
        <Info title="Avisos" value={warnings} />
        <Info title="Bloqueos" value={permissionBlocks} />
      </div>
      <div className="activity-limited-note">
        <strong>{roleHasPermission(activeRole, "viewReports") ? "Consulta permitida" : "Consulta limitada"}</strong>
        <span>{roleHasPermission(activeRole, "viewReports") ? "Este rol puede revisar informes y eventos." : permissionReason(activeRole, "viewReports")}</span>
      </div>
    </Panel>
  );
}

function SystemOverviewPanel({ activeProject, activeRole, storageStatus, liveIssues }) {
  return (
    <Panel className="system-overview-panel">
      <div className="panel-header">
        <div>
          <h2>Estado del sistema</h2>
          <p>Resumen tecnico local de servicio, persistencia, licencia y limitaciones actuales.</p>
        </div>
        <HelpButton
          title="Sistema"
          items={[
            "Servicio activo indica que la app local esta cargada y respondiendo.",
            "Persistencia usa almacenamiento del navegador; no es todavia base de datos central.",
            "Backend, WebSocket y sesiones reales quedan para una fase tecnica posterior.",
          ]}
        />
      </div>
      <div className="r25-kpi-grid">
        <Info title="Version" value={HYDRA_VERSION_LABEL} />
        <Info title="Proyecto" value={activeProject?.name || "Proyecto local"} />
        <Info title="Usuario" value={activeRole?.name || "Sin sesion"} />
        <Info title="Incidencias" value={liveIssues.length} />
      </div>
      <div className="system-status-grid">
        {HYDRA_SYSTEM_STATUS_ITEMS.map((item) => (
          <div key={item.title} className={`system-status-card ${item.tone}`}>
            <strong>{item.title}</strong>
            <span>{item.status}</span>
            <small>{item.detail}</small>
          </div>
        ))}
      </div>
      <div className="storage-status-line">{storageStatus}</div>
    </Panel>
  );
}

function SectionPage({ title, description, tag, children }) {
  return (
    <section className="section-page">
      <div className="section-page-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {tag && <span className="tag">{tag}</span>}
      </div>
      <div className="section-page-body">{children}</div>
    </section>
  );
}

function SectionPlaceholder({ title, description, items = [] }) {
  return (
    <Panel className="section-placeholder-panel">
      <h2>{title}</h2>
      <p>{description}</p>
      {items.length > 0 && (
        <div className="section-placeholder-grid">
          {items.map((item) => (
            <div key={item.title} className="section-placeholder-card">
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function SessionMenu({ role, onOpenUsers, onSwitchUser, onLogout }) {
  return (
    <div className="session-menu">
      <div className="session-menu-header">
        <span>Sesion activa</span>
        <strong>{role?.name || "Sin sesion"}</strong>
      </div>
      <div className="session-menu-body">
        <p>{role?.description || "Acceso local simulado pendiente de iniciar."}</p>
        <div className="session-menu-actions">
          <button type="button" onClick={onOpenUsers}>Ir a Usuarios</button>
          <button type="button" onClick={onSwitchUser}>Cambiar usuario</button>
          <button type="button" onClick={onLogout} className="danger">Cerrar sesion</button>
        </div>
      </div>
    </div>
  );
}

function LoginModal({ open, selectedRoleId, pin, error, onRoleChange, onPinChange, onSubmit, onClose }) {
  if (!open) return null;
  const selectedRole = getRoleById(selectedRoleId) || HYDRA_ROLES[1];
  return (
    <div className="access-modal-backdrop" role="presentation">
      <div className="access-modal" role="dialog" aria-modal="true" aria-label="Acceso Hydra">
        <div className="access-modal-header">
          <div>
            <span>Acceso local simulado</span>
            <h2>Acceso Hydra</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar acceso">x</button>
        </div>

        <form className="access-form" onSubmit={onSubmit}>
          <label>
            Usuario / rol
            <select value={selectedRoleId} onChange={(event) => onRoleChange(event.target.value)}>
              {HYDRA_ROLES.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </label>
          <label>
            PIN
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(event) => onPinChange(event.target.value)}
              placeholder="PIN de prueba"
              autoFocus
            />
          </label>
          {error && <div className="access-error">{error}</div>}
          <div className="access-role-note">
            <strong>{selectedRole.name}</strong>
            <span>{selectedRole.description}</span>
            <small>PIN demo: {selectedRole.pin}</small>
          </div>
          <div className="access-actions">
            <Button type="submit">Entrar</Button>
            <Button type="button" onClick={onClose} variant="secondary">Cancelar</Button>
          </div>
        </form>

        <p className="access-warning">Esto es una capa de acceso local/simulada para laboratorio. La seguridad real necesitara backend, contrasenas protegidas, auditoria y PIN para acciones criticas.</p>
      </div>
    </div>
  );
}

function UsersPanel({ activeRole, activeUser, activeSection, onRequestLogin }) {
  const permissionKeys = Object.keys(HYDRA_PERMISSION_LABELS);
  const isSuperadmin = activeRole?.id === "superadmin";
  const currentActivity = activeRole
    ? {
        roleId: activeRole.id,
        status: "conectado",
        section: activeSection || "Inicio",
        summary: `Sesion local activa en ${activeSection || "Inicio"}`,
        lastAction: "Uso local simulado desde este navegador",
        time: activeUser?.startedAt ? `desde ${formatHydraTime(activeUser.startedAt)}` : "sesion local",
      }
    : null;
  const visibleActivity = isSuperadmin
    ? [currentActivity, ...HYDRA_SIMULATED_USER_ACTIVITY].filter(Boolean)
    : [currentActivity].filter(Boolean);
  return (
    <Panel className="users-panel">
      <div className="users-panel-header">
        <div>
          <h2>Usuarios y roles</h2>
          <p>Roles previstos para operar Hydra sin mezclar permisos de consulta, operacion, mantenimiento y administracion.</p>
        </div>
        <span className="tag">{activeRole?.name || "Sin sesion"}</span>
      </div>

      <div className="roles-grid">
        {HYDRA_ROLES.map((role) => (
          <article key={role.id} className={activeRole?.id === role.id ? "role-card active" : "role-card"}>
            <div className="role-card-title">
              <strong>{role.name}</strong>
              {activeRole?.id === role.id && <span>Activo</span>}
            </div>
            <p>{role.description}</p>
            <div className="role-permission-chips">
              {permissionKeys.map((key) => (
                <span key={key} className={role.permissions.includes(key) ? "permission-chip enabled" : "permission-chip disabled"}>
                  {HYDRA_PERMISSION_LABELS[key]}
                </span>
              ))}
            </div>
            <button type="button" className="role-login-button" onClick={() => onRequestLogin(role.id)}>
              Entrar como {role.name}
            </button>
          </article>
        ))}
      </div>

      <div className="permissions-table-wrap">
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Rol</th>
              {permissionKeys.map((key) => <th key={key}>{HYDRA_PERMISSION_LABELS[key]}</th>)}
            </tr>
          </thead>
          <tbody>
            {HYDRA_ROLES.map((role) => (
              <tr key={role.id}>
                <td>{role.name}</td>
                {permissionKeys.map((key) => (
                  <td key={key}>{role.permissions.includes(key) ? "Si" : "-"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="system-activity-panel">
        <div className="system-activity-header">
          <div>
            <h3>Actividad del sistema</h3>
            <p>
              {isSuperadmin
                ? "Vista local simulada para preparar presencia, auditoria y actividad multiusuario."
                : "Tu rol solo puede ver su propia sesion local en esta version de laboratorio."}
            </p>
          </div>
          <span className={isSuperadmin ? "activity-access full" : "activity-access limited"}>
            {isSuperadmin ? "Vista completa" : "Vista limitada"}
          </span>
        </div>

        <div className="activity-presence-grid">
          {visibleActivity.map((item, index) => {
            const role = getRoleById(item.roleId);
            return (
              <article key={`${item.roleId}-${index}`} className={`presence-card status-${item.status}`}>
                <div className="presence-card-top">
                  <div>
                    <strong>{role?.name || "Usuario"}</strong>
                    <span>{item.summary}</span>
                  </div>
                  <em>{item.status}</em>
                </div>
                <div className="presence-meta">
                  <span>Seccion: {item.section}</span>
                  <span>{item.time}</span>
                </div>
                <p>{item.lastAction}</p>
              </article>
            );
          })}
        </div>

        {isSuperadmin ? (
          <div className="activity-log-card">
            <div>
              <strong>Registro visual reciente</strong>
              <span>Simulado hasta integrar backend/WebSocket.</span>
            </div>
            <ul>
              {HYDRA_SIMULATED_ACTIVITY_LOG.map((item, index) => (
                <li key={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="activity-limited-note">
            <strong>Permiso limitado</strong>
            <span>La actividad de otros roles queda reservada al Superadministrador.</span>
          </div>
        )}
      </div>
    </Panel>
  );
}

function App() {
  const savedProjectsOnLoad = useMemo(() => loadHydraProjects(), []);
  const activeProjectOnLoad = savedProjectsOnLoad.projects.find((project) => project.id === savedProjectsOnLoad.activeProjectId) || savedProjectsOnLoad.projects[0];
  const savedSessionOnLoad = useMemo(() => loadHydraSession(), []);
  const [projects, setProjects] = useState(savedProjectsOnLoad.projects);
  const [activeProjectId, setActiveProjectId] = useState(savedProjectsOnLoad.activeProjectId);
  const [storageStatus, setStorageStatus] = useState(savedProjectsOnLoad.migratedFromLegacy ? "Guardado anterior migrado a Proyecto local." : `Proyecto activo: ${activeProjectOnLoad?.name || "Proyecto local"}`);
  const [eventsOpen, setEventsOpen] = useState(true);
  const [eventsMinimized, setEventsMinimized] = useState(false);
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(savedSessionOnLoad);
  const [loginOpen, setLoginOpen] = useState(!savedSessionOnLoad);
  const [loginRoleId, setLoginRoleId] = useState(savedSessionOnLoad?.roleId || "admin");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === "undefined" || !storageAvailable()) return "Inicio";
    const stored = window.localStorage.getItem(HYDRA_SECTION_KEY);
    return HYDRA_SECTIONS.includes(stored) ? stored : "Inicio";
  });

  const [crossings, setCrossings] = useState(activeProjectOnLoad?.crossings || []);
  const [manualLinks, setManualLinks] = useState(activeProjectOnLoad?.manualLinks || []);
  const [tick, setTick] = useState(activeProjectOnLoad?.tick || 0);
  const [running, setRunning] = useState(false);
  const [selectedId, setSelectedId] = useState(activeProjectOnLoad?.selectedId || activeProjectOnLoad?.crossings?.[0]?.id || null);
  const [corridorIds, setCorridorIds] = useState(activeProjectOnLoad?.corridorIds || []);
  const [addMode, setAddMode] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [linkStartId, setLinkStartId] = useState(null);
  const [log, setLog] = useState(activeProjectOnLoad?.log || [`${HYDRA_VERSION_LABEL} cargada: guardado multi-proyecto activo.`]);
  const [lastCheck, setLastCheck] = useState([]);
  const [settings, setSettings] = useState(activeProjectOnLoad?.settings || DEFAULT_SETTINGS);

  const selected = crossings.find((c) => c.id === selectedId) || null;
  const activeRole = getRoleById(activeUser?.roleId);
  const activeProject = projects.find((project) => project.id === activeProjectId) || projects[0] || null;

  const signals = useMemo(() => {
    const result = {};
    crossings.forEach((crossing) => {
      result[crossing.id] = getSignal(crossing, tick, settings);
    });
    return result;
  }, [crossings, tick, settings]);

  const liveIssues = useMemo(() => validateSystem(crossings, manualLinks, corridorIds, signals, settings), [crossings, manualLinks, corridorIds, signals, settings]);

  useEffect(() => {
    if (typeof window === "undefined" || !storageAvailable()) return;
    window.localStorage.setItem(HYDRA_SECTION_KEY, activeSection);
  }, [activeSection]);

  function openLogin(roleId = activeRole?.id || "admin") {
    setLoginRoleId(roleId);
    setLoginPin("");
    setLoginError("");
    setLoginOpen(true);
    setSessionMenuOpen(false);
  }

  function submitLogin(event) {
    event.preventDefault();
    const role = getRoleById(loginRoleId);
    if (!role) {
      setLoginError("Rol no disponible.");
      return;
    }
    if (loginPin.trim() !== role.pin) {
      setLoginError("PIN incorrecto para el rol seleccionado.");
      return;
    }
    const session = {
      roleId: role.id,
      startedAt: new Date().toISOString(),
    };
    saveHydraSession(session);
    setActiveUser(session);
    setLoginOpen(false);
    setSessionMenuOpen(false);
    setLoginPin("");
    setLoginError("");
    setLog((old) => [`Sesion iniciada: ${role.name}.`, ...old].slice(0, 120));
  }

  function logout() {
    clearHydraSession();
    setActiveUser(null);
    setLoginOpen(true);
    setSessionMenuOpen(false);
    setLoginPin("");
    setLoginError("");
    setLog((old) => ["Sesion cerrada.", ...old].slice(0, 120));
  }

  function goToUsers() {
    setActiveSection("Usuarios");
    setSessionMenuOpen(false);
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const snapshot = {
        crossings,
        manualLinks,
        tick,
        selectedId,
        corridorIds,
        settings,
        log,
      };
      setProjects((old) => {
        const next = updateProjectSnapshot(old, activeProjectId, snapshot);
        const ok = saveHydraProjects({ activeProjectId, projects: next });
        if (ok) setStorageStatus(`Guardado automatico: ${activeProject?.name || "Proyecto"} - ${new Date().toLocaleTimeString()}`);
        return next;
      });
    }, 650);
    return () => window.clearTimeout(handle);
  }, [crossings, manualLinks, tick, selectedId, corridorIds, settings, log, activeProjectId, activeProject?.name]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setTick((old) => old + 1);
      setCrossings((old) => old.map((crossing) => {
        const signal = getSignal(crossing, tick + 1, settings);
        const queues = { ...crossing.queues };
        const pedestrianRequests = { ...crossing.pedestrianRequests };

        if (settings.autoTraffic) {
            if (Math.random() < effectiveArrival(crossing, "NS") / 60) queues.NS = clamp(queues.NS + 1, 0, MAX_QUEUE);
            if (Math.random() < effectiveArrival(crossing, "EW") / 60) queues.EW = clamp(queues.EW + 1, 0, MAX_QUEUE);
          }

        if (signal.stage === "green") {
          queues.NS = clamp(queues.NS - settings.dischargeRate * 0.5, 0, MAX_QUEUE);
          queues.EW = clamp(queues.EW - settings.dischargeRate * 0.5, 0, MAX_QUEUE);
          pedestrianRequests.NS = 0;
          pedestrianRequests.EW = 0;
        }

        const withQueues = { ...crossing, queues };
        return {
          ...withQueues,
          pedestrianRequests,
          cameras: crossing.cameras.map((camera) => simulateCamera(camera, withQueues, running)),
          hardware: simulateHardware(crossing.hardware, running),
        };
      }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, tick, settings]);

  function addLog(text) {
    setLog((old) => [`${new Date().toLocaleTimeString()} · ${text}`, ...old].slice(0, 80));
  }

  function handlePermissionDenied(permission, action = "accion") {
    const message = `Bloqueado: ${action} requiere ${permissionLabel(permission)} (${activeRole?.name || "sin sesion"}).`;
    setLog((old) => [`${new Date().toLocaleTimeString()} - ${message}`, ...old].slice(0, 80));
    setEventsOpen(true);
    setEventsMinimized(false);
  }

  function guardAction(permission, action, fn) {
    return (...args) => {
      if (!roleHasPermission(activeRole, permission)) {
        handlePermissionDenied(permission, action);
        return undefined;
      }
      return typeof fn === "function" ? fn(...args) : undefined;
    };
  }

  function projectSnapshot() {
    return {
      crossings,
      manualLinks,
      tick,
      selectedId,
      corridorIds,
      settings,
      log,
    };
  }

  function applyProject(project, message = "") {
    const snapshot = normalizeProjectSnapshot(project);
    setRunning(false);
    setCrossings(snapshot.crossings);
    setManualLinks(snapshot.manualLinks);
    setTick(snapshot.tick);
    setSelectedId(snapshot.selectedId || snapshot.crossings[0]?.id || null);
    setCorridorIds(snapshot.corridorIds);
    setSettings(snapshot.settings);
    setLog(message ? [message, ...snapshot.log].slice(0, 120) : snapshot.log);
    setLastCheck([]);
    setLinkStartId(null);
    setLinkMode(false);
  }

  function saveProjectsBundle(nextProjects, nextActiveProjectId = activeProjectId) {
    const ok = saveHydraProjects({ activeProjectId: nextActiveProjectId, projects: nextProjects });
    setStorageStatus(ok ? `Proyecto activo: ${(nextProjects.find((project) => project.id === nextActiveProjectId) || nextProjects[0])?.name || "Proyecto"}` : "No se pudo guardar la lista de proyectos.");
    return ok;
  }

  function switchProject(projectId) {
    if (!projectId || projectId === activeProjectId) return;
    const currentSaved = updateProjectSnapshot(projects, activeProjectId, projectSnapshot());
    const target = currentSaved.find((project) => project.id === projectId);
    if (!target) return;
    setProjects(currentSaved);
    setActiveProjectId(target.id);
    applyProject(target, `Proyecto activo: ${target.name}.`);
    saveProjectsBundle(currentSaved, target.id);
  }

  function createProject() {
    const name = window.prompt("Nombre de la ciudad/proyecto", `Ciudad ${projects.length + 1}`);
    if (name === null) return;
    const cleaned = cleanProjectName(name, `Ciudad ${projects.length + 1}`);
    const currentSaved = updateProjectSnapshot(projects, activeProjectId, projectSnapshot());
    const project = makeProjectFromSnapshot({
      log: [`Proyecto creado: ${cleaned}.`],
      settings,
    }, cleaned);
    const next = [...currentSaved, project];
    setProjects(next);
    setActiveProjectId(project.id);
    applyProject(project, `Proyecto activo: ${project.name}.`);
    saveProjectsBundle(next, project.id);
  }

  function renameActiveProject() {
    if (!activeProject) return;
    const name = window.prompt("Nuevo nombre de la ciudad/proyecto", activeProject.name);
    if (name === null) return;
    const cleaned = cleanProjectName(name, activeProject.name);
    const currentSaved = updateProjectSnapshot(projects, activeProjectId, projectSnapshot());
    const next = currentSaved.map((project) => project.id === activeProjectId ? {
      ...project,
      name: cleaned,
      city: cleaned,
      updatedAt: new Date().toISOString(),
    } : project);
    setProjects(next);
    saveProjectsBundle(next, activeProjectId);
    setLog((old) => [`Proyecto renombrado: ${cleaned}.`, ...old].slice(0, 120));
  }

  function saveNow(label = "Guardado manual realizado") {
    const next = updateProjectSnapshot(projects, activeProjectId, projectSnapshot());
    setProjects(next);
    const ok = saveHydraProjects({ activeProjectId, projects: next });
    setStorageStatus(ok ? `${label} · ${new Date().toLocaleTimeString()}` : "No se pudo guardar localmente.");
    if (ok) addLog(label);
  }

  function createRestorePoint(label = "Punto manual") {
    const ok = saveRestorePoint(label, projectSnapshot());
    setStorageStatus(ok ? `Punto de restauración creado: ${label}` : "No se pudo crear punto de restauración.");
    if (ok) addLog(`Punto de restauración creado: ${label}.`);
  }

  function restoreLastPoint() {
    const points = loadRestorePoints();
    const last = points[0];
    if (!last?.snapshot) {
      alert("No hay puntos de restauración.");
      return;
    }
    if (!window.confirm(`Restaurar "${last.label}" del ${formatHydraDate(last.createdAt)}?`)) return;
    const snap = last.snapshot;
    setRunning(false);
    setCrossings(snap.crossings || []);
    setManualLinks(snap.manualLinks || []);
    setTick(snap.tick || 0);
    setSelectedId(snap.selectedId || snap.crossings?.[0]?.id || null);
    setCorridorIds(snap.corridorIds || []);
    setSettings(snap.settings || settings);
    setLog([`Restaurado punto: ${last.label}.`, ...(snap.log || [])].slice(0, 80));
    const next = updateProjectSnapshot(projects, activeProjectId, { ...snap, running: false });
    setProjects(next);
    saveHydraProjects({ activeProjectId, projects: next });
    setStorageStatus(`Restaurado: ${last.label}`);
  }

  function clearLocalSave() {
    if (!window.confirm("Borrar el guardado local? No borra lo que ves ahora, solo la copia automática del navegador.")) return;
    clearHydraProjectsSave();
    setStorageStatus("Guardado multi-proyecto borrado. El proyecto actual sigue abierto.");
    addLog("Guardado multi-proyecto borrado.");
  }


  function addCrossing(lat, lng) {
    const id = nextId(crossings);
    const crossing = makeCrossing(id, `Nuevo cruce ${id}`, lat, lng, crossings.length, "X");
    setCrossings((old) => [...old, crossing]);
    setSelectedId(id);
    setCorridorIds((old) => old.length < 5 ? [...old, id] : old);
    addLog(`Añadido ${crossing.name}.`);
  }

  function addCrossingFromPanel() {
    const baseLat = selected?.lat ?? CENTER[0];
    const baseLng = selected?.lng ?? CENTER[1];
    addCrossing(baseLat + 0.00035, baseLng + 0.00035);
  }


  function moveCrossing(id, lat, lng) {
    setCrossings((old) => old.map((c) => c.id === id ? { ...c, lat, lng } : c));
  }

  function toggleCorridor(id) {
    setCorridorIds((old) => old.includes(id) ? old.filter((item) => item !== id) : old.length < 5 ? [...old, id] : old);
    addLog(`Corredor actualizado con ${id}.`);
  }

  function onMarkerLinkClick(id) {
    setSelectedId(id);
    if (!linkStartId) {
      setLinkStartId(id);
      addLog(`Inicio de enlace manual en ${id}.`);
      return;
    }
    if (linkStartId === id) {
      setLinkStartId(null);
      return;
    }
    setManualLinks((old) => toggleLink(old, linkStartId, id));
    addLog(`Enlace manual cambiado: ${linkStartId} ↔ ${id}.`);
    setLinkStartId(null);
  }

  function optimizeOffsets() {
    const ordered = [...corridorIds].sort((a, b) => {
      const ca = crossings.find((c) => c.id === a);
      const cb = crossings.find((c) => c.id === b);
      return (ca?.lng || 0) - (cb?.lng || 0);
    });

    setCorridorIds(ordered);
    setCrossings((old) => old.map((c) => {
      const index = ordered.indexOf(c.id);
      if (index < 0) return c;
      return { ...c, linked: true, operatorManual: false, localMode: false, offset: index * 10 };
    }));
    addLog(`Onda verde recalculada: ${ordered.join(" → ")}.`);
  }

  function toggleManual() {
    if (!selected) return;
    setCrossings((old) => old.map((c) => c.id === selected.id ? { ...c, operatorManual: !c.operatorManual, linked: c.operatorManual } : c));
    addLog(`Selector manual/auto cambiado en ${selected.id}.`);
  }

  function setRegulatorMode(id, manual) {
    setCrossings((old) => old.map((c) => c.id === id ? {
      ...c,
      operatorManual: manual,
      localMode: manual ? true : false,
      linked: manual ? false : true,
    } : c));
    setSettings((old) => ({ ...old, manualAssist: manual ? true : old.manualAssist }));
    addLog(manual ? `Regulador ${id}: MANUAL/persona.` : `Regulador ${id}: programación automática.`);
  }

  function updateSelected(field, value) {
    if (!selected) return;

    if (typeof value === "object" && value !== null) {
      setCrossings((old) => old.map((c) => c.id === field ? { ...c, ...value } : c));
      return;
    }

    setCrossings((old) => old.map((c) => c.id === selected.id ? { ...c, [field]: value } : c));
  }

  function renameCrossingId(oldId, rawNewId) {
    const newId = sanitizeCrossingId(rawNewId, oldId);
    if (!newId || newId === oldId) return;
    if (crossings.some((c) => c.id === newId && c.id !== oldId)) {
      addLog(`ID ${newId} ya existe. No se ha cambiado el ID de ${oldId}.`);
      return;
    }

    setCrossings((old) => old.map((c) => c.id === oldId ? { ...c, id: newId, technicalId: undefined } : c));
    setSelectedId((current) => current === oldId ? newId : current);
    setCorridorIds((old) => old.map((id) => id === oldId ? newId : id));
    setManualLinks((old) => old.map((link) => ({
      ...link,
      from: link.from === oldId ? newId : link.from,
      to: link.to === oldId ? newId : link.to,
    })));
    setLinkStartId((current) => current === oldId ? newId : current);
    addLog(`ID de cruce cambiado: ${oldId} → ${newId}.`);
  }

  function setLocalMode(id, local) {
    setCrossings((old) => old.map((c) => c.id === id ? {
      ...c,
      localMode: local,
      operatorManual: local ? false : c.operatorManual,
      linked: local ? false : c.linked,
    } : c));
    addLog(local ? `Regulador ${id}: automático local.` : `Regulador ${id}: sale de modo local.`);
  }

  function useFirstNCorridor(count) {
    const ordered = [...crossings]
      .sort((a, b) => a.lng - b.lng || b.lat - a.lat)
      .slice(0, count)
      .map((crossing) => crossing.id);
    setCorridorIds(ordered);
    setCrossings((old) => old.map((crossing) => ({ ...crossing, linked: ordered.includes(crossing.id) })));
    addLog(`Cruces seleccionados: ${ordered.join(" → ") || "vacío"}.`);
  }

  function orderCorridorByMap() {
    const ordered = sortCrossingIdsByMap(crossings, corridorIds);
    setCorridorIds(ordered);
    addLog(`Corredor ordenado por mapa: ${ordered.join(" → ") || "vacío"}.`);
  }

  function setGeometry(id, geometryType) {
    setCrossings((old) => old.map((c) => c.id === id ? { ...c, geometry: makeGeometry(geometryType) } : c));
    addLog(`Geometría de ${id} cambiada a ${GEOMETRIES[geometryType]}.`);
  }

  function updateGeometry(id, geometry) {
    setCrossings((old) => old.map((c) => c.id === id ? { ...c, geometry } : c));
  }

  function deleteSelected() {
    if (!selected) return;
    const id = selected.id;
    if (!window.confirm(`Eliminar cruce ${id}? Se creará un punto de restauración antes.`)) return;
    saveRestorePoint(`Antes de eliminar cruce ${id}`, projectSnapshot());
    const remaining = crossings.filter((c) => c.id !== id);
    setCrossings(remaining);
    setManualLinks((old) => removeLinksForCrossing(old, id));
    setCorridorIds((old) => old.filter((item) => item !== id));
    setSelectedId(remaining[0]?.id || null);
    addLog(`Eliminado cruce ${id}. Punto de restauración creado.`);
    setStorageStatus(`Cruce ${id} eliminado. Puedes restaurar el punto anterior.`);
  }

  function manualVehicle(id, direction, amount) {
    setCrossings((old) => old.map((c) => c.id === id ? { ...c, queues: { ...c.queues, [direction]: clamp(c.queues[direction] + amount, 0, MAX_QUEUE) } } : c));
    addLog(`Demanda ${id}/${direction}: ${amount > 0 ? "+" : ""}${amount} vehículo(s).`);
  }

  function requestPedestrian(id, direction) {
    setCrossings((old) => old.map((c) => c.id === id ? { ...c, pedestrianRequests: { ...c.pedestrianRequests, [direction]: clamp(c.pedestrianRequests[direction] + 1, 0, 9) } } : c));
    addLog(`Petición peatonal ${id}/${direction}.`);
  }

  function setArrivalRate(id, direction, value) {
    setCrossings((old) => old.map((c) => c.id === id ? { ...c, arrivals: { ...c.arrivals, [direction]: value } } : c));
  }

  function setDemandPlan(id, plan) {
    setCrossings((old) => old.map((c) => c.id === id ? { ...c, demandPlan: plan } : c));
    addLog(`Plan de demanda ${id}: ${demandPlanLabel(plan)}.`);
  }

  function setDemandFactor(id, value) {
    const factor = clamp(Number(value), 25, 250);
    setCrossings((old) => old.map((c) => c.id === id ? { ...c, demandFactor: factor } : c));
  }

  function toggleHardwareFlag(id, field) {
    setCrossings((old) => old.map((c) => c.id === id ? { ...c, hardware: { ...c.hardware, [field]: !c.hardware[field] } } : c));
    addLog(`Hardware ${id}/${field} cambiado.`);
  }

  function toggleOpticFault(id, opticKey) {
    setCrossings((old) => old.map((c) => {
      if (c.id !== id) return c;
      const faults = { ...c.hardware.opticFaults };
      if (faults[opticKey]) delete faults[opticKey];
      else faults[opticKey] = "sin_consumo";
      return { ...c, hardware: { ...c.hardware, opticFaults: faults } };
    }));
    addLog(`Óptica ${id}/${opticKey} cambiada.`);
  }

  function toggleCamera(id, cameraId) {
    setCrossings((old) => old.map((c) => c.id === id ? { ...c, cameras: c.cameras.map((camera) => camera.id === cameraId ? { ...camera, enabled: !camera.enabled } : camera) } : c));
    addLog(`Cámara ${id}/${cameraId} activada/desactivada.`);
  }

  function toggleCameraOk(id, cameraId) {
    setCrossings((old) => old.map((c) => c.id === id ? { ...c, cameras: c.cameras.map((camera) => camera.id === cameraId ? { ...camera, ok: !camera.ok } : camera) } : c));
    addLog(`Estado de cámara ${id}/${cameraId} cambiado.`);
  }

  function addCamera(id) {
    setCrossings((old) => old.map((c) => {
      if (c.id !== id) return c;
      const camId = `CAM${c.cameras.length + 1}`;
      return { ...c, cameras: [...c.cameras, makeCamera(camId, `Cámara ${camId}`, c.cameras.length % 2 === 0 ? "NS" : "EW")] };
    }));
    addLog(`Añadida cámara a ${id}.`);
  }

  function removeCamera(id, cameraId) {
    const crossing = crossings.find((c) => c.id === id);
    const camera = crossing?.cameras?.find((item) => item.id === cameraId);
    const cameraName = camera?.name || cameraId;
    if (!window.confirm(`¿Quieres quitar la cámara "${cameraName}"?`)) return;
    setCrossings((old) => old.map((c) => c.id === id ? { ...c, cameras: c.cameras.filter((item) => item.id !== cameraId) } : c));
    addLog(`Quitada cámara ${id}/${cameraName}.`);
  }

  function safeManualStep() {
    const selectedSignal = selected ? signals[selected.id] : null;
    if (!settings.manualAssist || !selectedSignal) return;
    const jump = Math.max(1, selectedSignal.remaining);
    setTick((old) => old + jump);
    addLog(`Manual asistido: avance seguro en ${selected.id}.`);
  }

  function activateFaultMode() {
    if (!selected) return;
    setCrossings((old) => old.map((c) => c.id === selected.id ? { ...c, localMode: true, operatorManual: true, linked: false } : c));
    setSettings((old) => ({ ...old, manualAssist: true, adaptive: false }));
    addLog(`Modo avería local activado en ${selected.id}.`);
  }

  function clearActiveQueue() {
    if (!selected || !settings.manualAssist) return;
    const dir = selected.queues.NS >= selected.queues.EW ? "NS" : "EW";
    setCrossings((old) => old.map((c) => c.id === selected.id ? { ...c, queues: { ...c.queues, [dir]: clamp(c.queues[dir] - 8, 0, MAX_QUEUE) } } : c));
    addLog(`Manual asistido: prioridad a cola ${selected.id}/${dir}.`);
  }

  function runCheck() {
    const issues = validateSystem(crossings, manualLinks, corridorIds, signals, settings);
    setLastCheck(issues);
    addLog(`Comprobación ejecutada: ${issues.length} incidencia(s).`);
  }

  function reset() {
    if (!window.confirm("Crear proyecto nuevo vacío? Se creará un punto de restauración antes.")) return;
    saveRestorePoint("Antes de crear proyecto nuevo", projectSnapshot());
    setRunning(false);
    setTick(0);
    setCrossings([]);
    setManualLinks([]);
    setSelectedId(null);
    setCorridorIds([]);
    setLinkStartId(null);
    setLinkMode(false);
    setLog(["Proyecto nuevo vacío creado. Usa “Añadir cruce” para empezar."]);
    setLastCheck([]);
    setStorageStatus("Proyecto nuevo vacío creado. Punto de restauración disponible.");
  }

  async function exportJson() {
    const data = JSON.stringify({ version: HYDRA_VERSION_SLUG, project: activeProject, crossings, corridorIds, manualLinks, settings }, null, 2);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(data);
        alert("Configuración copiada al portapapeles como JSON.");
      } else {
        console.info("Export JSON:", data);
        alert("Portapapeles no disponible. El JSON se ha escrito en la consola del navegador.");
      }
    } catch (error) {
      console.error("No se pudo copiar JSON:", error, data);
      alert("No se pudo copiar al portapapeles. El JSON se ha escrito en la consola del navegador.");
    }
    addLog("Configuración exportada a JSON.");
  }

  const selectedSignal = selected ? signals[selected.id] : null;

  function setSettingsWithPermission(updater) {
    if (!roleHasPermission(activeRole, "changePlans")) {
      handlePermissionDenied("changePlans", "cambiar ajustes globales");
      return;
    }
    setSettings(updater);
  }

  function renderMapAndControl() {
    return (
      <section className="control-dashboard-layout">
        <div className="control-map-column">
          <LeafletMapView
            crossings={crossings}
            signals={signals}
            selectedId={selected?.id || ""}
            corridorIds={corridorIds}
            addMode={addMode}
            linkMode={linkMode}
            linkStartId={linkStartId}
            manualLinks={manualLinks}
            settings={settings}
            onAdd={guardAction("editGeometry", "anadir cruce desde mapa", addCrossing)}
            onSelect={setSelectedId}
            onMove={guardAction("editGeometry", "mover cruce en mapa", moveCrossing)}
            onToggleCorridor={guardAction("changePlans", "cambiar corredor desde mapa", toggleCorridor)}
            onMarkerLinkClick={guardAction("changePlans", "crear enlace manual desde mapa", onMarkerLinkClick)}
          />
        </div>

        {selected ? (
          <RightControlPanel
            selected={selected}
            settings={settings}
            setSettings={setSettingsWithPermission}
            tick={tick}
            crossings={crossings}
            liveIssues={liveIssues}
            corridorIds={corridorIds}
            onSetRegulatorMode={guardAction("operateCrossings", "cambiar modo del regulador", setRegulatorMode)}
            onSetLocalMode={guardAction("operateCrossings", "cambiar modo local", setLocalMode)}
            onFaultMode={guardAction("operateCrossings", "activar averia local", activateFaultMode)}
            onSafeStep={guardAction("operateCrossings", "avanzar etapa segura", safeManualStep)}
            onClearActiveQueue={guardAction("operateCrossings", "priorizar cola activa", clearActiveQueue)}
            onAddCrossing={guardAction("editGeometry", "anadir cruce desde control", addCrossingFromPanel)}
            running={running}
            onToggleRunning={guardAction("operateCrossings", "iniciar o pausar simulacion", () => setRunning((value) => !value))}
            onToggleLinkMode={guardAction("changePlans", "activar unir cruces", () => { setLinkMode((value) => !value); setLinkStartId(null); })}
            linkMode={linkMode}
            onOptimize={guardAction("changePlans", "optimizar onda verde", optimizeOffsets)}
            onRunCheck={guardAction("viewSystem", "comprobar sistema", runCheck)}
            onDelete={guardAction("editGeometry", "eliminar cruce", deleteSelected)}
            onExport={guardAction("viewReports", "exportar JSON", exportJson)}
            onReset={guardAction("manageUsers", "crear proyecto nuevo", reset)}
            onSelectCrossing={setSelectedId}
            activeRole={activeRole}
            onPermissionDenied={handlePermissionDenied}
          />
        ) : (
          <EmptySelectionPanel addMode={addMode} onAddFirst={guardAction("editGeometry", "anadir primer cruce", () => addCrossing(CENTER[0], CENTER[1]))} onToggleAddMode={guardAction("editGeometry", "activar modo anadir cruce", () => setAddMode((value) => !value))} />
        )}
      </section>
    );
  }

  function renderCorridor() {
    return (
      <CorridorPanel
        crossings={crossings}
        corridorIds={corridorIds}
        signals={signals}
        selectedId={selected?.id || ""}
        onSelect={setSelectedId}
        onToggleCorridor={guardAction("changePlans", "cambiar corredor", toggleCorridor)}
        onUseFirstN={guardAction("changePlans", "usar primeros cruces del corredor", useFirstNCorridor)}
        onOrderByMap={guardAction("changePlans", "ordenar corredor por mapa", orderCorridorByMap)}
        onOptimize={guardAction("changePlans", "optimizar onda verde", optimizeOffsets)}
      />
    );
  }

  function renderCrossingWorkspace() {
    if (!selected || !selectedSignal) {
      return <EmptySelectionPanel addMode={addMode} onAddFirst={guardAction("editGeometry", "anadir primer cruce", () => addCrossing(CENTER[0], CENTER[1]))} onToggleAddMode={guardAction("editGeometry", "activar modo anadir cruce", () => setAddMode((value) => !value))} />;
    }

    return (
      <>
        <CrossingDetails selected={selected} signal={selectedSignal} />
        <section className="two-col detector-control-row">
          <DetectorPanel selected={selected} settings={settings} />
          <ControlPanel
            selected={selected}
            settings={settings}
            setSettings={setSettingsWithPermission}
            corridorIds={corridorIds}
            manualLinks={manualLinks}
            linkMode={linkMode}
            linkStartId={linkStartId}
            onToggleManual={guardAction("operateCrossings", "cambiar manual/automatico del cruce", toggleManual)}
            onToggleCorridor={guardAction("changePlans", "cambiar cruce en corredor", toggleCorridor)}
            onUpdateSelected={guardAction("editGeometry", "editar datos del cruce", updateSelected)}
            onRenameCrossingId={guardAction("editGeometry", "renombrar ID del cruce", renameCrossingId)}
            onSetGeometry={guardAction("editGeometry", "cambiar geometria del cruce", setGeometry)}
            onSetLinkMode={guardAction("changePlans", "cambiar modo unir cruces", (value) => { setLinkMode(value); setLinkStartId(null); })}
            onClearLinkStart={() => setLinkStartId(null)}
            onRemoveAllLinks={guardAction("changePlans", "borrar enlaces manuales", () => { setManualLinks([]); addLog("Enlaces manuales borrados."); })}
          />
        </section>

        <section className="two-col traffic-camera-row">
          <TrafficDemandPanel
            selected={selected}
            onVehicle={guardAction("operateCrossings", "modificar cola simulada", manualVehicle)}
            onPedestrian={guardAction("operateCrossings", "registrar peticion peatonal", requestPedestrian)}
            onArrivalRate={guardAction("changePlans", "cambiar llegadas base", setArrivalRate)}
            onDemandPlan={guardAction("changePlans", "cambiar plan de demanda", setDemandPlan)}
            onDemandFactor={guardAction("changePlans", "cambiar factor de ajuste", setDemandFactor)}
          />
          <CameraPanel
            selected={selected}
            settings={settings}
            onToggleCamera={guardAction("maintainHardware", "activar o desactivar camara", toggleCamera)}
            onToggleCameraOk={guardAction("maintainHardware", "cambiar estado de camara", toggleCameraOk)}
            onAddCamera={guardAction("maintainHardware", "anadir camara", addCamera)}
            onRemoveCamera={guardAction("maintainHardware", "quitar camara", removeCamera)}
          />
        </section>

        <HardwareHealthPanel selected={selected} onToggleOpticFault={guardAction("maintainHardware", "cambiar estado de optica", toggleOpticFault)} onToggleHardwareFlag={guardAction("maintainHardware", "cambiar estado de hardware", toggleHardwareFlag)} />
        <DecisionPanel selected={selected} signal={selectedSignal} settings={settings} />
        <GeometryEditor selected={selected} onUpdateGeometry={guardAction("editGeometry", "editar geometria avanzada", updateGeometry)} />
      </>
    );
  }

  function renderSectionContent() {
    if (activeSection === "Mapa del sistema") {
      return (
        <SectionPage title="Mapa del sistema" description="Mapa operativo, enlaces, cruces y corredor activo." tag={`${crossings.length} cruce(s)`}>
          {renderMapAndControl()}
          {renderCorridor()}
        </SectionPage>
      );
    }

    if (activeSection === "Cruces") {
      return (
        <SectionPage title="Cruces" description="Ficha completa del cruce seleccionado y sus paneles técnicos." tag={selected?.name || "Sin selección"}>
          {renderCrossingWorkspace()}
        </SectionPage>
      );
    }

    if (activeSection === "Corredores") {
      return (
        <SectionPage title="Corredores" description="Cruces seleccionados, orden, desfases y sincronización de onda verde." tag={`${corridorIds.length} seleccionado(s)`}>
          {renderCorridor()}
          <SyncComparisonPanel
            corridorIds={corridorIds}
            crossings={crossings}
            signals={signals}
            selectedId={selected?.id || ""}
            onSelect={setSelectedId}
            onToggleCorridor={guardAction("changePlans", "quitar cruce de sincronizacion", toggleCorridor)}
          />
        </SectionPage>
      );
    }

    if (activeSection === "Escenarios") {
      return (
        <SectionPage title="Escenarios" description="Planes especiales para horarios, eventos, averías y condiciones de tráfico.">
          <SectionPlaceholder
            title="Escenarios preparados"
            description="Esta pantalla queda separada para activar planes especiales sin mezclarla con la configuración del cruce."
            items={[
              { title: "Hora punta", text: "Ajustes de demanda y onda verde para máxima saturación." },
              { title: "Nocturno", text: "Ciclos reducidos y comportamiento conservador." },
              { title: "Avería / obras", text: "Modos locales y restricciones de seguridad." },
            ]}
          />
        </SectionPage>
      );
    }

    if (activeSection === "Informes") {
      return (
        <SectionPage title="Informes" description="Validación, incidencias y datos exportables del sistema.">
          <section className="two-col">
            <RulesPanel />
            <SystemCheckPanel issues={lastCheck.length ? lastCheck : liveIssues} onRunCheck={guardAction("viewSystem", "comprobar sistema", runCheck)} activeRole={activeRole} onPermissionDenied={handlePermissionDenied} />
          </section>
          {selected && selectedSignal && <DecisionPanel selected={selected} signal={selectedSignal} settings={settings} />}
        </SectionPage>
      );
    }

    if (activeSection === "Eventos") {
      return (
        <SectionPage title="Eventos" description="Registro vivo de acciones, avisos y cambios de configuración." tag={`${log.length} evento(s)`}>
          <EventsDashboardPanel log={log} issues={lastCheck.length ? lastCheck : liveIssues} activeRole={activeRole} />
          <LogPanel log={log} onClear={guardAction("manageUsers", "limpiar registro de eventos", () => setLog(["Registro limpiado."]))} activeRole={activeRole} onPermissionDenied={handlePermissionDenied} />
        </SectionPage>
      );
    }

    if (activeSection === "Dispositivos") {
      return (
        <SectionPage title="Dispositivos" description="Estado del mini PC, E/S, fuente, red y ópticas del cruce seleccionado.">
          {selected ? (
            <HardwareHealthPanel selected={selected} onToggleOpticFault={guardAction("maintainHardware", "cambiar estado de optica", toggleOpticFault)} onToggleHardwareFlag={guardAction("maintainHardware", "cambiar estado de hardware", toggleHardwareFlag)} />
          ) : (
            <EmptySelectionPanel addMode={addMode} onAddFirst={guardAction("editGeometry", "anadir primer cruce", () => addCrossing(CENTER[0], CENTER[1]))} onToggleAddMode={guardAction("editGeometry", "activar modo anadir cruce", () => setAddMode((value) => !value))} />
          )}
        </SectionPage>
      );
    }

    if (activeSection === "Cámaras") {
      return (
        <SectionPage title="Cámaras" description="Cámaras asociadas al cruce seleccionado y visión simulada.">
          {selected ? (
            <CameraPanel
              selected={selected}
              settings={settings}
              onToggleCamera={guardAction("maintainHardware", "activar o desactivar camara", toggleCamera)}
              onToggleCameraOk={guardAction("maintainHardware", "cambiar estado de camara", toggleCameraOk)}
              onAddCamera={guardAction("maintainHardware", "anadir camara", addCamera)}
              onRemoveCamera={guardAction("maintainHardware", "quitar camara", removeCamera)}
            />
          ) : (
            <EmptySelectionPanel addMode={addMode} onAddFirst={guardAction("editGeometry", "anadir primer cruce", () => addCrossing(CENTER[0], CENTER[1]))} onToggleAddMode={guardAction("editGeometry", "activar modo anadir cruce", () => setAddMode((value) => !value))} />
          )}
        </SectionPage>
      );
    }

    if (activeSection === "Configuración") {
      return (
        <SectionPage title="Configuración" description="Ajustes del proyecto, guardado local y acciones globales.">
          <ConfigurationOverviewPanel activeProject={activeProject} activeRole={activeRole} />
          <ProjectCityPanelR25
            projects={projects}
            activeProjectId={activeProjectId}
            activeRole={activeRole}
            onPermissionDenied={handlePermissionDenied}
            onSwitchProject={switchProject}
            onCreateProject={createProject}
            onRenameProject={renameActiveProject}
          />
          <ProjectStoragePanelR25
            storageStatus={storageStatus}
            activeRole={activeRole}
            onPermissionDenied={handlePermissionDenied}
            onSave={() => saveNow("Guardado manual realizado")}
            onCreatePoint={createRestorePoint}
            onRestore={restoreLastPoint}
            onClearSave={clearLocalSave}
          />
        </SectionPage>
      );
    }

    if (activeSection === "Usuarios") {
      return (
        <SectionPage title="Usuarios" description="Roles, permisos y acceso por PIN local simulado." tag={activeRole?.name || "Sin sesión"}>
          <UsersPanel activeRole={activeRole} activeUser={activeUser} activeSection={activeSection} onRequestLogin={openLogin} />
        </SectionPage>
      );
    }

    if (activeSection === "Sistema") {
      return (
        <SectionPage title="Sistema" description="Estado técnico, licencia, versión y comprobación general.">
          <SystemOverviewPanel activeProject={activeProject} activeRole={activeRole} storageStatus={storageStatus} liveIssues={liveIssues} />
          <SectionPlaceholder
            title="Hydra Traffic Lab"
            description={`Licencia: Hydra Company. Versión activa ${HYDRA_VERSION_LABEL}.`}
            items={[
              { title: "Versión", text: HYDRA_VERSION_LABEL },
              { title: "Servidor", text: liveIssues.length === 0 ? "Servicio activo" : "Servicio con avisos" },
              { title: "Persistencia", text: storageStatus },
            ]}
          />
          <section className="two-col">
            <RulesPanel />
            <SystemCheckPanel issues={lastCheck.length ? lastCheck : liveIssues} onRunCheck={guardAction("viewSystem", "comprobar sistema", runCheck)} activeRole={activeRole} onPermissionDenied={handlePermissionDenied} />
          </section>
          <LogPanel log={log} onClear={guardAction("manageUsers", "limpiar registro de eventos", () => setLog(["Registro limpiado."]))} activeRole={activeRole} onPermissionDenied={handlePermissionDenied} />
        </SectionPage>
      );
    }

    return null;
  }

  return (
    <main>
      <div className="hydra-shell">
        <LeftSidebar active={activeSection} systemOk={liveIssues.length === 0} onSelect={setActiveSection} />
        <div className="app hydra-main">
        <section className="control-header">
          <div>
            <h1>Centro de Control - <span>Hydra Traffic Lab</span></h1>
            <p>{activeProject?.name || "Proyecto local"} - Centro de control semaforico - Usuario: {activeRole?.name || "sin sesion"}</p>
          </div>
          <div className="control-header-status header-status-pro">
            <span className="status-pill ok">● Servicio activo</span>
            <span className="header-clock">◷ {new Date().toLocaleTimeString()}</span>
            <span className="header-date">▣ {new Date().toLocaleDateString()}</span>
            <button className="header-bell" title="Notificaciones" onClick={() => { setEventsOpen(true); setEventsMinimized(false); }}>
              🔔
              <span>{Math.min(9, liveIssues.length || 0)}</span>
            </button>
            <div className="header-user-wrap">
              <button className="header-user" title="Usuarios" onClick={() => setSessionMenuOpen((value) => !value)}>
                <span className="header-user-icon">◎</span>
                <strong>{activeRole?.name || "Sin sesión"}</strong>
                <small>⌄</small>
              </button>
              {sessionMenuOpen && (
                <SessionMenu
                  role={activeRole}
                  onOpenUsers={goToUsers}
                  onSwitchUser={() => openLogin(activeRole?.id || "admin")}
                  onLogout={logout}
                />
              )}
            </div>
          </div>
        </section>

        {activeSection === "Inicio" ? (
          <>
        <section className="control-dashboard-layout">
          <div className="control-map-column">
            <LeafletMapView
              crossings={crossings}
              signals={signals}
              selectedId={selected?.id || ""}
              corridorIds={corridorIds}
              addMode={addMode}
              linkMode={linkMode}
              linkStartId={linkStartId}
              manualLinks={manualLinks}
              settings={settings}
              onAdd={guardAction("editGeometry", "anadir cruce desde mapa", addCrossing)}
              onSelect={setSelectedId}
              onMove={guardAction("editGeometry", "mover cruce en mapa", moveCrossing)}
              onToggleCorridor={guardAction("changePlans", "cambiar corredor desde mapa", toggleCorridor)}
              onMarkerLinkClick={guardAction("changePlans", "crear enlace manual desde mapa", onMarkerLinkClick)}
            />
          </div>

          {selected ? (
            <RightControlPanel
              selected={selected}
              settings={settings}
              setSettings={setSettingsWithPermission}
              tick={tick}
              crossings={crossings}
              liveIssues={liveIssues}
              corridorIds={corridorIds}
              onSetRegulatorMode={guardAction("operateCrossings", "cambiar modo del regulador", setRegulatorMode)}
              onSetLocalMode={guardAction("operateCrossings", "cambiar modo local", setLocalMode)}
              onFaultMode={guardAction("operateCrossings", "activar averia local", activateFaultMode)}
              onSafeStep={guardAction("operateCrossings", "avanzar etapa segura", safeManualStep)}
              onClearActiveQueue={guardAction("operateCrossings", "priorizar cola activa", clearActiveQueue)}
              onAddCrossing={guardAction("editGeometry", "anadir cruce desde control", addCrossingFromPanel)}
              running={running}
              onToggleRunning={guardAction("operateCrossings", "iniciar o pausar simulacion", () => setRunning((value) => !value))}
              onToggleLinkMode={guardAction("changePlans", "activar unir cruces", () => { setLinkMode((value) => !value); setLinkStartId(null); })}
              linkMode={linkMode}
              onOptimize={guardAction("changePlans", "optimizar onda verde", optimizeOffsets)}
              onRunCheck={guardAction("viewSystem", "comprobar sistema", runCheck)}
              onDelete={guardAction("editGeometry", "eliminar cruce", deleteSelected)}
              onExport={guardAction("viewReports", "exportar JSON", exportJson)}
              onReset={guardAction("manageUsers", "crear proyecto nuevo", reset)}
              onSelectCrossing={setSelectedId}
              activeRole={activeRole}
              onPermissionDenied={handlePermissionDenied}
            />
          ) : (
            <EmptySelectionPanel addMode={addMode} onAddFirst={guardAction("editGeometry", "anadir primer cruce", () => addCrossing(CENTER[0], CENTER[1]))} onToggleAddMode={guardAction("editGeometry", "activar modo anadir cruce", () => setAddMode((value) => !value))} />
          )}
        </section>

        <CorridorPanel
          crossings={crossings}
          corridorIds={corridorIds}
          signals={signals}
          selectedId={selected?.id || ""}
          onSelect={setSelectedId}
          onToggleCorridor={guardAction("changePlans", "cambiar corredor", toggleCorridor)}
          onUseFirstN={guardAction("changePlans", "usar primeros cruces del corredor", useFirstNCorridor)}
          onOrderByMap={guardAction("changePlans", "ordenar corredor por mapa", orderCorridorByMap)}
          onOptimize={guardAction("changePlans", "optimizar onda verde", optimizeOffsets)}
        />

        <ProjectStoragePanelR25
          storageStatus={storageStatus}
          activeRole={activeRole}
          onPermissionDenied={handlePermissionDenied}
          onSave={() => saveNow("Guardado manual realizado")}
          onCreatePoint={createRestorePoint}
          onRestore={restoreLastPoint}
          onClearSave={clearLocalSave}
        />

        <ProjectCityPanelR25
          projects={projects}
          activeProjectId={activeProjectId}
          activeRole={activeRole}
          onPermissionDenied={handlePermissionDenied}
          onSwitchProject={switchProject}
          onCreateProject={createProject}
          onRenameProject={renameActiveProject}
        />

        {selected && selectedSignal ? (
          <>
            <CrossingDetails selected={selected} signal={selectedSignal} />

            <section className="two-col detector-control-row">
              <DetectorPanel selected={selected} settings={settings} />
              <ControlPanel
                selected={selected}
                settings={settings}
                setSettings={setSettingsWithPermission}
                corridorIds={corridorIds}
                manualLinks={manualLinks}
                linkMode={linkMode}
                linkStartId={linkStartId}
                onToggleManual={guardAction("operateCrossings", "cambiar manual/automatico del cruce", toggleManual)}
                onToggleCorridor={guardAction("changePlans", "cambiar cruce en corredor", toggleCorridor)}
                onUpdateSelected={guardAction("editGeometry", "editar datos del cruce", updateSelected)}
                onRenameCrossingId={guardAction("editGeometry", "renombrar ID del cruce", renameCrossingId)}
                onSetGeometry={guardAction("editGeometry", "cambiar geometria del cruce", setGeometry)}
                onSetLinkMode={guardAction("changePlans", "cambiar modo unir cruces", (value) => { setLinkMode(value); setLinkStartId(null); })}
                onClearLinkStart={() => setLinkStartId(null)}
                onRemoveAllLinks={guardAction("changePlans", "borrar enlaces manuales", () => { setManualLinks([]); addLog("Enlaces manuales borrados."); })}
              />
            </section>

            <section className="two-col traffic-camera-row">
              <TrafficDemandPanel
                selected={selected}
                onVehicle={guardAction("operateCrossings", "modificar cola simulada", manualVehicle)}
                onPedestrian={guardAction("operateCrossings", "registrar peticion peatonal", requestPedestrian)}
                onArrivalRate={guardAction("changePlans", "cambiar llegadas base", setArrivalRate)}
                onDemandPlan={guardAction("changePlans", "cambiar plan de demanda", setDemandPlan)}
                onDemandFactor={guardAction("changePlans", "cambiar factor de ajuste", setDemandFactor)}
              />
              <CameraPanel
                selected={selected}
                settings={settings}
                onToggleCamera={guardAction("maintainHardware", "activar o desactivar camara", toggleCamera)}
                onToggleCameraOk={guardAction("maintainHardware", "cambiar estado de camara", toggleCameraOk)}
                onAddCamera={guardAction("maintainHardware", "anadir camara", addCamera)}
                onRemoveCamera={guardAction("maintainHardware", "quitar camara", removeCamera)}
              />
            </section>

            <HardwareHealthPanel selected={selected} onToggleOpticFault={guardAction("maintainHardware", "cambiar estado de optica", toggleOpticFault)} onToggleHardwareFlag={guardAction("maintainHardware", "cambiar estado de hardware", toggleHardwareFlag)} />

            <DecisionPanel selected={selected} signal={selectedSignal} settings={settings} />

            <GeometryEditor selected={selected} onUpdateGeometry={guardAction("editGeometry", "editar geometria avanzada", updateGeometry)} />
          </>
        ) : (
          <EmptySelectionPanel addMode={addMode} onAddFirst={guardAction("editGeometry", "anadir primer cruce", () => addCrossing(CENTER[0], CENTER[1]))} onToggleAddMode={guardAction("editGeometry", "activar modo anadir cruce", () => setAddMode((value) => !value))} />
        )}

        <SyncComparisonPanel
          corridorIds={corridorIds}
          crossings={crossings}
          signals={signals}
          selectedId={selected?.id || ""}
          onSelect={setSelectedId}
          onToggleCorridor={guardAction("changePlans", "quitar cruce de sincronizacion", toggleCorridor)}
        />

        <section className="two-col">
          <RulesPanel />
          <SystemCheckPanel issues={lastCheck.length ? lastCheck : liveIssues} onRunCheck={guardAction("viewSystem", "comprobar sistema", runCheck)} activeRole={activeRole} onPermissionDenied={handlePermissionDenied} />
        </section>

        <LogPanel log={log} onClear={guardAction("manageUsers", "limpiar registro de eventos", () => setLog(["Registro limpiado."]))} activeRole={activeRole} onPermissionDenied={handlePermissionDenied} />
          </>
        ) : (
          renderSectionContent()
        )}
        </div>
      </div>

        <FloatingEventsWindow
          log={log}
          open={eventsOpen}
          minimized={eventsMinimized}
          onOpen={() => { setEventsOpen(true); setEventsMinimized(false); }}
          onMinimize={() => setEventsMinimized(true)}
          onMaximize={() => { setEventsOpen(true); setEventsMinimized(false); }}
          onClose={() => setEventsOpen(false)}
        />
        <LoginModal
          open={loginOpen}
          selectedRoleId={loginRoleId}
          pin={loginPin}
          error={loginError}
          onRoleChange={(roleId) => { setLoginRoleId(roleId); setLoginError(""); }}
          onPinChange={(value) => { setLoginPin(value); setLoginError(""); }}
          onSubmit={submitLogin}
          onClose={() => { setLoginOpen(false); setLoginError(""); }}
        />
    </main>
  );
}


const rootElement = document.getElementById("root");

if (!rootElement) {
  document.body.innerHTML = `
    <main style="min-height:100vh;background:#020617;color:#e2e8f0;font-family:system-ui,sans-serif;display:grid;place-items:center;padding:32px;">
      <div style="max-width:720px;border:1px solid #ef4444;border-radius:20px;padding:24px;background:#0f172a;">
        <h1>No existe el elemento #root</h1>
        <p>index.html no contiene el contenedor principal.</p>
      </div>
    </main>
  `;
} else {
  console.info(`Hydra Traffic Lab ${HYDRA_VERSION_LABEL} arrancando...`);
  createRoot(rootElement).render(
    <RuntimeErrorBoundary>
      <App />
    </RuntimeErrorBoundary>
  );
}
