// ===== REFERENCIAS A LOS ELEMENTOS DEL HTML =====
const formulario = document.getElementById('formulario');
const inputNombre = document.getElementById('nombre');
const inputActual = document.getElementById('actual');
const inputMinimo = document.getElementById('minimo');
const mensaje = document.getElementById('mensaje');
const lista = document.getElementById('lista');
const textoVacio = document.getElementById('vacio');
const totalProductos = document.getElementById('totalProductos');
const totalReponer = document.getElementById('totalReponer');
const botonesFiltro = document.querySelectorAll('.filtro');
// ===== CLAVES DE LOCALSTORAGE =====
const CLAVE_PRODUCTOS = 'abastecimiento_productos';  // lista de productos
const CLAVE_FILTRO = 'abastecimiento_filtro';        // filtro seleccionado
const CLAVE_BORRADOR = 'abastecimiento_borrador';    // lo escrito en el formulario
// ===== PRODUCTOS DE EJEMPLO (solo se usan la primera vez) =====
const ejemplos = [
    { id: 1, nombre: 'Arroz 500 g', actual: 3, minimo: 10 },
    { id: 2, nombre: 'Aceite 1 L', actual: 12, minimo: 6 },
    { id: 3, nombre: 'Papel higiénico', actual: 2, minimo: 8 }
];
// ===== LEER DATOS GUARDADOS =====
// Devuelve el valor guardado (convertido de texto a objeto) o uno por defecto
function leerStorage(clave, porDefecto) {
    try {
        const guardado = localStorage.getItem(clave);
        return guardado ? JSON.parse(guardado) : porDefecto;
    } catch (error) {
        return porDefecto;
    }
}
// Al cargar la página recuperamos productos y filtro guardados
let productos = leerStorage(CLAVE_PRODUCTOS, ejemplos);
let filtro = leerStorage(CLAVE_FILTRO, 'reponer');
// ===== GUARDAR DATOS =====
function guardar() {
    localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(productos));
    localStorage.setItem(CLAVE_FILTRO, JSON.stringify(filtro));
}
// Guarda lo que se está escribiendo para no perderlo al refrescar
function guardarBorrador() {
    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({
        nombre: inputNombre.value, actual: inputActual.value, minimo: inputMinimo.value
    }));
}
// Rellena el formulario con el borrador guardado
function cargarBorrador() {
    const borrador = leerStorage(CLAVE_BORRADOR, null);
    if (!borrador) return;
    inputNombre.value = borrador.nombre;
    inputActual.value = borrador.actual;
    inputMinimo.value = borrador.minimo;
}
// ===== REGLA DE NEGOCIO =====
// Un producto necesita reposición si su stock actual es menor al mínimo
function necesitaReposicion(producto) {
    return producto.actual < producto.minimo;
}
// ===== AGREGAR UN PRODUCTO =====
function agregarProducto(evento) {
    evento.preventDefault(); // evita que la página se recargue
    const nombre = inputNombre.value.trim();
    const actual = parseInt(inputActual.value, 10);
    const minimo = parseInt(inputMinimo.value, 10);
    // Validaciones: si algo está mal, mostramos el error y salimos
    if (nombre === '') return (mensaje.textContent = 'Escribe el nombre del producto.');
    if (isNaN(actual) || actual < 0) return (mensaje.textContent = 'El stock actual debe ser 0 o más.');
    if (isNaN(minimo) || minimo < 1) return (mensaje.textContent = 'El stock mínimo debe ser 1 o más.');
    productos.push({ id: Date.now(), nombre, actual, minimo }); // id único con la fecha
    guardar();
    formulario.reset();
    localStorage.removeItem(CLAVE_BORRADOR); // el borrador ya no hace falta
    mensaje.textContent = '';
    inputNombre.focus();
    dibujarLista();
}
// ===== REPONER UN PRODUCTO (lleva el stock hasta el mínimo) =====
function reponer(id) {
    const producto = productos.find(p => p.id === id);
    producto.actual = producto.minimo;
    guardar();
    dibujarLista();
}
// ===== ELIMINAR UN PRODUCTO =====
function eliminar(id) {
    productos = productos.filter(p => p.id !== id); // conserva todos menos ese id
    guardar();
    dibujarLista();
}
// ===== DIBUJAR LA LISTA Y LOS NÚMEROS DEL RESUMEN =====
function dibujarLista() {
    lista.innerHTML = '';
    const porReponer = productos.filter(necesitaReposicion);
    // Según el filtro mostramos solo los que faltan o todos
    const visibles = filtro === 'reponer' ? porReponer : productos;
    visibles.forEach(producto => {
        const falta = necesitaReposicion(producto);
        const item = document.createElement('li');
        item.className = falta ? 'item reponer' : 'item';
        // Bloque de texto: nombre, stock y estado
        const info = document.createElement('div');
        info.innerHTML = '<div class="item-nombre"></div><div class="item-detalle"></div><span class="etiqueta"></span>';
        info.querySelector('.item-nombre').textContent = producto.nombre;
        info.querySelector('.item-detalle').textContent =
            `Stock: ${producto.actual} | Mínimo: ${producto.minimo}`;
        info.querySelector('.etiqueta').textContent = falta
            ? `Reponer ${producto.minimo - producto.actual} unidades`
            : 'Stock suficiente';
        // Botones de acción
        const acciones = document.createElement('div');
        acciones.className = 'item-acciones';
        if (falta) acciones.appendChild(crearBoton('Reponer', 'btn-reponer', () => reponer(producto.id)));
        acciones.appendChild(crearBoton('Eliminar', 'btn-eliminar', () => eliminar(producto.id)));
        item.append(info, acciones);
        lista.appendChild(item);
    });
    // Mensaje cuando no hay nada que mostrar
    textoVacio.hidden = visibles.length > 0;
    textoVacio.textContent = filtro === 'reponer'
        ? 'No hay productos por reponer.' : 'Aún no has agregado productos.';
    // Resumen y botones de filtro
    totalProductos.textContent = productos.length;
    totalReponer.textContent = porReponer.length;
    botonesFiltro.forEach(b => b.classList.toggle('activo', b.dataset.filtro === filtro));
}
// Crea un botón con texto, clase y acción al hacer clic
function crearBoton(texto, clase, accion) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = texto;
    boton.className = clase;
    boton.addEventListener('click', accion);
    return boton;
}
// ===== EVENTOS =====
formulario.addEventListener('submit', agregarProducto);
formulario.addEventListener('input', guardarBorrador);  // guarda mientras se escribe
botonesFiltro.forEach(boton => boton.addEventListener('click', () => {
    filtro = boton.dataset.filtro;  // "reponer" o "todos"
    guardar();
    dibujarLista();
}));
// ===== INICIO: se ejecuta al cargar o refrescar la página =====
cargarBorrador();  // recupera lo que estaba escrito en el formulario
dibujarLista();    // dibuja los productos guardados