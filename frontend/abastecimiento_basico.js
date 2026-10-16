//-----------------------------------------//
//--|funcionalidad_abastecimiento_basico|--//
//-----------------------------------------//
const formulario = document.getElementById("formulario");
const inputNombre = document.getElementById("nombre");
const inputActual = document.getElementById("actual");
const inputMinimo = document.getElementById("minimo");
const mensaje = document.getElementById("mensaje");
const lista = document.getElementById("lista");
const textoVacio = document.getElementById("vacio");
const totalProductos = document.getElementById("totalProductos");
const totalReponer = document.getElementById("totalReponer");
const botonesFiltro = document.querySelectorAll(".filtro");
const CLAVE_PRODUCTOS = "abastecimiento_productos";
const CLAVE_FILTRO = "abastecimiento_filtro";
const CLAVE_BORRADOR = "abastecimiento_borrador";
const ejemplos = [
    {
        id: 1,
        nombre: "Arroz 500 g",
        actual: 3,
        minimo: 10
    },
    {
        id: 2,
        nombre: "Aceite 1 L",
        actual: 12,
        minimo: 6
    },
    {
        id: 3,
        nombre: "Papel higiénico",
        actual: 2,
        minimo: 8
    }
];
let productos = leerStorage(CLAVE_PRODUCTOS, ejemplos);
let filtroActual = leerStorage(CLAVE_FILTRO, "reponer");
//--------------------------//
//--|leer_datos_guardados|--//
//--------------------------//
function leerStorage(clave, porDefecto) {
    try {
        const datos = localStorage.getItem(clave);
        if (datos === null) {
            return porDefecto;
        }
        return JSON.parse(datos);
    } catch (error) {
        return porDefecto;
    }
}
function guardar() {
    localStorage.setItem(
        CLAVE_PRODUCTOS,
        JSON.stringify(productos)
    );
    localStorage.setItem(
        CLAVE_FILTRO,
        JSON.stringify(filtroActual)
    );
}
function guardarBorrador() {
    const borrador = {
        nombre: inputNombre.value,
        actual: inputActual.value,
        minimo: inputMinimo.value
    };
    localStorage.setItem(
        CLAVE_BORRADOR,
        JSON.stringify(borrador)
    );
}
function cargarBorrador() {
    const borrador = leerStorage(CLAVE_BORRADOR, null);
    if (borrador === null) {
        return;
    }
    inputNombre.value = borrador.nombre || "";
    inputActual.value = borrador.actual || "";
    inputMinimo.value = borrador.minimo || "";
}
function necesitaReposicion(producto) {
    return producto.actual < producto.minimo;
}
function agregarProducto(evento) {
    evento.preventDefault();
    const nombre = inputNombre.value.trim();
    const actualTexto = inputActual.value.trim();
    const minimoTexto = inputMinimo.value.trim();
    const actual = Number(actualTexto);
    const minimo = Number(minimoTexto);
    if (nombre === "") {
        mensaje.textContent = "Escribe el nombre del producto.";
        inputNombre.focus();
        return;
    }
    if (
        actualTexto === "" ||
        !Number.isInteger(actual) ||
        actual < 0
    ) {
        mensaje.textContent = "Ingresa un stock actual válido.";
        inputActual.focus();
        return;
    }
    if (
        minimoTexto === "" ||
        !Number.isInteger(minimo) ||
        minimo < 1
    ) {
        mensaje.textContent = "Ingresa un stock mínimo válido.";
        inputMinimo.focus();
        return;
    }
    const producto = {
        id: Date.now(),
        nombre: nombre,
        actual: actual,
        minimo: minimo
    };
    productos.push(producto);
    guardar();
    formulario.reset();
    localStorage.removeItem(CLAVE_BORRADOR);
    mensaje.textContent = "";
    inputNombre.focus();
    dibujarLista();
}
//-------------------------//
//--|reponer_existencias|--//
//-------------------------//
function reponer(id) {
    const producto = productos.find(function(producto) {
        return producto.id === id;
    });
    if (!producto) {
        return;
    }
    producto.actual = producto.minimo;
    guardar();
    dibujarLista();
}
//-----------------------//
//--|eliminar_producto|--//
//-----------------------//
function eliminar(id) {
    productos = productos.filter(function(producto) {
        return producto.id !== id;
    });
    guardar();
    dibujarLista();
}
//-----------------------------//
//--|crear_botones_de_accion|--//
//-----------------------------//
function crearBoton(texto, clase, accion) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = texto;
    boton.className = clase;
    boton.addEventListener("click", accion);
    return boton;
}
//--------------------------------//
//--|dibujar_lista_de_productos|--//
//--------------------------------//
function dibujarLista() {
    lista.innerHTML = "";
    const productosReponer = productos.filter(function(producto) {
        return necesitaReposicion(producto);
    });
    let productosVisibles = productos;
    if (filtroActual === "reponer") {
        productosVisibles = productosReponer;
    }
    productosVisibles.forEach(function(producto) {
        const elemento = document.createElement("li");
        const info = document.createElement("div");
        const nombre = document.createElement("p");
        const detalle = document.createElement("div");
        const estado = document.createElement("span");
        const acciones = document.createElement("div");
        const faltaStock = necesitaReposicion(producto);
        const unidadesFaltantes = producto.minimo - producto.actual;
        elemento.className = faltaStock ? "item reponer" : "item";
        info.className = "item-info";
        nombre.className = "item-nombre";
        detalle.className = "item-detalle";
        estado.className = "etiqueta";
        acciones.className = "item-acciones";
        nombre.textContent = producto.nombre;
        detalle.textContent =
            "Stock actual: " + producto.actual +
            " | Stock mínimo: " + producto.minimo;
        if (faltaStock) {
            estado.textContent = "Reponer " + unidadesFaltantes + " unidades";
        } else {
            estado.textContent = "Stock suficiente";
        }
        info.appendChild(nombre);
        info.appendChild(detalle);
        info.appendChild(estado);
        if (faltaStock) {
            const botonReponer = crearBoton(
                "Reponer",
                "btn-reponer",
                function() {
                    reponer(producto.id);
                }
            );
            acciones.appendChild(botonReponer);
        }
        const botonEliminar = crearBoton(
            "Eliminar",
            "btn-eliminar",
            function() {
                eliminar(producto.id);
            }
        );
        acciones.appendChild(botonEliminar);
        elemento.appendChild(info);
        elemento.appendChild(acciones);
        lista.appendChild(elemento);
    });
    textoVacio.hidden = productosVisibles.length > 0;
    if (productosVisibles.length === 0) {
        if (filtroActual === "reponer") {
            textoVacio.textContent = "No hay productos por reponer.";
        } else {
            textoVacio.textContent = "Todavía no hay productos registrados.";
        }
    }
    totalProductos.textContent = productos.length;
    totalReponer.textContent = productosReponer.length;
    botonesFiltro.forEach(function(boton) {
        boton.classList.toggle(
            "activo",
            boton.dataset.filtro === filtroActual
        );
    });
}
//----------------------------//
//--|eventos_del_formulario|--//
//----------------------------//
formulario.addEventListener("submit", agregarProducto);
formulario.addEventListener("input", guardarBorrador);
botonesFiltro.forEach(function(boton) {
    boton.addEventListener("click", function() {
        filtroActual = boton.dataset.filtro; 
        guardar();
        dibujarLista();
    });
});
//------------------------//
//--|iniciar_aplicacion|--//
//------------------------//
cargarBorrador();
dibujarLista();