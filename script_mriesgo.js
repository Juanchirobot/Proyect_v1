// --- VARIABLES GLOBALES ---
let datos = [];           // Evaluaciones
let indicadores = [];     // Indicadores
let editandoIndicador = null;

let chartEval1, chartEval2, chartEval3;

const urlCSVEvaluaciones = "https://raw.githubusercontent.com/Juanchirobot/fraudes-riesgos/main/evaluaciones_historico.csv";
const urlCSVIndicadores = "https://raw.githubusercontent.com/Juanchirobot/fraudes-riesgos/main/indicadores_operativos.csv";

let submoduloActivo = "evaluaciones";

// --- SIDEBAR BEHAVIOR ---
function expandSidebar() {
  document.querySelector(".sidebar").classList.add("hover");
  document.querySelector(".main-content").style.marginLeft = "240px";
}

function collapseSidebar() {
  document.querySelector(".sidebar").classList.remove("hover");
  document.querySelector(".main-content").style.marginLeft = "60px";
}
function ocultarTodo() {
  const secciones = [
    "busqueda-evaluaciones",
    "busqueda-indicadores",
    "contenedorEvaluaciones",
    "formEvaluaciones",
    "contenedorIndicadores",
    "formIndicadores",
    "dashboard"
  ];

  secciones.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  document.querySelectorAll(".submenu").forEach(s => s.classList.remove("show"));
}

function toggleSubmenu(id) {
  document.querySelectorAll(".submenu").forEach(s => {
    if (s.id !== id) s.classList.remove("show");
  });
  document.getElementById(id)?.classList.toggle("show");
}

function abrirSubmenuEvaluaciones() {
  submoduloActivo = "evaluaciones";
  ocultarTodo();
  document.getElementById("busqueda-evaluaciones").style.display = "flex";
  document.getElementById("contenedorEvaluaciones").style.display = "block";
  actualizarTabla();
}

function abrirSubmenuIndicadores() {
  submoduloActivo = "indicadores";
  ocultarTodo();
  document.getElementById("busqueda-indicadores").style.display = "flex";
  document.getElementById("contenedorIndicadores").style.display = "block";
  renderizarTablaIndicadores();
}

function abrirFormularioSubmodulo() {
  ocultarTodo();
  if (submoduloActivo === "evaluaciones") {
    document.getElementById("formEvaluaciones").style.display = "block";
  } else if (submoduloActivo === "indicadores") {
    document.getElementById("formIndicadores").style.display = "block";
    document.getElementById("indicadorForm").reset();
    editandoIndicador = null;
  }
}

function mostrarDashboard() {
  ocultarTodo();
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("filtroAnio").disabled = true;
  document.getElementById("filtroMes").disabled = true;
  renderizarGraficos(); // solo si hay categoría
}
function cargarCSV() {
  fetch(urlCSVEvaluaciones)
    .then(res => res.text())
    .then(data => {
      datos = [];
      const filas = data.trim().split("\n").slice(1);
      filas.forEach(linea => {
        const [id, fecha, area, tema, riesgo, recomendacion, archivo] = linea.split(",");
        datos.push({ id, fecha, area, tema, riesgo, recomendacion, archivo });
      });
      actualizarTabla();
    });
}

function actualizarTabla() {
  const tbody = document.querySelector("#tablaEvaluaciones tbody");
  tbody.innerHTML = "";
  datos.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.id}</td>
      <td>${d.fecha}</td>
      <td>${d.area}</td>
      <td>${d.tema}</td>
      <td>${d.riesgo}</td>
      <td>${d.recomendacion}</td>
      <td>${d.archivo}</td>
      <td><button class="edit-btn" onclick="editarEvaluacion('${d.id}')">✏️</button></td>`;
    tbody.appendChild(tr);
  });
}

let editandoEvaluacionID = null;

function editarEvaluacion(id) {
  const d = datos.find(e => e.id == id);
  if (!d) return;
  document.getElementById("fecha").value = d.fecha;
  document.getElementById("area").value = d.area;
  document.getElementById("tema").value = d.tema;
  document.getElementById("riesgo").value = d.riesgo;
  document.getElementById("recomendacion").value = d.recomendacion;
  document.getElementById("archivo").value = d.archivo;
  editandoEvaluacionID = id;
  abrirFormularioSubmodulo();
}

document.getElementById("evaluacionForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const nuevo = {
    id: editandoEvaluacionID || datos.length + 1,
    fecha: document.getElementById("fecha").value,
    area: document.getElementById("area").value,
    tema: document.getElementById("tema").value,
    riesgo: document.getElementById("riesgo").value,
    recomendacion: document.getElementById("recomendacion").value,
    archivo: document.getElementById("archivo").value
  };

  if (editandoEvaluacionID) {
    const idx = datos.findIndex(d => d.id == editandoEvaluacionID);
    datos[idx] = nuevo;
  } else {
    datos.push(nuevo);
  }

  editandoEvaluacionID = null;
  actualizarTabla();
  abrirSubmenuEvaluaciones();
});


function ejecutarBusqueda() {
  const val = document.getElementById("busquedaEvaluaciones").value.toLowerCase();
  const filtrados = datos.filter(d =>
    d.area.toLowerCase().includes(val) ||
    d.tema.toLowerCase().includes(val) ||
    d.riesgo.toLowerCase().includes(val)
  );
  const tbody = document.querySelector("#tablaEvaluaciones tbody");
  tbody.innerHTML = "";
  filtrados.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.id}</td>
      <td>${d.fecha}</td>
      <td>${d.area}</td>
      <td>${d.tema}</td>
      <td>${d.riesgo}</td>
      <td>${d.recomendacion}</td>
      <td>${d.archivo}</td>
      <td><button class="edit-btn" onclick="editarEvaluacion('${d.id}')">✏️</button></td>`;
    tbody.appendChild(tr);
  });
}

function descargarCSVEvaluaciones() {
  let csv = "ID,Fecha,Área Evaluada,Tema,Riesgo,Recomendación,Archivo\n";
  datos.forEach(d => {
    csv += `${d.id},${d.fecha},${d.area},${d.tema},${d.riesgo},${d.recomendacion},${d.archivo}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "evaluaciones_actualizadas.csv";
  link.click();
}
async function cargarCSVIndicadores() {
  const res = await fetch(urlCSVIndicadores);
  const data = await res.text();
  const filas = data.trim().split("\n").slice(1);
  indicadores = filas.map(fila => {
    const [ID, Sector, IndicadorPorcentaje, Fecha, Responsable, Observaciones] = fila.split(",");
    return { ID, Sector, IndicadorPorcentaje, Fecha, Responsable, Observaciones };
  });
  renderizarTablaIndicadores();
}

function renderizarTablaIndicadores() {
  const tabla = document.getElementById("tablaIndicadores");
  tabla.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Sector</th>
        <th>%</th>
        <th>Fecha</th>
        <th>Responsable</th>
        <th>Observaciones</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      ${indicadores.map((i, index) => `
        <tr>
          <td>${i.ID}</td>
          <td>${i.Sector}</td>
          <td>${i.IndicadorPorcentaje}</td>
          <td>${i.Fecha}</td>
          <td>${i.Responsable}</td>
          <td>${i.Observaciones}</td>
          <td><button class="edit-btn" onclick="editarIndicador(${index})">✏️</button></td>
        </tr>
      `).join("")}
    </tbody>
  `;
}

function guardarIndicador() {
  const nuevo = {
    ID: editandoIndicador !== null ? indicadores[editandoIndicador].ID : (indicadores.length + 1).toString(),
    Sector: document.getElementById("sector").value,
    IndicadorPorcentaje: document.getElementById("indicadorPorcentaje").value,
    Fecha: document.getElementById("fecha").value,
    Responsable: document.getElementById("responsable").value,
    Observaciones: document.getElementById("observaciones").value
  };

  if (editandoIndicador !== null) {
    indicadores[editandoIndicador] = nuevo;
  } else {
    indicadores.push(nuevo);
  }

  editandoIndicador = null;
  renderizarTablaIndicadores();
  abrirSubmenuIndicadores();
}

function buscarIndicadores() {
  const texto = document.getElementById("busquedaIndicadores").value.toLowerCase();
  const filtrados = indicadores.filter(i =>
    i.Sector.toLowerCase().includes(texto) ||
    i.Responsable.toLowerCase().includes(texto)
  );
  renderizarTablaIndicadoresFiltrada(filtrados);
}

function renderizarTablaIndicadoresFiltrada(lista) {
  const tabla = document.getElementById("tablaIndicadores");
  tabla.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Sector</th>
        <th>%</th>
        <th>Fecha</th>
        <th>Responsable</th>
        <th>Observaciones</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      ${lista.map((i, index) => `
        <tr>
          <td>${i.ID}</td>
          <td>${i.Sector}</td>
          <td>${i.IndicadorPorcentaje}</td>
          <td>${i.Fecha}</td>
          <td>${i.Responsable}</td>
          <td>${i.Observaciones}</td>
          <td><button class="edit-btn" onclick="editarIndicador(${index})">✏️</button></td>
        </tr>
      `).join("")}
    </tbody>
  `;
}

function descargarCSVIndicadores() {
  let csv = "ID,Sector,IndicadorPorcentaje,Fecha,Responsable,Observaciones\n";
  csv += indicadores.map(i =>
    `${i.ID},${i.Sector},${i.IndicadorPorcentaje},${i.Fecha},${i.Responsable},${i.Observaciones}`
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "indicadores_actualizados.csv";
  link.click();
}
function filtrarPorCategoria() {
  const categoria = document.getElementById("filtroCategoria").value;
  const selectAnio = document.getElementById("filtroAnio");
  const selectMes = document.getElementById("filtroMes");

  if (!categoria) {
    selectAnio.disabled = true;
    selectMes.disabled = true;
    limpiarGraficos();
    return;
  }

  const fechas = [];

  if (categoria === "evaluaciones") {
    fechas.push(...datos.map(d => d.fecha));
  }

  if (categoria === "indicadores") {
    fechas.push(...indicadores.map(i => i.Fecha));
  }

  const anios = [...new Set(fechas.map(f => f.split("-")[0]))].sort();
  const meses = [...new Set(fechas.map(f => f.split("-")[1]))].sort();

  selectAnio.innerHTML = '<option value="">Año</option>';
  anios.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    selectAnio.appendChild(opt);
  });

  selectMes.innerHTML = '<option value="">Mes</option>';
  meses.forEach(m => {
    const opt = document.createElement("option");
    const nombreMes = new Date(`2023-${m}-01`).toLocaleDateString("es-ES", { month: "long" });
    opt.value = m;
    opt.textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
    selectMes.appendChild(opt);
  });

  selectAnio.disabled = false;
  selectMes.disabled = false;

  renderizarGraficos();
}

function filtrarPorAnio() {
  renderizarGraficos();
}

function filtrarPorMes() {
  renderizarGraficos();
}

function limpiarGraficos() {
  [chartEval1, chartEval2, chartEval3].forEach(chart => chart?.destroy());
}

function renderizarGraficos() {
  const anio = document.getElementById("filtroAnio").value;
  const mes = document.getElementById("filtroMes").value;
  const categoria = document.getElementById("filtroCategoria").value;

  if (!categoria) {
    limpiarGraficos();
    return;
  }

  let filtrados = [];

  if (categoria === "evaluaciones") {
    filtrados = [...datos];
  }

  if (categoria === "indicadores") {
    filtrados = indicadores.map(i => ({
      fecha: i.Fecha,
      riesgo: "Indicador",
      area: i.Sector
    }));
  }

  if (anio) filtrados = filtrados.filter(d => d.fecha?.startsWith(anio));
  if (mes) filtrados = filtrados.filter(d => d.fecha?.split("-")[1] === mes);

  // Evolución mensual
  const agrupado = {};
  filtrados.forEach(d => {
    const key = d.fecha.slice(0, 7);
    agrupado[key] = (agrupado[key] || 0) + 1;
  });

  const labels = Object.keys(agrupado).sort();
  const valores = labels.map(k => agrupado[k]);

  const ctx1 = document.getElementById("graficoEvolucionEvaluaciones");
  if (chartEval1) chartEval1.destroy();
  chartEval1 = new Chart(ctx1, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Casos",
        data: valores,
        borderColor: "#3b82f6",
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });

  // Riesgos
  const riesgos = {};
  filtrados.forEach(d => {
    if (d.riesgo) {
      riesgos[d.riesgo] = (riesgos[d.riesgo] || 0) + 1;
    }
  });

  const ctx2 = document.getElementById("graficoRiesgos");
  if (chartEval2) chartEval2.destroy();
  chartEval2 = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: Object.keys(riesgos),
      datasets: [{
        label: "Tipos de Riesgo",
        data: Object.values(riesgos),
        backgroundColor: "#1e40af"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: { x: { beginAtZero: true } }
    }
  });

  // Áreas
  const areas = {};
  filtrados.forEach(d => {
    if (d.area) {
      areas[d.area] = (areas[d.area] || 0) + 1;
    }
  });

  const ctx3 = document.getElementById("graficoAreas");
  if (chartEval3) chartEval3.destroy();
  chartEval3 = new Chart(ctx3, {
    type: "bar",
    data: {
      labels: Object.keys(areas),
      datasets: [{
        label: "Áreas",
        data: Object.values(areas),
        backgroundColor: "#60a5fa"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });
}
window.onload = () => {
  cargarCSV();             // Evaluaciones
  cargarCSVIndicadores();  // Indicadores
  abrirSubmenuEvaluaciones(); // Vista inicial
};
