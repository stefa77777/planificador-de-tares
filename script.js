import { TaskApi } from "./api.js";

const KIDS = {
    Santi: { emoji: "🦖" },
    Dana:  { emoji: "🦄" },
    Cami:  { emoji: "🐱" }
};
const ESTADOS = ["POR HACER", "EN PROCESO", "REVISIÓN", "HECHO"];
const ESTADO_LABEL = {
    "POR HACER": "Por hacer",
    "EN PROCESO": "En proceso",
    "REVISIÓN": "Revisión",
    "HECHO": "Hecho"
};

class TaskManager {
    constructor() {
        this.tasks = [];
    }

    async load() {
        this.tasks = await TaskApi.getAll();
    }

    async addTask(nombre, descripcion, asignadoA, fechaEntrega, estado) {
        const creada = await TaskApi.create({
            nombre,
            descripcion,
            asignadoA,
            fechaEntrega,
            estado
        });
        this.tasks.push(creada);
        return creada;
    }

    async deleteTask(taskId) {
        await TaskApi.remove(taskId);
        this.tasks = this.tasks.filter(task => task.id !== taskId);
    }

    async updateStatus(taskId, estado) {
        if (!ESTADOS.includes(estado)) return;
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const actualizada = await TaskApi.update(taskId, {
            ...task,
            estado
        });
        this.tasks = this.tasks.map(t => (t.id === taskId ? actualizada : t));
    }

    getAllTasks() {
        return this.tasks;
    }

    getTasksFor(nombre) {
        return this.tasks.filter(t => t.asignadoA === nombre);
    }

    validateTaskForm(nombre, descripcion, asignadoA, fecha, estado) {
        let errors = [];
        if (nombre.length < 8) {
            errors.push("El nombre de la tarea debe tener al menos 8 caracteres.");
        }
        if (descripcion.length < 15) {
            errors.push("La descripción de la tarea debe tener al menos 15 caracteres.");
        }
        if (!asignadoA) {
            errors.push("Elige quién debe hacer la tarea.");
        }
        if (!fecha) {
            errors.push("La fecha de entrega es obligatoria.");
        }
        if (!estado) {
            errors.push("El estado de la tarea es obligatorio.");
        }
        return errors;
    }
}

const miTaskManager = new TaskManager();
let filtroActual = "Todos";
const kidDeLaPagina = document.body.dataset.child || null;

function mostrarErrores(mensajes) {
    const errorContainer = document.getElementById("errorContainer");
    const lista = Array.isArray(mensajes) ? mensajes : [mensajes];

    if (errorContainer) {
        errorContainer.innerHTML = "<ul>" + lista.map(e => "<li>" + escapeHtml(e) + "</li>").join("") + "</ul>";
        errorContainer.classList.remove("d-none");
        return;
    }

    let alerta = document.getElementById("apiAlertFallback");
    if (!alerta) {
        alerta = document.createElement("div");
        alerta.id = "apiAlertFallback";
        alerta.className = "alert alert-danger mt-3";
        (document.querySelector("main") || document.body).prepend(alerta);
    }
    alerta.innerHTML = lista.map(e => escapeHtml(e)).join("<br>");
}

function limpiarErrores() {
    const errorContainer = document.getElementById("errorContainer");
    if (errorContainer) {
        errorContainer.classList.add("d-none");
        errorContainer.innerHTML = "";
    }
    const alerta = document.getElementById("apiAlertFallback");
    if (alerta) {
        alerta.remove();
    }
}

function mensajeConexion(err, fallback) {
    if (err instanceof TypeError) {
        return "No se pudo conectar con el servidor en http://localhost:8080. Revisa que Spring Boot esté ejecutándose.";
    }
    return err?.mensajes || err?.message || fallback;
}

document.addEventListener("DOMContentLoaded", async () => {
    const taskForm = document.getElementById("taskForm");
    const container = document.getElementById("tasksContainer");

    if (taskForm) {
        taskForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const nombre = document.getElementById("taskName").value.trim();
            const descripcion = document.getElementById("taskDescription").value.trim();
            const asignadoA = document.getElementById("taskAssignee").value;
            const fechaEntrega = document.getElementById("taskDueDate").value;
            const estado = document.getElementById("taskStatus").value;
            const errors = miTaskManager.validateTaskForm(nombre, descripcion, asignadoA, fechaEntrega, estado);

            if (errors.length > 0) {
                mostrarErrores(errors);
                return;
            }

            try {
                limpiarErrores();
                const nueva = await miTaskManager.addTask(nombre, descripcion, asignadoA, fechaEntrega, estado);
                taskForm.reset();
                renderizarTodo(nueva.id);
            } catch (err) {
                mostrarErrores(mensajeConexion(err, "No se pudo guardar la tarea."));
            }
        });
    }

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            filtroActual = btn.dataset.filter;
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b === btn));
            renderizarTodo();
        });
    });

    if (container) {
        container.addEventListener("change", async (e) => {
            if (e.target.classList.contains("status-select")) {
                try {
                    limpiarErrores();
                    await miTaskManager.updateStatus(Number(e.target.dataset.id), e.target.value);
                    renderizarTodo();
                } catch (err) {
                    mostrarErrores(mensajeConexion(err, "No se pudo actualizar el estado."));
                    renderizarTodo();
                }
            }
        });

        container.addEventListener("click", async (e) => {
            const btn = e.target.closest(".delete-btn");
            if (btn && confirm("¿Eliminar esta tarea?")) {
                try {
                    limpiarErrores();
                    await miTaskManager.deleteTask(Number(btn.dataset.id));
                    renderizarTodo();
                } catch (err) {
                    mostrarErrores(mensajeConexion(err, "No se pudo eliminar la tarea."));
                }
            }
        });
    }

    try {
        limpiarErrores();
        await miTaskManager.load();
    } catch (err) {
        mostrarErrores(mensajeConexion(err, "No se pudieron cargar las tareas desde el servidor."));
    }
    renderizarTodo();
});

function renderizarTodo(nuevaId) {
    const container = document.getElementById("tasksContainer");
    if (!container) return;

    const quien = kidDeLaPagina || filtroActual;
    let lista = quien === "Todos" ? miTaskManager.getAllTasks() : miTaskManager.getTasksFor(quien);
    lista = lista.slice().sort((a, b) => a.fechaEntrega.localeCompare(b.fechaEntrega));

    container.innerHTML = "";
    if (lista.length === 0) {
        container.innerHTML = vacioHtml(quien);
    } else {
        lista.forEach(task => renderizarTarjeta(task, task.id === nuevaId));
    }
    actualizarResumen();
}

function renderizarTarjeta(task, esNueva) {
    const taskContainer = document.getElementById("tasksContainer");
    const colDiv = document.createElement("div");
    colDiv.className = kidDeLaPagina ? "col-md-6 col-xl-4" : "col-md-6";
    colDiv.setAttribute("data-task-id", task.id);

    const emoji = KIDS[task.asignadoA] ? KIDS[task.asignadoA].emoji : "⭐";
    const due = infoFecha(task);
    const opciones = ESTADOS.map(e =>
        `<option value="${e}" ${e === task.estado ? "selected" : ""}>${ESTADO_LABEL[e]}</option>`
    ).join("");

    colDiv.innerHTML = `
        <article class="task-card ${task.estado === "HECHO" ? "is-done" : ""} ${esNueva ? "task-new" : ""}" data-kid="${escapeHtml(task.asignadoA)}">
            <div class="task-top"><span class="emoji">${emoji}</span><span>${escapeHtml(task.asignadoA)}</span></div>
            <div class="task-body">
                <h5 class="task-title">${escapeHtml(task.nombre)}</h5>
                <p class="task-desc">${escapeHtml(task.descripcion)}</p>
                <div class="due ${due.clase}">📅 ${due.texto}</div>
                <div class="d-flex justify-content-between align-items-center gap-2">
                    <select class="status-select" data-id="${task.id}" data-status="${task.estado}" aria-label="Estado de la tarea">${opciones}</select>
                    <button class="delete-btn" data-id="${task.id}">Eliminar</button>
                </div>
            </div>
        </article>
    `;
    taskContainer.appendChild(colDiv);
}

function vacioHtml(quien) {
    const texto = quien === "Todos" || !quien
        ? "Crea la primera tarea con el formulario."
        : `${quien} no tiene tareas todavía.`;
    return `
        <div class="col-12">
            <div class="sticker empty-state">
                <div class="emoji">🌟</div>
                <h4>Todo despejado</h4>
                <p class="mb-0">${texto}</p>
            </div>
        </div>`;
}

function actualizarResumen() {
    Object.keys(KIDS).forEach(nombre => {
        const el = document.querySelector(`[data-kid-count="${nombre}"]`);
        if (!el) return;
        const pendientes = miTaskManager.getTasksFor(nombre).filter(t => t.estado !== "HECHO").length;
        el.textContent = pendientes === 1 ? "1 pendiente" : `${pendientes} pendientes`;
    });

    const fill = document.getElementById("progressFill");
    const text = document.getElementById("progressText");
    if (fill && text && kidDeLaPagina) {
        const todas = miTaskManager.getTasksFor(kidDeLaPagina);
        const hechas = todas.filter(t => t.estado === "HECHO").length;
        const pct = todas.length ? Math.round((hechas / todas.length) * 100) : 0;
        fill.style.width = pct + "%";
        fill.classList.toggle("empty", pct === 0);
        text.textContent = todas.length
            ? `${hechas} de ${todas.length} tareas hechas`
            : "Sin tareas asignadas";
    }
}

function infoFecha(task) {
    const [y, m, d] = task.fechaEntrega.split("-").map(Number);
    const fecha = new Date(y, m - 1, d);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const dias = Math.round((fecha - hoy) / 86400000);
    const bonita = fecha.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });

    if (task.estado === "HECHO") return { texto: bonita, clase: "" };
    if (dias < 0) return { texto: `${bonita} · atrasada`, clase: "late" };
    if (dias === 0) return { texto: "Para hoy", clase: "soon" };
    if (dias === 1) return { texto: "Para mañana", clase: "soon" };
    return { texto: bonita, clase: "" };
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, function (m) { return map[m]; });
}