package com.upv.examcalendar.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.upv.examcalendar.client.SupabaseClient;
import com.upv.examcalendar.dto.ApiResponse;
import com.upv.examcalendar.dto.ExamDto;
import com.upv.examcalendar.service.SupabaseClientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller that demonstrates SupabaseClient usage patterns.
 * Provides endpoints that mimic the TypeScript client functionality.
 * 
 * This controller shows how to use the Java SupabaseClient in a similar way
 * to how the TypeScript client is used in the frontend.
 */
@RestController
@RequestMapping("/api/supabase-client")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class SupabaseClientController {

    private final SupabaseClientService supabaseClientService;
    private final SupabaseClient supabaseClient;

    /**
     * Creates a user client (similar to createClient() in TypeScript)
     */
    @PostMapping("/create-user-client")
    @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
    public ResponseEntity<ApiResponse<String>> createUserClient() {
        try {
            supabaseClientService.createUserClient();

            return ResponseEntity.ok(ApiResponse.<String>builder()
                    .success(true)
                    .message("User client created successfully")
                    .data("User client initialized")
                    .build());

        } catch (Exception e) {
            log.error("Error creating user client: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<String>builder()
                            .success(false)
                            .message("Error creating user client: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Creates an admin client (similar to createAdminClient() in TypeScript)
     */
    @PostMapping("/create-admin-client")
    @PreAuthorize("hasRole('SERVICE')")
    public ResponseEntity<ApiResponse<String>> createAdminClient() {
        try {
            supabaseClientService.createAdminClient();

            return ResponseEntity.ok(ApiResponse.<String>builder()
                    .success(true)
                    .message("Admin client created successfully")
                    .data("Admin client initialized")
                    .build());

        } catch (Exception e) {
            log.error("Error creating admin client: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<String>builder()
                            .success(false)
                            .message("Error creating admin client: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Sets authentication session (similar to setSession in TypeScript)
     */
    @PostMapping("/set-session")
    @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
    public ResponseEntity<ApiResponse<String>> setSession(
            @RequestParam String accessToken,
            @RequestParam(required = false) String refreshToken) {
        try {
            supabaseClientService.setSession(accessToken, refreshToken);

            return ResponseEntity.ok(ApiResponse.<String>builder()
                    .success(true)
                    .message("Session set successfully")
                    .data("Authentication session configured")
                    .build());

        } catch (Exception e) {
            log.error("Error setting session: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<String>builder()
                            .success(false)
                            .message("Error setting session: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Gets current user information (similar to getCurrentUser in TypeScript)
     */
    @GetMapping("/current-user")
    @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
    public ResponseEntity<ApiResponse<JsonNode>> getCurrentUser() {
        try {
            Optional<JsonNode> user = supabaseClientService.getCurrentUser();

            if (user.isPresent()) {
                return ResponseEntity.ok(ApiResponse.<JsonNode>builder()
                        .success(true)
                        .message("Current user retrieved")
                        .data(user.get())
                        .build());
            } else {
                return ResponseEntity.ok(ApiResponse.<JsonNode>builder()
                        .success(false)
                        .message("No authenticated user found")
                        .build());
            }

        } catch (Exception e) {
            log.error("Error getting current user: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<JsonNode>builder()
                            .success(false)
                            .message("Error getting current user: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Signs out the current user (similar to signOut in TypeScript)
     */
    @PostMapping("/sign-out")
    @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
    public ResponseEntity<ApiResponse<String>> signOut() {
        try {
            boolean success = supabaseClientService.signOut();

            if (success) {
                return ResponseEntity.ok(ApiResponse.<String>builder()
                        .success(true)
                        .message("User signed out successfully")
                        .data("Session cleared")
                        .build());
            } else {
                return ResponseEntity.ok(ApiResponse.<String>builder()
                        .success(false)
                        .message("Sign out failed")
                        .build());
            }

        } catch (Exception e) {
            log.error("Error signing out: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<String>builder()
                            .success(false)
                            .message("Error signing out: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Gets authentication status (similar to isAuthenticated in TypeScript)
     */
    @GetMapping("/auth-status")
    @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuthStatus() {
        try {
            ApiResponse<Map<String, Object>> status = supabaseClientService.getAuthStatus();
            return ResponseEntity.ok(status);

        } catch (Exception e) {
            log.error("Error getting auth status: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .message("Error getting auth status: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Gets exams from Supabase (demonstrates database query)
     */
    @GetMapping("/exams")
    @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
    public ResponseEntity<ApiResponse<List<ExamDto>>> getExamsFromSupabase() {
        try {
            Optional<List<ExamDto>> exams = supabaseClientService.getExamsFromSupabase();

            if (exams.isPresent()) {
                return ResponseEntity.ok(ApiResponse.<List<ExamDto>>builder()
                        .success(true)
                        .message("Exams retrieved from Supabase")
                        .data(exams.get())
                        .build());
            } else {
                return ResponseEntity.ok(ApiResponse.<List<ExamDto>>builder()
                        .success(false)
                        .message("No exams found or error occurred")
                        .build());
            }

        } catch (Exception e) {
            log.error("Error getting exams from Supabase: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<List<ExamDto>>builder()
                            .success(false)
                            .message("Error getting exams: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Gets exams by degree from Supabase
     */
    @GetMapping("/exams/degree/{degree}")
    @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
    public ResponseEntity<ApiResponse<List<ExamDto>>> getExamsByDegreeFromSupabase(@PathVariable String degree) {
        try {
            Optional<List<ExamDto>> exams = supabaseClientService.getExamsByDegreeFromSupabase(degree);

            if (exams.isPresent()) {
                return ResponseEntity.ok(ApiResponse.<List<ExamDto>>builder()
                        .success(true)
                        .message("Exams retrieved for degree: " + degree)
                        .data(exams.get())
                        .build());
            } else {
                return ResponseEntity.ok(ApiResponse.<List<ExamDto>>builder()
                        .success(false)
                        .message("No exams found for degree: " + degree)
                        .build());
            }

        } catch (Exception e) {
            log.error("Error getting exams by degree from Supabase: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<List<ExamDto>>builder()
                            .success(false)
                            .message("Error getting exams: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Creates an exam in Supabase
     */
    @PostMapping("/exams")
    @PreAuthorize("hasAnyRole('AUTHENTICATED', 'SERVICE')")
    public ResponseEntity<ApiResponse<ExamDto>> createExamInSupabase(@RequestBody ExamDto examDto) {
        try {
            Optional<ExamDto> createdExam = supabaseClientService.createExamInSupabase(examDto);

            if (createdExam.isPresent()) {
                return ResponseEntity.ok(ApiResponse.<ExamDto>builder()
                        .success(true)
                        .message("Exam created in Supabase")
                        .data(createdExam.get())
                        .build());
            } else {
                return ResponseEntity.ok(ApiResponse.<ExamDto>builder()
                        .success(false)
                        .message("Failed to create exam in Supabase")
                        .build());
            }

        } catch (Exception e) {
            log.error("Error creating exam in Supabase: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<ExamDto>builder()
                            .success(false)
                            .message("Error creating exam: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Gets user calendars from Supabase (matching TypeScript database types)
     */
    @GetMapping("/user-calendars/{userId}")
    @PreAuthorize("hasAnyRole('AUTHENTICATED', 'SERVICE')")
    public ResponseEntity<ApiResponse<List<JsonNode>>> getUserCalendars(@PathVariable String userId) {
        try {
            Optional<List<JsonNode>> calendars = supabaseClientService.getUserCalendars(userId);

            if (calendars.isPresent()) {
                return ResponseEntity.ok(ApiResponse.<List<JsonNode>>builder()
                        .success(true)
                        .message("User calendars retrieved")
                        .data(calendars.get())
                        .build());
            } else {
                return ResponseEntity.ok(ApiResponse.<List<JsonNode>>builder()
                        .success(false)
                        .message("No calendars found for user")
                        .build());
            }

        } catch (Exception e) {
            log.error("Error getting user calendars from Supabase: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<List<JsonNode>>builder()
                            .success(false)
                            .message("Error getting user calendars: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Creates a user calendar in Supabase
     */
    @PostMapping("/user-calendars")
    @PreAuthorize("hasAnyRole('AUTHENTICATED', 'SERVICE')")
    public ResponseEntity<ApiResponse<JsonNode>> createUserCalendar(
            @RequestParam String userId,
            @RequestParam String name,
            @RequestBody Map<String, Object> filters) {
        try {
            Optional<JsonNode> createdCalendar = supabaseClientService.createUserCalendar(userId, name, filters);

            if (createdCalendar.isPresent()) {
                return ResponseEntity.ok(ApiResponse.<JsonNode>builder()
                        .success(true)
                        .message("User calendar created in Supabase")
                        .data(createdCalendar.get())
                        .build());
            } else {
                return ResponseEntity.ok(ApiResponse.<JsonNode>builder()
                        .success(false)
                        .message("Failed to create user calendar in Supabase")
                        .build());
            }

        } catch (Exception e) {
            log.error("Error creating user calendar in Supabase: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<JsonNode>builder()
                            .success(false)
                            .message("Error creating user calendar: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Performs a search on exams using Supabase
     */
    @GetMapping("/exams/search")
    @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
    public ResponseEntity<ApiResponse<List<ExamDto>>> searchExamsInSupabase(@RequestParam String q) {
        try {
            Optional<List<ExamDto>> exams = supabaseClientService.searchExamsInSupabase(q);

            if (exams.isPresent()) {
                return ResponseEntity.ok(ApiResponse.<List<ExamDto>>builder()
                        .success(true)
                        .message("Search completed")
                        .data(exams.get())
                        .build());
            } else {
                return ResponseEntity.ok(ApiResponse.<List<ExamDto>>builder()
                        .success(false)
                        .message("No results found for search term: " + q)
                        .build());
            }

        } catch (Exception e) {
            log.error("Error searching exams in Supabase: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<List<ExamDto>>builder()
                            .success(false)
                            .message("Error searching exams: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Gets distinct degrees from Supabase
     */
    @GetMapping("/degrees")
    @PreAuthorize("hasAnyRole('ANONYMOUS', 'AUTHENTICATED', 'SERVICE') or permitAll()")
    public ResponseEntity<ApiResponse<List<String>>> getDistinctDegreesFromSupabase() {
        try {
            Optional<List<String>> degrees = supabaseClientService.getDistinctDegreesFromSupabase();

            if (degrees.isPresent()) {
                return ResponseEntity.ok(ApiResponse.<List<String>>builder()
                        .success(true)
                        .message("Distinct degrees retrieved")
                        .data(degrees.get())
                        .build());
            } else {
                return ResponseEntity.ok(ApiResponse.<List<String>>builder()
                        .success(false)
                        .message("No degrees found")
                        .build());
            }

        } catch (Exception e) {
            log.error("Error getting distinct degrees from Supabase: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<List<String>>builder()
                            .success(false)
                            .message("Error getting degrees: " + e.getMessage())
                            .build());
        }
    }
}