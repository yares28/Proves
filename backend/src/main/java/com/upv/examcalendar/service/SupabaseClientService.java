package com.upv.examcalendar.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.upv.examcalendar.client.SupabaseClient;
import com.upv.examcalendar.dto.ApiResponse;
import com.upv.examcalendar.dto.ExamDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service that demonstrates SupabaseClient usage patterns.
 * Mimics the TypeScript client approach for database operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SupabaseClientService {

    private final SupabaseClient supabaseClient;
    private static final String EXAMS_TABLE = System.getenv().getOrDefault("EXAMS_TABLE", "25-26");

    /**
     * Creates a user client for authenticated operations
     */
    public SupabaseClient createUserClient() {
        log.info("🔄 [SERVICE] Creating user client...");
        return supabaseClient.createClient();
    }

    /**
     * Creates an admin client for service role operations
     */
    public SupabaseClient createAdminClient() {
        log.info("🔄 [SERVICE] Creating admin client...");
        return supabaseClient.createAdminClient();
    }

    /**
     * Sets authentication session (similar to TypeScript client)
     */
    public void setSession(String accessToken, String refreshToken) {
        log.info("🔄 [SERVICE] Setting authentication session...");
        supabaseClient.setSession(accessToken, refreshToken);
    }

    /**
     * Gets current user information from Supabase
     */
    public Optional<JsonNode> getCurrentUser() {
        log.debug("🔄 [SERVICE] Getting current user...");
        return supabaseClient.getCurrentUser();
    }

    /**
     * Signs out the current user
     */
    public boolean signOut() {
        log.info("🔄 [SERVICE] Signing out user...");
        return supabaseClient.signOut();
    }

    /**
     * Checks if user is authenticated
     */
    public boolean isAuthenticated() {
        return supabaseClient.isAuthenticated();
    }

    /**
     * Gets exams from the exams table using Supabase REST API
     */
    public Optional<List<ExamDto>> getExamsFromSupabase() {
        log.info("🔄 [SERVICE] Getting exams from Supabase...");

        Map<String, Object> filters = new HashMap<>();
        filters.put("select", "*");
        filters.put("order", "exam_date.asc");

        return supabaseClient.query(EXAMS_TABLE, filters, List.class)
                .map(response -> {
                    // Convert JsonNode response to ExamDto list
                    // This would need proper deserialization logic
                    log.info("✅ [SERVICE] Retrieved exams from Supabase");
                    return null; // Placeholder for actual conversion
                });
    }

    /**
     * Gets exams by degree from Supabase
     */
    public Optional<List<ExamDto>> getExamsByDegreeFromSupabase(String degree) {
        log.info("🔄 [SERVICE] Getting exams by degree: {} from Supabase...", degree);

        Map<String, Object> filters = new HashMap<>();
        filters.put("select", "*");
        filters.put("degree", "eq." + degree);
        filters.put("order", "exam_date.asc");

        return supabaseClient.query(EXAMS_TABLE, filters, List.class)
                .map(response -> {
                    log.info("✅ [SERVICE] Retrieved exams for degree: {} from Supabase", degree);
                    return null; // Placeholder for actual conversion
                });
    }

    /**
     * Creates a new exam in Supabase
     */
    public Optional<ExamDto> createExamInSupabase(ExamDto examDto) {
        log.info("🔄 [SERVICE] Creating exam in Supabase...");

        return supabaseClient.insert(EXAMS_TABLE, examDto, ExamDto.class);
    }

    /**
     * Updates an exam in Supabase
     */
    public Optional<ExamDto> updateExamInSupabase(Long id, ExamDto examDto) {
        log.info("🔄 [SERVICE] Updating exam {} in Supabase...", id);

        return supabaseClient.update(EXAMS_TABLE, examDto, id.toString(), ExamDto.class);
    }

    /**
     * Deletes an exam from Supabase
     */
    public boolean deleteExamFromSupabase(Long id) {
        log.info("🔄 [SERVICE] Deleting exam {} from Supabase...", id);

        return supabaseClient.delete(EXAMS_TABLE, id.toString(), Void.class).isPresent();
    }

    /**
     * Gets user calendars from Supabase (matching the TypeScript database types)
     */
    public Optional<List<JsonNode>> getUserCalendars(String userId) {
        log.info("🔄 [SERVICE] Getting user calendars for user: {} from Supabase...", userId);

        Map<String, Object> filters = new HashMap<>();
        filters.put("select", "*");
        filters.put("user_id", "eq." + userId);
        filters.put("order", "created_at.desc");

        return supabaseClient.query("user_calendars", filters, List.class)
                .map(response -> {
                    log.info("✅ [SERVICE] Retrieved user calendars from Supabase");
                    return null; // Placeholder for actual conversion
                });
    }

    /**
     * Creates a user calendar in Supabase
     */
    public Optional<JsonNode> createUserCalendar(String userId, String name, Map<String, Object> filters) {
        log.info("🔄 [SERVICE] Creating user calendar in Supabase...");

        Map<String, Object> calendarData = new HashMap<>();
        calendarData.put("user_id", userId);
        calendarData.put("name", name);
        calendarData.put("filters", filters);

        return supabaseClient.insert("user_calendars", calendarData, JsonNode.class);
    }

    /**
     * Updates a user calendar in Supabase
     */
    public Optional<JsonNode> updateUserCalendar(String calendarId, String name, Map<String, Object> filters) {
        log.info("🔄 [SERVICE] Updating user calendar {} in Supabase...", calendarId);

        Map<String, Object> calendarData = new HashMap<>();
        calendarData.put("name", name);
        calendarData.put("filters", filters);

        return supabaseClient.update("user_calendars", calendarData, calendarId, JsonNode.class);
    }

    /**
     * Deletes a user calendar from Supabase
     */
    public boolean deleteUserCalendar(String calendarId) {
        log.info("🔄 [SERVICE] Deleting user calendar {} from Supabase...", calendarId);

        return supabaseClient.delete("user_calendars", calendarId, Void.class).isPresent();
    }

    /**
     * Performs a full-text search on exams using Supabase
     */
    public Optional<List<ExamDto>> searchExamsInSupabase(String searchTerm) {
        log.info("🔄 [SERVICE] Searching exams with term: {} in Supabase...", searchTerm);

        Map<String, Object> filters = new HashMap<>();
        filters.put("select", "*");
        filters.put("textSearch", searchTerm);
        filters.put("order", "exam_date.asc");

        return supabaseClient.query(EXAMS_TABLE, filters, List.class)
                .map(response -> {
                    log.info("✅ [SERVICE] Search completed in Supabase");
                    return null; // Placeholder for actual conversion
                });
    }

    /**
     * Gets distinct degrees from Supabase
     */
    public Optional<List<String>> getDistinctDegreesFromSupabase() {
        log.info("🔄 [SERVICE] Getting distinct degrees from Supabase...");

        Map<String, Object> filters = new HashMap<>();
        filters.put("select", "degree");
        filters.put("order", "degree.asc");

        return supabaseClient.query(EXAMS_TABLE, filters, List.class)
                .map(response -> {
                    log.info("✅ [SERVICE] Retrieved distinct degrees from Supabase");
                    return null; // Placeholder for actual conversion
                });
    }

    /**
     * Gets authentication status and user info
     */
    public ApiResponse<Map<String, Object>> getAuthStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("authenticated", supabaseClient.isAuthenticated());
        status.put("hasAccessToken", supabaseClient.getCurrentAccessToken() != null);
        status.put("hasRefreshToken", supabaseClient.getCurrentRefreshToken() != null);
        status.put("tokenExpired", supabaseClient.isTokenExpired());

        if (supabaseClient.isAuthenticated()) {
            supabaseClient.getCurrentUser().ifPresent(user -> {
                status.put("user", user);
            });
        }

        return ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Authentication status retrieved")
                .data(status)
                .build();
    }
}