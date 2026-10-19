class taskManager {
    constructor() {
        this.tasks = [];
        this.currentId = 1;
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
        return newtask;
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
    }

    getAllTasks() {
        return this.tasks;
    }

    validateTaskForm(nombre, descripcion, asignadoA, fecha, estado) {
        let errors = [];
        if (nombre.length < 8) {
            errors.push("El nombre de la tarea debe tener al menos 8 caracteres.");
        }
        if (descripcion.length < 15) {
            errors.push("La descripción de la tarea debe tener al menos 15 caracteres.");
        }
        if (asignadoA.length < 8) {
            errors.push("El nombre del responsable debe tener al menos 8 caracteres.");
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
document.addEventListener("DOMContentLoaded", () => {
    const taskForm = document.getElementById("taskForm");
    const errorContainer = document.getElementById("errorContainer");

    taskForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const nombre = document.getElementById("taskName").value.trim();
        const descripcion = document.getElementById("taskDescription").value.trim();
        const asignadoA = document.getElementById("taskAssignee").value.trim();
        const fechaEntrega = document.getElementById("taskDueDate").value;
        const estado = document.getElementById("taskStatus").value;
        const errors = miTaskManager.validateTaskForm(nombre, descripcion, asignadoA, fechaEntrega, estado);

        if (errors.length > 0) {
            errorContainer.innerHTML = errors.join("<br>");
            errorContainer.classList.remove("d-none");
            return;
        }
        errorContainer.classList.add("d-none");
        errorContainer.innerHTML = "";
        const nuevaTarea = miTaskManager.addTask(nombre, descripcion, asignadoA, fechaEntrega, estado);
        renderizarTarjeta(nuevaTarea);
        taskForm.reset();
    });
});

function renderizarTarjeta(task) {
    const taskContainer = document.getElementById("tasksContainer");
    const colDiv = document.createElement("div");
    colDiv.className = "col-md-4 mb-4";
    colDiv.setAttribute("data-task-id", task.id);

    let badgeClass = "bg-secondary";
    if (task.estado === "POR HACER") badgeClass = "bg-danger";
    else if (task.estado === "EN PROCESO") badgeClass = "bg-warning text-dark";
    else if (task.estado === "REVISIÓN") badgeClass = "bg-info text-dark";
    else if (task.estado === "HECHO") badgeClass = "bg-success";

    colDiv.innerHTML = `
        <div class="card h-100 shadow-sm border-0">
            <div class="card-body d-flex flex-column justify-content-between">
                <div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="card-title fw-bold text-dark mb-0">${escapeHtml(task.nombre)}</h5>
                        <span class="badge ${badgeClass}">${task.estado}</span>
                    </div>
                    <h6 class="card-subtitle text-muted mb-3 small">Asignado a: ${escapeHtml(task.asignadoA)}</h6>
                    <p class="card-text text-secondary">${escapeHtml(task.descripcion)}</p>
                </div>
                <div>
                    <hr class="text-muted">
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">Entrega: <strong>${task.fechaEntrega}</strong></small>
                        <button class="btn btn-outline-danger btn-sm delete-btn" data-id="${task.id}">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    const deleteBtn = colDiv.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => {
        miTaskManager.deleteTask(task.id);
        colDiv.remove();
    });

    taskContainer.appendChild(colDiv);
}
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}