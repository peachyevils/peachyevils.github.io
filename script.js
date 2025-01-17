// Contadores para generar IDs
let materialCount = 0;
let movimientoCount = 0;


// Objeto para almacenar materiales con su ID, nombre, unidad y stock
const materiales = {};
const movimientos = {}; // Agregar objeto para almacenar los movimientos
document.getElementById("btnExportar").addEventListener("click", function () {
    // Crear un libro de trabajo (workbook)
    var wb = XLSX.utils.book_new();

    function tablaToSheet(tablaId, hojaNombre) {
        var tabla = document.getElementById(tablaId);
        var filas = Array.from(tabla.querySelectorAll('tr'));

        // Crear una nueva tabla sin la columna de "Acciones" en la tabla de movimientos
        var nuevaTabla = [];
        
        // Procesar la fila de encabezado
        var encabezado = Array.from(filas[0].querySelectorAll('th'));
        
        // Si es la tabla de Movimientos, eliminar la última columna (Acciones)
        if (tablaId === "tablaMovimientos") {
            encabezado.pop(); // Eliminar la última columna de encabezado
        }
        nuevaTabla.push(encabezado.map(cell => cell.innerText)); // Agregar la fila de encabezado
    
        // Procesar las filas de datos
        filas.slice(1).forEach(function (fila) {
            var celdas = Array.from(fila.querySelectorAll('td'));
            
            // Si es la tabla de Movimientos, eliminar la última celda (Acciones)
            if (tablaId === "tablaMovimientos") {
                celdas.pop(); // Eliminar la última celda de la fila
            }
            
            nuevaTabla.push(celdas.map(cell => cell.innerText)); // Agregar los datos de la fila
        });
    
        // Convertir la nueva tabla en una hoja de Excel
        var ws = XLSX.utils.aoa_to_sheet(nuevaTabla);
        XLSX.utils.book_append_sheet(wb, ws, hojaNombre);
    }

    // Convertir las tablas a hojas
    tablaToSheet("tablaMateriales", "Materiales");
    tablaToSheet("tablaMovimientos", "Movimientos");

    // Generar el archivo Excel y descargarlo
    XLSX.writeFile(wb, "Kardex_de_Materiales.xlsx");
});





document.getElementById('btnCargar').addEventListener('click', () => {
    const archivoInput = document.getElementById('archivoExcel');
    const archivo = archivoInput.files[0];

    if (!archivo) {
        alert('Por favor, seleccione un archivo Excel.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Verificar si las hojas existen
        const hojaMateriales = workbook.Sheets[workbook.SheetNames[0]];
        const hojaMovimientos = workbook.Sheets[workbook.SheetNames[1]];

        if (!hojaMateriales || !hojaMovimientos) {
            alert('El archivo debe contener al menos dos hojas (Materiales y Movimientos).');
            return;
        }

        // Convertir las hojas a JSON
        const datosMateriales = XLSX.utils.sheet_to_json(hojaMateriales, { header: 1 });
        const datosMovimientos = XLSX.utils.sheet_to_json(hojaMovimientos, { header: 1 });

        // Cargar datos de materiales
        const tablaMateriales = document.getElementById('tablaMateriales').querySelector('tbody');
        tablaMateriales.innerHTML = ''; // Limpiar tabla antes de cargar los nuevos datos

        datosMateriales.slice(1).forEach((fila) => {
            const [id, nombre, unidad, stock] = fila;

            // Verificar que la fila no esté vacía
            if (id && nombre && unidad && stock !== undefined) {
                if (!materiales[id]) {  // Evitar duplicados
                    materiales[id] = { nombre, unidad, stock: parseInt(stock, 10) };
                    agregarFilaMateriales(id, nombre, unidad, stock);
                    materialCount++;  // Asegurar que el contador siga
                }
            }
        });

        // Cargar datos de movimientos
        const tablaMovimientos = document.getElementById('tablaMovimientos').querySelector('tbody');
        tablaMovimientos.innerHTML = ''; // Limpiar tabla antes de cargar los nuevos datos

        datosMovimientos.slice(1).forEach((fila) => {
            const [id, tipo, fecha, cantidad, materialId] = fila;

            // Verificar que la fila no esté vacía
            if (id && tipo && fecha && cantidad !== undefined && materialId) {
                if (!movimientos[id]) {  // Evitar duplicados
                    movimientos[id] = { tipo, fecha, cantidad, materialId };
                    agregarFilaMovimientos(id, tipo, fecha, cantidad, materialId);
                    movimientoCount++;  // Asegurar que el contador siga
                }
            }
        });
    };

    reader.readAsArrayBuffer(archivo);
});

// Agregar un material
document.getElementById('btnAgregarMaterial').addEventListener('click', () => {
    const nombre = document.getElementById('materialNombre').value.trim();
    const unidad = document.getElementById('materialUnidad').value.trim();
    const stock = parseInt(document.getElementById('materialStock').value.trim(), 10);

    if (nombre && unidad && !isNaN(stock)) {
        materialCount++;
        const id = `P${materialCount.toString().padStart(4, '0')}`;
        if (!materiales[id]) {  // Evitar duplicados
            materiales[id] = { nombre, unidad, stock };
            agregarFilaMateriales(id, nombre, unidad, stock);
            document.getElementById('formMateriales').reset();
        }
    } else {
        alert('Por favor, complete todos los campos correctamente.');
    }
});

// Función para agregar fila a la tabla de materiales
function agregarFilaMateriales(id, nombre, unidad, stock) {
    const tabla = document.getElementById('tablaMateriales').querySelector('tbody');
    const fila = document.createElement('tr');
    
    // Crear un botón de eliminar para cada fila
    const btnEliminar = `<button class="btn btn-danger btn-sm eliminarFila">Eliminar</button>`;

    // Agregar la nueva columna "Acciones" con el botón de eliminar
    fila.innerHTML = `<td>${id}</td><td>${nombre}</td><td>${unidad}</td><td>${stock}</td>`;
    
    // Añadir la fila a la tabla
    tabla.appendChild(fila);

    // Funcionalidad para el botón de eliminar con SweetAlert
}


// Agregar un movimiento
document.getElementById('btnAgregarMovimiento').addEventListener('click', () => {
    const tipo = document.getElementById('movimientoTipo').value;
    const fecha = document.getElementById('movimientoFecha').value;
    const cantidad = parseInt(document.getElementById('movimientoCantidad').value.trim(), 10);
    const materialId = document.getElementById('movimientoMaterialId').value.trim();

    if (!tipo || !fecha || isNaN(cantidad) || !materialId) {
        alert('Por favor, complete todos los campos correctamente.');
        return;
    }

    if (!materiales[materialId]) {
        alert('El ID del material no existe en la tabla de materiales.');
        return;
    }

    // Actualizar el stock
    const material = materiales[materialId];
    if (tipo === 'Ingreso') {
        material.stock += cantidad;
    } else if (tipo === 'Salida') {
        if (material.stock >= cantidad) {
            material.stock -= cantidad;
        } else {
            alert('Stock insuficiente para realizar la salida.');
            return;
        }
    }

    // Actualizar tabla de materiales
    actualizarTablaMateriales();

    // Agregar movimiento a la tabla de movimientos
    movimientoCount++;
    const id = `M${movimientoCount.toString().padStart(4, '0')}`;
    agregarFilaMovimientos(id, tipo, fecha, cantidad, materialId);
    document.getElementById('formMovimientos').reset();
});

// Función para agregar fila a la tabla de movimientos
function agregarFilaMovimientos(id, tipo, fecha, cantidad, materialId) {
    const tabla = document.getElementById('tablaMovimientos').querySelector('tbody');
    const fila = document.createElement('tr');

    // Obtener el nombre del material a partir del materialId
    let nombreMaterial = materiales[materialId] ? materiales[materialId].nombre : null;

    // Si no se encuentra el material por ID, buscarlo por nombre
    if (!nombreMaterial) {
        for (const id in materiales) {
            if (materiales[id].nombre.toLowerCase() === materialId.toLowerCase()) {
                nombreMaterial = materiales[id].nombre;
                materialId = id;  // Actualizar el ID del material
                break;
            }
        }
    }

    // Si aún no se encuentra el material, mostrar un mensaje de error
    if (!nombreMaterial) {
        nombreMaterial = 'Material no encontrado';
    }

    // Verificar si la fecha es válida y si ya está en formato adecuado
    let fechaFormateada = fecha;  // Valor predeterminado si la fecha no es válida

    if (fecha) {
        // Verificar si la fecha ya está en un formato válido (por ejemplo, dd/mm/yyyy)
        const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        
        if (fechaRegex.test(fecha)) {
            // Si la fecha ya está en formato correcto (dd/mm/yyyy), no la convertimos
            fechaFormateada = fecha;
        } else {
            // Si la fecha no está en el formato adecuado, la convertimos
            const fechaConvertida = new Date(fecha);
            if (!isNaN(fechaConvertida.getTime())) {  // Verificar si la fecha es válida
                const dia = String(fechaConvertida.getDate()).padStart(2, '0');
                const mes = String(fechaConvertida.getMonth() + 1).padStart(2, '0');
                const anio = fechaConvertida.getFullYear();
                fechaFormateada = `${dia}/${mes}/${anio}`;  // Solo fecha, sin hora
            } else {
                fechaFormateada = 'Fecha inválida';
            }
        }
    }

    // Crear la fila con los datos y un botón de eliminar
    fila.innerHTML = `<td>${id}</td><td>${tipo}</td><td>${fechaFormateada}</td><td>${cantidad}</td><td>${nombreMaterial}</td>
                     <td><button type="button" class="btn btn-danger btnEliminar">Eliminar</button></td>`;

    // Añadir la fila a la tabla
    tabla.appendChild(fila);

    // Asociar el evento de eliminar a este botón con SweetAlert
    fila.querySelector('.btnEliminar').addEventListener('click', function() {
        // Usar SweetAlert para confirmar la eliminación
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡Esta acción no se puede deshacer!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Actualizar el stock según el tipo de movimiento
                const cantidad = parseInt(fila.children[3].textContent);
                const tipoMovimiento = fila.children[1].textContent;
                if (tipoMovimiento === 'Ingreso') {
                    // Restar del stock
                    materiales[materialId].stock -= cantidad;
                } else if (tipoMovimiento === 'Salida') {
                    // Sumar al stock
                    materiales[materialId].stock += cantidad;
                }

                // Eliminar la fila
                tabla.removeChild(fila);

                // Mostrar mensaje de éxito
                Swal.fire(
                    'Eliminado!',
                    'La fila ha sido eliminada y el stock ha sido actualizado.',
                    'success'
                );

                // Actualizar la tabla de materiales (esto es opcional, si tienes una tabla de materiales)
                actualizarTablaMateriales();  // Función para actualizar la tabla de materiales
            }
        });
    });
}




function eliminarMaterialPorInput() {
    // Obtener el ID del material a eliminar desde el input
    const id = document.getElementById('idEliminar').value.trim();

    // Verificar si se ha ingresado un ID
    if (id) {
        // Verificar si el material existe
        if (materiales.hasOwnProperty(id)) {
            const material = materiales[id];

            // Usar SweetAlert para confirmar la eliminación
            Swal.fire({
                title: '¿Estás seguro?',
                text: `¡Esta acción eliminará el material ${material.nombre} permanentemente!`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Eliminar el material del objeto
                    delete materiales[id];

                    // Actualizar la tabla de materiales
                    actualizarTablaMateriales();

                    // Mostrar mensaje de éxito
                    Swal.fire(
                        'Eliminado!',
                        'El material ha sido eliminado y el stock ha sido actualizado.',
                        'success'
                    );
                }
            });
        } else {
            Swal.fire(
                'Error',
                `El material con ID ${id} no existe.`,
                'error'
            );
        }
    } else {
        Swal.fire(
            'Error',
            'Por favor, ingresa un ID válido.',
            'error'
        );
    }
}

// Función para actualizar la tabla de materiales después de la eliminación
function actualizarTablaMateriales() {
    const tablaMateriales = document.getElementById('tablaMateriales').querySelector('tbody');
    tablaMateriales.innerHTML = '';  // Limpiar la tabla

    // Recorrer los materiales y mostrar el stock actualizado
    for (const id in materiales) {
        const material = materiales[id];
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${id}</td>
            <td>${material.nombre}</td>
            <td>${material.unidad}</td>
            <td>${material.stock}</td>
        `;
        tablaMateriales.appendChild(fila);
    }
}





