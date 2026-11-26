package com.planificador.tareas.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class MotivationBotService {

    private static final List<String> SIN_TAREAS = List.of(
            "¡Todo despejado por ahora! Aprovecha para descansar o jugar un rato.",
            "No tienes tareas pendientes. ¡Qué buen momento para disfrutar tu tiempo libre!"
    );

    private static final List<String> TODO_HECHO = List.of(
            "¡Completaste todas tus tareas! Qué gran avance lograste hoy.",
            "¡Listo! Ya terminaste todo lo que tenías pendiente. ¡Tómate un respiro!"
    );

    private static final List<String> CON_PENDIENTES = List.of(
            "¡Vas por buen camino! Empieza por una tarea a la vez y verás qué rápido avanzas.",
            "Cada pequeño paso cuenta. Concéntrate en la siguiente tarea y sigue adelante.",
            "¡Tú puedes! Terminar tus deberes te deja más tiempo libre para divertirte."
    );

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generarFrase(String nombre, int pendientes, int hechas) {
        String persona = (nombre == null || nombre.isBlank()) ? "Equipo" : nombre.trim();
        String apiKey = System.getenv("GEMINI_API_KEY");

        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String fraseIa = llamarGemini(apiKey, persona, pendientes, hechas);
                if (fraseIa != null && !fraseIa.isBlank()) {
                    return fraseIa.trim();
                }
            } catch (Exception ignored) {
                // Si falla la conexión o la API externa, usamos la frase de respaldo
            }
        }

        return fraseRespaldo(persona, pendientes, hechas);
    }

    private String llamarGemini(String apiKey, String persona, int pendientes, int hechas) throws Exception {
        String prompt = String.format(
                "Escribe UNA sola frase motivacional corta, cálida y amable en español para %s (un niño o niña). " +
                        "Tiene %d tareas pendientes y %d tareas hechas. No uses emojis excesivos ni listas.",
                persona, pendientes, hechas
        );

        String cuerpoJson = objectMapper.writeValueAsString(
                new GeminiRequest(List.of(new Content(List.of(new Part(prompt)))))
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(cuerpoJson))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            return null;
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode textNode = root.path("candidates")
                .path(0)
                .path("content")
                .path("parts")
                .path(0)
                .path("text");

        return textNode.isMissingNode() ? null : textNode.asText();
    }

    private String fraseRespaldo(String persona, int pendientes, int hechas) {
        if (pendientes == 0 && hechas == 0) {
            return elegirAleatoria(SIN_TAREAS);
        }
        if (pendientes == 0) {
            return persona + ": " + elegirAleatoria(TODO_HECHO);
        }
        return persona + ", " + elegirAleatoria(CON_PENDIENTES);
    }

    private String elegirAleatoria(List<String> lista) {
        int idx = ThreadLocalRandom.current().nextInt(lista.size());
        return lista.get(idx);
    }

    private record GeminiRequest(List<Content> contents) {}
    private record Content(List<Part> parts) {}
    private record Part(String text) {}
}