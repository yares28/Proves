package com.upv.examcalendar.controller;

import com.upv.examcalendar.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

/**
 * Health check controller for monitoring API status.
 * Provides public endpoints for health monitoring.
 */
@RestController
@RequestMapping("/api")
@Slf4j
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class HealthController {

    /**
     * Basic health check endpoint.
     * Public access - no authentication required.
     * 
     * @return Health status
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> healthData = new HashMap<>();
        healthData.put("status", "UP");
        healthData.put("timestamp", LocalDateTime.now());
        healthData.put("service", "UPV Exam Calendar API");
        healthData.put("version", "1.0.0");

        log.debug("Health check requested");

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Service is healthy")
                .data(healthData)
                .build());
    }

    /**
     * Public info endpoint.
     * Provides basic API information.
     * 
     * @return API information
     */
    @GetMapping("/public/info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> publicInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("name", "UPV Exam Calendar API");
        info.put("description", "REST API for UPV exam calendar management");
        info.put("version", "1.0.0");
        info.put("database", "Supabase PostgreSQL");
        info.put("authentication", "Supabase JWT");
        info.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("API information")
                .data(info)
                .build());
    }
}