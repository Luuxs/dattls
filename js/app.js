// URL directa para forzar la descarga del CSV plano de tu Google Sheets
var SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1iV1r8hBopIMYz1-U5CTF1TiEu3RFrSW7HxCAP25g_gM/export?format=csv&gid=0";

function limpiarNumero(texto) {
    if (!texto) return 0;
    var limpio = texto.replace(/S\/\.\s?|["'\s]/g, '').replace(/,/g, '');
    var numero = parseFloat(limpio);
    return isNaN(numero) ? 0 : numero;
}

function separarLineaCSV(linea) {
    var resultado = [];
    var enComillas = false;
    var campoActual = "";

    for (var i = 0; i < linea.length; i++) {
        var char = linea[i];
        if (char === '"') {
            enComillas = !enComillas;
        } else if (char === ',' && !enComillas) {
            resultado.push(campoActual);
            campoActual = "";
        } else {
            campoActual += char;
        }
    }
    resultado.push(campoActual);
    return resultado;
}

function cargarDatosDesdeSheets() {
    fetch(SHEET_CSV_URL)
        .then(function(respuesta) {
            if (!respuesta.ok) throw new Error("Error de red");
            return respuesta.text();
        })
        .then(function(textoCSV) {
            var lineasPlanas = textoCSV.split("\n");
            var datosProcesados = [];
            
            for (var i = 1; i < lineasPlanas.length; i++) {
                var linea = lineasPlanas[i].trim();
                if (!linea) continue;

                var fila = separarLineaCSV(linea);
                
                // Filtramos títulos o textos residuales a la derecha
                if (!fila || !fila[0] || fila[0].indexOf("TOP") !== -1 || fila[0].indexOf("DIA") !== -1) {
                    continue;
                }

                if (fila[0].indexOf("/") !== -1) {
                    var fecha = fila[0].trim();
                    var clAD = fila[1] ? limpiarNumero(fila[1]) : 0;
                    var mtAD = fila[2] ? limpiarNumero(fila[2]) : 0;
                    var clRW = fila[3] ? limpiarNumero(fila[3]) : 0;
                    var mtRW = fila[4] ? limpiarNumero(fila[4]) : 0;

                    if (clAD > 0 || mtAD > 0 || clRW > 0 || mtRW > 0) {
                        datosProcesados.push({
                            dia: fecha,
                            clientesAD: clAD,
                            montoAD: mtAD,
                            clientesRW: clRW,
                            montoRW: mtRW
                        });
                    }
                }
            }
            renderizarDashboard(datosProcesados);
        })
        .catch(function(error) {
            console.error("Error cargando base de datos en TV:", error);
        });
}

function renderizarDashboard(data) {
    var tbody = document.getElementById('tbody-datos');
    if (!tbody) return;
    tbody.innerHTML = ''; 

    var acumuladoAD = 0;
    var acumuladoRW = 0;

    // 1. Pintamos la tabla general izquierda
    data.forEach(function(row) {
        acumuladoAD += row.montoAD;
        acumuladoRW += row.montoRW;

        var tr = document.createElement('tr');
        tr.innerHTML = '<td><b>' + row.dia + '</b></td>' +
                       '<td>' + row.clientesAD.toLocaleString('es-PE') + '</td>' +
                       '<td>S/ ' + row.montoAD.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '</td>' +
                       '<td>' + row.clientesRW.toLocaleString('es-PE') + '</td>' +
                       '<td>S/ ' + row.montoRW.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '</td>';
        tbody.appendChild(tr);
    });

    // 2. Colocamos los Totales Acumulados principales arriba
    document.getElementById('total-general-ad').textContent = 'S/ ' + acumuladoAD.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('total-general-rw').textContent = 'S/ ' + acumuladoRW.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    // 3. === CUADRO DE METAS DINÁMICO "METAS MUNDIAL 2026" SEMÁFORO OSCURO ===
    var contenedorMetas = document.getElementById('contenedor-metas');
    if (contenedorMetas) {
        // DEFINE AQUÍ LAS METAS GLOBALES DEL MES
        var META_AD = 12600000; // Meta de 12.6 Millones
        var META_RW = 4200000;  // Meta de 4.2 Millones

        // Cálculo de porcentajes exactos
        var pctAD = Math.min(Math.round((acumuladoAD / META_AD) * 100), 100);
        var pctRW = Math.min(Math.round((acumuladoRW / META_RW) * 100), 100);

        // Sacamos el promedio general para determinar el color de todo el cuadro
        var progresoGeneral = Math.round((pctAD + pctRW) / 2);

        // Lógica del Semáforo: Menos de 50% Rojo | Menos de 90% Naranja | 90% o más Verde
        var claseSemaforoGlobal = "";
        if (progresoGeneral < 50) {
            claseSemaforoGlobal = "panel-meta-rojo";
        } else if (progresoGeneral < 90) {
            claseSemaforoGlobal = "panel-meta-naranja";
        } else {
            claseSemaforoGlobal = "panel-meta-verde";
        }

        // Inyectamos la estructura limpia estilo oscuro neón
        contenedorMetas.innerHTML = 
            '<div class="cuadro-meta-global ' + claseSemaforoGlobal + '">' +
                '<h3 class="titulo-meta-mundial">METAS MUNDIAL 2026</h3>' +
                
                '' +
                '<div class="fila-meta-dato">' +
                    '<span class="meta-sub">Apuestas Deportivas:</span>' +
                    '<span class="meta-valor-pct">' + pctAD + '%</span>' +
                '</div>' +
                '<div class="avance-monto">S/ ' + (acumuladoAD / 1000000).toFixed(2) + 'M de S/ ' + (META_AD / 1000000).toFixed(1) + 'M</div>' +
                
                '<hr class="divisor-meta">' +

                '' +
                '<div class="fila-meta-dato">' +
                    '<span class="meta-sub">Recarga Web:</span>' +
                    '<span class="meta-valor-pct">' + pctRW + '%</span>' +
                '</div>' +
                '<div class="avance-monto">S/ ' + (acumuladoRW / 1000000).toFixed(2) + 'M de S/ ' + (META_RW / 1000000).toFixed(1) + 'M</div>' +
            '</div>';
    }
    // 4. Calculamos las tablas dinámicas de los TOP 3 centrales
    calcularTop3(data, 'clientesAD', 'top-clientes-ad', false);
    calcularTop3(data, 'montoAD', 'top-monto-ad', true);
    calcularTop3(data, 'clientesRW', 'top-clientes-rw', false);
    calcularTop3(data, 'montoRW', 'top-monto-rw', true);
}

function calcularTop3(data, campo, idContenedor, esMoneda) {
    var filtrados = data.filter(function(item) { return item[campo] > 0; });
    var ordenados = filtrados.sort(function(a, b) { return b[campo] - a[campo]; }).slice(0, 3);
    
    var contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    var tbodyRanking = contenedor.querySelector('.ranking-body');
    if (!tbodyRanking) return;
    tbodyRanking.innerHTML = '';

    if (ordenados.length === 0) {
        tbodyRanking.innerHTML = '<tr><td colspan="3" style="color: #64748b; font-style: italic;">Esperando datos...</td></tr>';
        return;
    }

    ordenados.forEach(function(item, index) {
        var tr = document.createElement('tr');
        var valorFormateado = esMoneda 
            ? 'S/ ' + item[campo].toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : item[campo].toLocaleString('es-PE');

        tr.innerHTML = '<td><b>' + (index + 1) + '</b></td>' +
                       '<td>' + item.dia + '</td>' +
                       '<td><b>' + valorFormateado + '</b></td>';
        tbodyRanking.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    cargarDatosDesdeSheets();
    setInterval(cargarDatosDesdeSheets, 30000); 
});