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
const STORAGE_KEY = "planificador-tareas-v1";

class taskManager {
    constructor() {
        this.tasks = [];
        this.currentId = 1;
        this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            this.tasks = Array.isArray(data.tasks) ? data.tasks : [];
            this.currentId = data.currentId || 1;
        } catch (e) {
            this.tasks = [];
            this.currentId = 1;
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: this.tasks, currentId: this.currentId }));
        } catch (e) { /* sin almacenamiento disponible */ }
    }

    addTask(nombre, descripcion, asignadoA, fechaEntrega, estado) {
        const newtask = {
            id: this.currentId++,
            nombre: nombre,
            descripcion: descripcion,
            asignadoA: asignadoA,
            fechaEntrega: fechaEntrega,
            estado: estado
        };
        this.tasks.push(newtask);
        this.save();
        return newtask;
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.save();
    }

    updateStatus(taskId, estado) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && ESTADOS.includes(estado)) {
            task.estado = estado;
            this.save();
        }
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

const miTaskManager = new taskManager();
let filtroActual = "Todos";
const kidDeLaPagina = document.body.dataset.child || null;

document.addEventListener("DOMContentLoaded", () => {
    const taskForm = document.getElementById("taskForm");
    const errorContainer = document.getElementById("errorContainer");
    const container = document.getElementById("tasksContainer");

    if (taskForm) {
        taskForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const nombre = document.getElementById("taskName").value.trim();
        const descripcion = document.getElementById("taskDescription").value.trim();
            const asignadoA = document.getElementById("taskAssignee").value;
        const fechaEntrega = document.getElementById("taskDueDate").value;
        const estado = document.getElementById("taskStatus").value;
        const errors = miTaskManager.validateTaskForm(nombre, descripcion, asignadoA, fechaEntrega, estado);

        if (errors.length > 0) {
                errorContainer.innerHTML = "<ul>" + errors.map(e => "<li>" + e + "</li>").join("") + "</ul>";
            errorContainer.classList.remove("d-none");
            return;
        }
        errorContainer.classList.add("d-none");
        errorContainer.innerHTML = "";
            const nueva = miTaskManager.addTask(nombre, descripcion, asignadoA, fechaEntrega, estado);
        taskForm.reset();
            renderizarTodo(nueva.id);
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
        container.addEventListener("change", (e) => {
            if (e.target.classList.contains("status-select")) {
                miTaskManager.updateStatus(Number(e.target.dataset.id), e.target.value);
                renderizarTodo();
            }
        });
        container.addEventListener("click", (e) => {
            const btn = e.target.closest(".delete-btn");
            if (btn && confirm("¿Eliminar esta tarea?")) {
                miTaskManager.deleteTask(Number(btn.dataset.id));
                renderizarTodo();
            }
        });
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
    // Contadores en la portada
    Object.keys(KIDS).forEach(nombre => {
        const el = document.querySelector(`[data-kid-count="${nombre}"]`);
        if (!el) return;
        const pendientes = miTaskManager.getTasksFor(nombre).filter(t => t.estado !== "HECHO").length;
        el.textContent = pendientes === 1 ? "1 pendiente" : `${pendientes} pendientes`;
    });

    // Barra de progreso en el panel de cada hijo
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