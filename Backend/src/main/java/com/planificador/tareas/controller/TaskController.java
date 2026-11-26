package com.planificador.tareas.controller;

import com.planificador.tareas.model.Task;
import com.planificador.tareas.repository.TaskRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository repository;

    public TaskController(TaskRepository repository) {
        this.repository = repository;
    }

    // GET /api/tasks -> todas las tareas
    @GetMapping
    public List<Task> getAll() {
        return repository.findAll();
    }

    // POST /api/tasks -> crear una tarea
    @PostMapping
    public ResponseEntity<Task> create(@Valid @RequestBody Task task) {
        task.setId(null); // para que siempre se cree una nueva
        Task guardada = repository.save(task);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }

    // PUT /api/tasks/{id} -> actualizar una tarea
    @PutMapping("/{id}")
    public Task update(@PathVariable Long id, @Valid @RequestBody Task datos) {
        Task existente = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe la tarea " + id));

        existente.setName(datos.getName());
        existente.setDescription(datos.getDescription());
        existente.setAssignedTo(datos.getAssignedTo());
        existente.setDueDate(datos.getDueDate());
        existente.setStatus(datos.getStatus());
        return repository.save(existente);
    }

    // DELETE /api/tasks/{id} -> eliminar una tarea
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe la tarea " + id);
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}