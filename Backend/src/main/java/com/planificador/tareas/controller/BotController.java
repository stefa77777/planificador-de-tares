package com.planificador.tareas.controller;

import com.planificador.tareas.model.BotRequest;
import com.planificador.tareas.model.BotResponse;
import com.planificador.tareas.service.MotivationBotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bot")
public class BotController {

    private final MotivationBotService motivationBotService;

    public BotController(MotivationBotService motivationBotService) {
        this.motivationBotService = motivationBotService;
    }

    @PostMapping("/motivacion")
    public ResponseEntity<BotResponse> obtenerMotivacion(@RequestBody BotRequest request) {
        String frase = motivationBotService.generarFrase(
                request.nombre(),
                request.pendientes(),
                request.hechas()
        );
        return ResponseEntity.ok(new BotResponse(frase));
    }
}