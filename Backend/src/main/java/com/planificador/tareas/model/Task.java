package com.planificador.tareas.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 8, max = 100, message = "El nombre debe tener entre 8 y 100 caracteres")
    private String name;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(min = 15, max = 500, message = "La descripción debe tener entre 15 y 500 caracteres")
    @Column(length = 500)
    private String description;

    @NotBlank(message = "Debes indicar a quién se asigna la tarea")
    private String assignedTo;

    @NotNull(message = "La fecha de entrega es obligatoria")
    private LocalDate dueDate;

    @NotBlank(message = "El estado es obligatorio")
    @Pattern(regexp = "POR HACER|EN PROCESO|REVISIÓN|HECHO",
            message = "Estado no válido")
    private String status;

    public Task() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}