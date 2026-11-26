const API_URL = "http://localhost:8080/api/tasks";

function aBackend(task) {
    return {
        name: task.nombre,
        description: task.descripcion,
        assignedTo: task.asignadoA,
        dueDate: task.fechaEntrega,
        status: task.estado
    };
}

function aFront(item) {
    return {
        id: item.id,
        nombre: item.name,
        descripcion: item.description,
        asignadoA: item.assignedTo,
        fechaEntrega: item.dueDate,
        estado: item.status
    };
}

async function leerRespuesta(response) {
    const raw = await response.text();
    let data = null;

    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch {
            data = { message: raw };
        }
    }

    if (!response.ok) {
        let mensajes = [];

        if (data?.mensajes && typeof data.mensajes === "object") {
            mensajes = Object.values(data.mensajes);
        } else if (data?.error) {
            mensajes = [data.error];
        } else if (data?.message) {
            mensajes = [data.message];
        } else {
            mensajes = [`Error HTTP ${response.status}`];
        }

        const err = new Error(mensajes.join(" · "));
        err.status = response.status;
        err.mensajes = mensajes;
        throw err;
    }

    return data;
}

export const TaskApi = {
    async getAll() {
        const res = await fetch(API_URL);
        const lista = await leerRespuesta(res);
        return Array.isArray(lista) ? lista.map(aFront) : [];
    },

    async create(task) {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(aBackend(task))
        });
        const creada = await leerRespuesta(res);
        return aFront(creada);
    },

    async update(id, task) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(aBackend(task))
        });
        const actualizada = await leerRespuesta(res);
        return aFront(actualizada);
    },

    async remove(id) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });
        await leerRespuesta(res);
    }
};