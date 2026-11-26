package com.planificador.tareas.model;

public record BotRequest(
        String nombre,
        int pendientes,
        int hechas
) {}