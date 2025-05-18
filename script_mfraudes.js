let datos = [];
let transacciones = [];
let chartInstance1, chartInstance2, chartInstance3, chartInstance4;
function expandSidebar() {
  document.querySelector('.sidebar').classList.add('expanded');
}
function collapseSidebar() {
  document.querySelector('.sidebar').classList.remove('expanded');
  document.getElementById('submenu-casos')?.classList.remove('show');
}
function toggleSubmenu(id) {
  document.getElementById(id)?.classList.toggle('show');
}
function abrirModalBloqueo() {
  document.getElementById("modalBloqueoCuenta").style.display = "block";
  document.getElementById("overlay").style.display = "block";
}
function cerrarModalBloqueo() {
  document.getElementById("modalBloqueoCuenta").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}
function cerrarModales() {
  cerrarModalBloqueo();
}
function ocultarTodo() {
  ["dashboard", "formulario-section", "tablaCasos", "busqueda-container"]
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
}
function mostrarTabla() {
  ocultarTodo();
  document.getElementById("busqueda-container").style.display = "flex";
  document.getElementById("tablaCasos").style.display = "block";
  actualizarTabla();console.log("actualizando tabla");
}
function mostrarFormulario() {
  ocultarTodo();
  document.getElementById("formulario-section").style.display = "block";
  document.getElementById("formulario").reset();
  document.querySelector("#tablaTransacciones tbody").innerHTML = "";
}
function mostrarDashboard() {
  ocultarTodo();
  document.getElementById("dashboard").style.display = "block";
  renderizarGraficosDashboard();
}


function cargarCSVDesdeGitHub() {
  fetch("https://raw.githubusercontent.com/Juanchirobot/formulario-cargas/main/historico_carga_liviano.csv")
    .then(r => r.text())
    .then(text => {
      datos = [];
      const rows = text.trim().split("\n").slice(1);
      rows.forEach(row => {
        const c = row.split(",");
        if (c.length >= 12) {
          datos.push({
            id: parseInt(c[0]),
            usuario: c[1],
            cuil: c[2],
            fecha: c[3],
            caso: c[4],
            descripcion: c[5],
            estado: c[6],
            prioridad: c[7],
            tipo_riesgo: c[8],
            canal_deteccion: c[9],
            monto_sospechoso: parseFloat(c[10]),
            observaciones: c[11]
          });
        }
      });
      actualizarTabla();
      cargarFiltros();
      renderizarGraficosDashboard();
    });

  fetch("https://raw.githubusercontent.com/Juanchirobot/formulario-cargas/main/transacciones_caso_liviano.csv")
    .then(r => r.text())
    .then(text => {
      transacciones = [];
      const rows = text.trim().split("\n").slice(1);
      rows.forEach(row => {
        const t = row.split(",");
        if (t.length >= 7) {
          transacciones.push({
            caso: t[0],
            cuil: t[1],
            fecha: t[2],
            cbu_origen: t[3],
            cbu_destino: t[4],
            monto: parseFloat(t[5]),
            moneda: t[6]
          });
        }
      });
    });
}


document.getElementById("formulario").addEventListener("submit", function (e) {
  e.preventDefault();

  const caso = document.getElementById("caso").value.trim();
  const cuil = document.querySelector("#tablaTransacciones tbody tr input")?.value || "";
  if (!caso || !cuil) {
    alert("El campo CASO y al menos una transacción con CUIL son obligatorios.");
    return;
  }

  const existe = datos.find(d => d.caso === caso);
  if (!existe) {
    const nuevoCaso = {
      id: datos.length + 1,
      usuario: document.getElementById("usuario").value,
      cuil,
      fecha: document.getElementById("fecha").value,
      caso,
      descripcion: document.getElementById("descripcion").value,
      estado: document.getElementById("estado").value,
      prioridad: document.getElementById("prioridad").value,
      tipo_riesgo: document.getElementById("tipo_riesgo").value,
      canal_deteccion: document.getElementById("canal_deteccion").value,
      monto_sospechoso: 0,
      observaciones: document.getElementById("observaciones").value
    };
    datos.push(nuevoCaso);
  }

  // Eliminar transacciones anteriores del mismo caso
  transacciones = transacciones.filter(t => t.caso !== caso);

  // Agregar nuevas transacciones
  let montoTotal = 0;
  document.querySelectorAll("#tablaTransacciones tbody tr").forEach(row => {
    const cells = row.querySelectorAll("input, select");
    const t = {
      caso,
      cuil: cells[0].value,
      fecha: cells[1].value,
      cbu_origen: cells[2].value,
      cbu_destino: cells[3].value,
      monto: parseFloat(cells[4].value),
      moneda: cells[5].value
    };
    transacciones.push(t);
    montoTotal += t.moneda === "USD" ? t.monto * 1000 : t.monto;
  });

  // Actualizar monto en datos[]
  const casoActualizado = datos.find(d => d.caso === caso);
  if (casoActualizado) casoActualizado.monto_sospechoso = montoTotal;

  actualizarTabla();
  mostrarTabla();
});


function cargarCasoEnFormulario(casoID) {
  const caso = datos.find(d => d.caso === casoID);
  if (!caso) return;
  mostrarFormulario();

  document.getElementById("usuario").value = caso.usuario;
  document.getElementById("fecha").value = caso.fecha;
  document.getElementById("caso").value = caso.caso;
  document.getElementById("descripcion").value = caso.descripcion;
  document.getElementById("estado").value = caso.estado;
  document.getElementById("prioridad").value = caso.prioridad;
  document.getElementById("tipo_riesgo").value = caso.tipo_riesgo;
  document.getElementById("canal_deteccion").value = caso.canal_deteccion;
  document.getElementById("observaciones").value = caso.observaciones;

  const tbody = document.querySelector("#tablaTransacciones tbody");
  tbody.innerHTML = "";
  transacciones.filter(t => t.caso === casoID).forEach(t => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td><input type="text" value="${t.cuil}" required></td>
      <td><input type="date" value="${t.fecha}" required></td>
      <td><input type="text" value="${t.cbu_origen}" required></td>
      <td><input type="text" value="${t.cbu_destino}" required></td>
      <td><input type="number" value="${t.monto}" required></td>
      <td>
        <select required>
          <option value="ARS" ${t.moneda === "ARS" ? "selected" : ""}>ARS</option>
          <option value="USD" ${t.moneda === "USD" ? "selected" : ""}>USD</option>
        </select>
      </td>
      <td><button type="button" onclick="this.closest('tr').remove()">❌</button></td>`;
    tbody.appendChild(fila);
  });
}


function agregarTransaccion() {
  const fila = document.createElement("tr");
  fila.innerHTML = `
    <td><input type="text" required></td>
    <td><input type="date" required></td>
    <td><input type="text" required></td>
    <td><input type="text" required></td>
    <td><input type="number" required></td>
    <td>
      <select required>
        <option value="ARS">ARS</option>
        <option value="USD">USD</option>
      </select>
    </td>
    <td><button type="button" onclick="this.closest('tr').remove()">❌</button></td>`;
  document.querySelector("#tablaTransacciones tbody").appendChild(fila);
}
function actualizarTabla() {
  const tbody = document.querySelector("#tabla tbody");
  tbody.innerHTML = "";
  datos.forEach(d => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${d.id}</td>
      <td>${d.usuario}</td>
      <td>${d.cuil}</td>
      <td>${d.fecha}</td>
      <td>${d.caso}</td>
      <td>${d.descripcion}</td>
      <td>${d.estado}</td>
      <td>${d.prioridad}</td>
      <td>${d.tipo_riesgo}</td>
      <td>${d.canal_deteccion}</td>
      <td>${d.monto_sospechoso}</td>
      <td>${d.observaciones}</td>
      <td><button class="btn secundario" onclick="cargarCasoEnFormulario('${d.caso}')">✏️</button></td>`;
    tbody.appendChild(fila);
  });
}
function descargarCSV() {
  let csv = "ID,Usuario,CUIL Cliente,Fecha,Caso,Descripción,Estado,Prioridad,Tipo de Riesgo,Canal de Detección,Monto Sospechoso,Observaciones\n";
  datos.forEach(d => {
    csv += `${d.id},${d.usuario},${d.cuil},${d.fecha},${d.caso},${d.descripcion},${d.estado},${d.prioridad},${d.tipo_riesgo},${d.canal_deteccion},${d.monto_sospechoso},${d.observaciones}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "casos_actualizados.csv";
  link.click();
}

function descargarCSVTransacciones() {
  let csv = "Caso,CUIL Cliente,Fecha,CBU Origen,CBU Destino,Monto,Moneda\n";
  transacciones.forEach(t => {
    csv += `${t.caso},${t.cuil},${t.fecha},${t.cbu_origen},${t.cbu_destino},${t.monto},${t.moneda}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "transacciones_actualizadas.csv";
  link.click();
}
function cargarFiltros() {
  const filtroAnio = document.getElementById("filtroAnio");
  const filtroMes = document.getElementById("filtroMes");

  filtroAnio.innerHTML = '<option value="">Año completo</option>';
  filtroMes.innerHTML = '<option value="">Todos los meses</option>';

  const fechas = datos.map(d => d.fecha);
  const anios = [...new Set(fechas.map(f => f.split("-")[0]))].sort();
  const meses = [...new Set(fechas.map(f => f.split("-")[1]))].sort();

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
function filtrarPorAnio() {
  renderizarGraficosDashboard();
}
function filtrarPorMes() {
  renderizarGraficosDashboard();
}
function renderizarGraficosDashboard() {
  const anio = document.getElementById("filtroAnio").value;
  const mes = document.getElementById("filtroMes").value;

  let filtrados = datos;
  if (anio) filtrados = filtrados.filter(d => d.fecha.startsWith(anio));
  if (mes) filtrados = filtrados.filter(d => d.fecha.split("-")[1] === mes);

  const totalCasos = filtrados.length;
  const totalMontos = filtrados.reduce((s, d) => s + d.monto_sospechoso, 0);

  document.getElementById("totalCasos").textContent = totalCasos;
  document.getElementById("totalMontos").textContent = (totalMontos / 1_000_000).toFixed(2) + "M";

// === GRÁFICO REAL: Evolutivo mensual ===
function formatearMesLabel(yyyy_mm) {
  const [y, m] = yyyy_mm.split("-");
  return new Date(`${y}-${m}-01`).toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
}

const agrupados = {};
datos.forEach(d => {
  const key = d.fecha.slice(0, 7); // yyyy-mm
  if (!agrupados[key]) agrupados[key] = { cantidad: 0, monto: 0 };
  agrupados[key].cantidad++;
  agrupados[key].monto += d.monto_sospechoso;
});

// Ordenar por fecha
const clavesOrdenadas = Object.keys(agrupados).sort().slice(-6); // últimos 6 meses
const labels = clavesOrdenadas.map(k => formatearMesLabel(k));
const dataCasos = clavesOrdenadas.map(k => agrupados[k].cantidad);
const dataMontos = clavesOrdenadas.map(k => (agrupados[k].monto / 1_000_000).toFixed(2));

const ctx = document.getElementById("graficoEvolutivo");
if (chartInstance1) chartInstance1.destroy();
chartInstance1 = new Chart(ctx, {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "Casos",
        data: dataCasos,
        borderColor: "#06b6d4",
        backgroundColor: "transparent",
        tension: 0.3,
        yAxisID: "y1"
      },
      {
        label: "Monto (M ARS)",
        data: dataMontos,
        borderColor: "#0f766e",
        backgroundColor: "transparent",
        tension: 0.3,
        yAxisID: "y2"
      }
    ]
  },
  options: {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false
    },
    stacked: false,
    plugins: {
      legend: { position: 'top' }
    },
    scales: {
      y1: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: "Cantidad de Casos" },
        ticks: { precision: 0 }
      },
      y2: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: "Monto Total (en millones ARS)" },
        grid: { drawOnChartArea: false }
      }
    }
  }
});
// === GRÁFICO CANAL DE DETECCIÓN — CANTIDAD ===
const ctx2 = document.getElementById("graficoCanalCantidad");
if (chartInstance2) chartInstance2.destroy();

const agrupadoCanal = {};
filtrados.forEach(d => {
  if (!agrupadoCanal[d.canal_deteccion]) agrupadoCanal[d.canal_deteccion] = 0;
  agrupadoCanal[d.canal_deteccion]++;
});

const canales = Object.keys(agrupadoCanal);
const cantidades = canales.map(k => agrupadoCanal[k]);

chartInstance2 = new Chart(ctx2, {
  type: "bar",
  data: {
    labels: canales,
    datasets: [{
      label: "Cantidad de Casos",
      data: cantidades,
      backgroundColor: "#06b6d4"
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: { display: true, text: "Casos" }
      },
      y: {
        title: { display: true, text: "Canal de Detección" }
      }
    }
  }
});
// === GRÁFICO CANAL DE DETECCIÓN — MONTOS ===
const ctx3 = document.getElementById("graficoCanalMonto");
if (chartInstance3) chartInstance3.destroy();

const montoPorCanal = {};
filtrados.forEach(d => {
  if (!montoPorCanal[d.canal_deteccion]) montoPorCanal[d.canal_deteccion] = 0;
  montoPorCanal[d.canal_deteccion] += d.monto_sospechoso;
});

const canalesMonto = Object.keys(montoPorCanal);
const montos = canalesMonto.map(k => (montoPorCanal[k] / 1_000_000).toFixed(2));

chartInstance3 = new Chart(ctx3, {
  type: "bar",
  data: {
    labels: canalesMonto,
    datasets: [{
      label: "Monto Total (M ARS)",
      data: montos,
      backgroundColor: "#0f766e"
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: { display: true, text: "Monto Total (en millones ARS)" }
      },
      y: {
        title: { display: true, text: "Canal de Detección" }
      }
    }
  }
});
// === GRÁFICO DISTRIBUCIÓN % POR TIPO DE RIESGO ===
const ctx4 = document.getElementById("graficoPorcentajeTipoRiesgo");
if (chartInstance4) chartInstance4.destroy();

// Agrupar por mes y tipo_riesgo
const agrupadoRiesgo = {};
filtrados.forEach(d => {
  const mes = d.fecha.slice(0, 7); // yyyy-mm
  if (!agrupadoRiesgo[mes]) agrupadoRiesgo[mes] = {};
  if (!agrupadoRiesgo[mes][d.tipo_riesgo]) agrupadoRiesgo[mes][d.tipo_riesgo] = 0;
  agrupadoRiesgo[mes][d.tipo_riesgo]++;
});

const mesesOrdenados = Object.keys(agrupadoRiesgo).sort().slice(-6);
const tipos = [...new Set(filtrados.map(d => d.tipo_riesgo))];
const datasets = tipos.map(tipo => ({
  label: tipo,
  data: mesesOrdenados.map(mes => {
    const totalMes = Object.values(agrupadoRiesgo[mes] || {}).reduce((a, b) => a + b, 0);
    const valor = agrupadoRiesgo[mes][tipo] || 0;
    return totalMes > 0 ? ((valor / totalMes) * 100).toFixed(2) : 0;
  }),
  backgroundColor: tipo === "Alto" ? "#ef4444" :
                   tipo === "Medio" ? "#facc15" :
                   tipo === "Bajo" ? "#22c55e" : "#60a5fa"
}));

chartInstance4 = new Chart(ctx4, {
  type: "bar",
  data: {
    labels: mesesOrdenados.map(k => formatearMesLabel(k)),
    datasets
  },
  options: {
    responsive: true,
    plugins: {
      tooltip: { mode: 'index', intersect: false },
      legend: { position: "bottom" }
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: "Mes" }
      },
      y: {
        stacked: true,
        min: 0,
        max: 100,
        title: { display: true, text: "% de Casos" },
        ticks: {
          callback: function (value) {
            return value + "%";
          }
        }
      }
    }
  }
});

}
window.onload = cargarCSVDesdeGitHub;