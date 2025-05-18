// ========== VARIABLES Y CARGA DE DATOS ==========
let incidentes = [];
let dependencias = [];

async function cargarDatos() {
  try {
    await Promise.all([cargarIncidentes(), cargarDependencias()]);
    renderizarTablas();
    llenarFiltrosDashboard();
    renderizarDashboard();
  } catch (err) {
    console.error("Error al cargar CSVs:", err);
  }
}

async function cargarIncidentes() {
  const url = 'https://raw.githubusercontent.com/Juanchirobot/fraudes-riesgos/main/incidentes_tecnologicos.csv';
  const res = await fetch(url);
  const text = await res.text();
  const filas = text.trim().split('\n').slice(1);

  incidentes = filas.map((linea, i) => {
    const [fecha, sistema, tipo, severidad, descripcion, responsable, estado] = linea.split(',');
    return { id: i + 1, fecha, sistema, tipo, severidad, descripcion, responsable, estado };
  });
}

async function cargarDependencias() {
  const url = 'https://raw.githubusercontent.com/Juanchirobot/fraudes-riesgos/main/arbol_dependencias.csv';
  const res = await fetch(url);
  const text = await res.text();
  const filas = text.trim().split('\n').slice(1);

  dependencias = filas.map((linea, i) => {
    const [fecha, comp_af, comp_dep, impacto, descripcion] = linea.split(',');
    return { id: i + 1, fecha, comp_af, comp_dep, impacto, descripcion };
  });
}

// ========== NAVEGACIÓN Y SIDEBAR ==========
function expandirSidebar() {
  document.querySelector('.sidebar')?.classList.add('expandida');
}

function contraerSidebar() {
  document.querySelector('.sidebar')?.classList.remove('expandida');
  document.querySelectorAll('.submenu').forEach(s => s.classList.remove('show'));
}

function toggleSubmenu(id) {
  const submenu = document.getElementById(id);
  if (submenu) submenu.classList.toggle('show');
}

function mostrarVista(id) {
  document.querySelectorAll('.seccion').forEach(s => s.style.display = 'none');
  const target = document.getElementById(id);
  if (target) target.style.display = 'block';

  const buscadorIncidentes = document.getElementById("contenedor-busqueda");
  buscadorIncidentes.style.display = id === 'tabla-incidentes' ? 'flex' : 'none';
}

// ============================
// 🔍 Buscador para Dependencias
// ============================
function buscarDependencias() {
  const val = document.getElementById('input-busqueda-dep').value.toLowerCase();
  const filtrado = dependencias.filter(d =>
    d.comp_af.toLowerCase().includes(val) ||
    d.comp_dep.toLowerCase().includes(val) ||
    d.impacto.toLowerCase().includes(val)
  );

  const tbody = document.getElementById('tbody-dependencias');
  tbody.innerHTML = '';
  filtrado.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.fecha}</td>
      <td>${d.comp_af}</td>
      <td>${d.comp_dep}</td>
      <td>${d.impacto}</td>
      <td>${d.descripcion}</td>
      <td><button>✏️</button></td>
    `;
    tbody.appendChild(tr);
  });
}
// ========== RENDER DE TABLAS ==========
function renderizarTablas() {
  const tbodyInc = document.getElementById('tbody-incidentes');
  tbodyInc.innerHTML = '';
  incidentes.forEach(d => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${d.id}</td>
      <td>${d.fecha}</td>
      <td>${d.sistema}</td>
      <td>${d.tipo}</td>
      <td>${d.severidad}</td>
      <td>${d.descripcion}</td>
      <td>${d.responsable}</td>
      <td>${d.estado}</td>
      <td><button>✏️</button></td>
    `;
    tbodyInc.appendChild(fila);
  });

  const tbodyDep = document.getElementById('tbody-dependencias');
  tbodyDep.innerHTML = '';
  dependencias.forEach(d => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${d.fecha}</td>
      <td>${d.comp_af}</td>
      <td>${d.comp_dep}</td>
      <td>${d.impacto}</td>
      <td>${d.descripcion}</td>
      <td><button>✏️</button></td>
    `;
    tbodyDep.appendChild(fila);
  });
}

// ============================
// 📊 Dashboard con filtros
// ============================

let chart1, chart2, chart3;

function llenarFiltrosDashboard() {
  const fuente = tipoVistaDashboard === "incidentes" ? incidentes : dependencias;
  const fechas = fuente.map(d => d.fecha);

  const anios = [...new Set(fechas.map(f => f.slice(0, 4)))].sort();
  const meses = [...new Set(fechas.map(f => f.slice(5, 7)))].sort();

  const filtroAnio = document.getElementById("filtroAnio");
  const filtroMes = document.getElementById("filtroMes");
  filtroAnio.innerHTML = `<option value="">Año completo</option>`;
  filtroMes.innerHTML = `<option value="">Todos los meses</option>`;

  anios.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    filtroAnio.appendChild(opt);
  });

  meses.forEach(m => {
    const opt = document.createElement("option");
    const fechaTemp = new Date(`2023-${m}-01`);
    opt.value = m;
    opt.textContent = fechaTemp.toLocaleDateString("es-ES", { month: "long" });
    filtroMes.appendChild(opt);
  });
}

function filtrarDashboardCategoria() {
  tipoVistaDashboard = document.getElementById("filtroCategoria").value;
  llenarFiltrosDashboard();
  renderizarDashboard();
}

function filtrarDashboard() {
  renderizarDashboard();
}

function renderizarDashboard() {
  const fuente = tipoVistaDashboard === "incidentes" ? incidentes : dependencias;
  const anio = document.getElementById("filtroAnio").value;
  const mes = document.getElementById("filtroMes").value;

  let datos = [...fuente];
  if (anio) datos = datos.filter(d => d.fecha.startsWith(anio));
  if (mes) datos = datos.filter(d => d.fecha.slice(5, 7) === mes);

  document.getElementById("totales-dashboard").innerHTML = `<strong>Total ${tipoVistaDashboard === 'incidentes' ? 'Incidentes' : 'Dependencias'}:</strong> ${datos.length}`;

  const agrupadoMes = {};
  datos.forEach(d => {
    const clave = d.fecha.slice(0, 7);
    agrupadoMes[clave] = (agrupadoMes[clave] || 0) + 1;
  });

  const ctx1 = document.getElementById("graficoEvolucion");
  if (chart1) chart1.destroy();
  chart1 = new Chart(ctx1, {
    type: "line",
    data: {
      labels: Object.keys(agrupadoMes).sort(),
      datasets: [{
        label: "Cantidad",
        data: Object.values(agrupadoMes),
        borderColor: "#1e3a8a",
        tension: 0.3
      }]
    }
  });

  // Distribución secundaria
  const ctx2 = document.getElementById("graficoSistema");
  const ctx3 = document.getElementById("graficoSeveridad");
  if (chart2) chart2.destroy();
  if (chart3) chart3.destroy();

  if (tipoVistaDashboard === "incidentes") {
    const porSistema = {}, porSeveridad = {};
    datos.forEach(d => {
      porSistema[d.sistema] = (porSistema[d.sistema] || 0) + 1;
      porSeveridad[d.severidad] = (porSeveridad[d.severidad] || 0) + 1;
    });

    chart2 = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: Object.keys(porSistema),
        datasets: [{
          label: "Sistemas",
          data: Object.values(porSistema),
          backgroundColor: "#38bdf8"
        }]
      },
      options: { indexAxis: "y" }
    });

    chart3 = new Chart(ctx3, {
      type: "doughnut",
      data: {
        labels: Object.keys(porSeveridad),
        datasets: [{
          label: "Severidad",
          data: Object.values(porSeveridad),
          backgroundColor: ["#ef4444", "#facc15", "#22c55e"]
        }]
      }
    });
  } else {
    const porComponente = {};
    datos.forEach(d => {
      porComponente[d.comp_af] = (porComponente[d.comp_af] || 0) + 1;
    });

    chart2 = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: Object.keys(porComponente),
        datasets: [{
          label: "Componente Afectado",
          data: Object.values(porComponente),
          backgroundColor: "#60a5fa"
        }]
      },
      options: { indexAxis: "y" }
    });

    chart3 = new Chart(ctx3, {
      type: "pie",
      data: {
        labels: Object.keys(porComponente),
        datasets: [{
          data: Object.values(porComponente),
          backgroundColor: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]
        }]
      }
    });
  }
}

// ============================
// 🚀 Inicialización
// ============================
window.onload = () => {
  cargarDatos();
};
