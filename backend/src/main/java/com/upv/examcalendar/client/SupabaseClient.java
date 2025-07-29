package com.upv.examcalendar.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.upv.examcalendar.config.SupabaseConfig;
import com.upv.examcalendar.dto.ApiResponse;
import com.upv.examcalendar.security.SupabaseJwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Java Supabase client that mimics the TypeScript client functionality.
 * Handles authentication, token management, and database operations.
 * 
 * Based on the TypeScript client patterns from lib/supabase/client.ts and
 * lib/supabase/server.ts
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SupabaseClient {

    private final SupabaseConfig supabaseConfig;
    private final SupabaseJwtUtil jwtUtil;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private String currentAccessToken;
    private String currentRefreshToken;
    private LocalDateTime tokenExpiration;

    /**
     * Creates a client with user authentication (similar to createClient() in
     * TypeScript)
     */
    public SupabaseClient createClient() {
        log.info("🔄 [JAVA] Creating Supabase client with user authentication...");

        // Initialize with anon key for user operations
        this.currentAccessToken = null;
        this.currentRefreshToken = null;
        this.tokenExpiration = null;

        return this;
    }

    /**
     * Creates an admin client with service role (similar to createAdminClient() in
     * TypeScript)
     */
    public SupabaseClient createAdminClient() {
        log.info("🔄 [JAVA] Creating Supabase admin client with service role...");

        // For admin operations, we'll use the service role key
        // The actual authentication will be handled by the JWT filter
        this.currentAccessToken = null;
        this.currentRefreshToken = null;
        this.tokenExpiration = null;

        return this;
    }

    /**
     * Sets authentication tokens (similar to setSession in TypeScript)
     */
    public void setSession(String accessToken, String refreshToken) {
        log.debug("✅ [JAVA] Setting session with tokens");
        this.currentAccessToken = accessToken;
        this.currentRefreshToken = refreshToken;

        if (accessToken != null) {
            try {
                // Parse token to get expiration
                this.tokenExpiration = jwtUtil.getExpirationDateFromToken(accessToken).toInstant()
                        .atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
            } catch (Exception e) {
                log.warn("Could not parse token expiration: {}", e.getMessage());
            }
        }
    }

    /**
     * Checks if the current token is expired
     */
    public boolean isTokenExpired() {
        if (currentAccessToken == null || tokenExpiration == null) {
            return true;
        }

        return LocalDateTime.now().isAfter(tokenExpiration.minusMinutes(1));
    }

    /**
     * Refreshes the authentication token
     */
    public boolean refreshToken() {
        if (currentRefreshToken == null) {
            log.warn("❌ [JAVA] No refresh token available");
            return false;
        }

        try {
            log.info("🔄 [JAVA] Refreshing authentication token...");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("refresh_token", currentRefreshToken);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            String refreshUrl = supabaseConfig.getProjectUrl() + "/auth/v1/token?grant_type=refresh_token";

            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    refreshUrl,
                    HttpMethod.POST,
                    request,
                    JsonNode.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode data = response.getBody();

                if (data.has("access_token") && data.has("refresh_token")) {
                    this.currentAccessToken = data.get("access_token").asText();
                    this.currentRefreshToken = data.get("refresh_token").asText();

                    // Update expiration
                    if (data.has("expires_in")) {
                        int expiresIn = data.get("expires_in").asInt();
                        this.tokenExpiration = LocalDateTime.now().plusSeconds(expiresIn);
                    }

                    log.info("✅ [JAVA] Token refreshed successfully");
                    return true;
                }
            }

            log.error("❌ [JAVA] Token refresh failed");
            return false;

        } catch (Exception e) {
            log.error("❌ [JAVA] Error during token refresh: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Performs a GET request to the Supabase API
     */
    public <T> Optional<T> get(String endpoint, Class<T> responseType) {
        return performRequest(HttpMethod.GET, endpoint, null, responseType);
    }

    /**
     * Performs a POST request to the Supabase API
     */
    public <T> Optional<T> post(String endpoint, Object body, Class<T> responseType) {
        return performRequest(HttpMethod.POST, endpoint, body, responseType);
    }

    /**
     * Performs a PUT request to the Supabase API
     */
    public <T> Optional<T> put(String endpoint, Object body, Class<T> responseType) {
        return performRequest(HttpMethod.PUT, endpoint, body, responseType);
    }

    /**
     * Performs a DELETE request to the Supabase API
     */
    public <T> Optional<T> delete(String endpoint, Class<T> responseType) {
        return performRequest(HttpMethod.DELETE, endpoint, null, responseType);
    }

    /**
     * Performs a database query using Supabase's REST API
     */
    public <T> Optional<T> query(String table, Map<String, Object> filters, Class<T> responseType) {
        StringBuilder url = new StringBuilder(supabaseConfig.getProjectUrl() + "/rest/v1/" + table);

        if (filters != null && !filters.isEmpty()) {
            url.append("?");
            filters.forEach((key, value) -> url.append(key).append("=").append(value).append("&"));
            url.setLength(url.length() - 1); // Remove trailing &
        }

        return get(url.toString(), responseType);
    }

    /**
     * Inserts data into a table
     */
    public <T> Optional<T> insert(String table, Object data, Class<T> responseType) {
        String url = supabaseConfig.getProjectUrl() + "/rest/v1/" + table;
        return post(url, data, responseType);
    }

    /**
     * Updates data in a table
     */
    public <T> Optional<T> update(String table, Object data, String id, Class<T> responseType) {
        String url = supabaseConfig.getProjectUrl() + "/rest/v1/" + table + "?id=eq." + id;
        return put(url, data, responseType);
    }

    /**
     * Deletes data from a table
     */
    public <T> Optional<T> delete(String table, String id, Class<T> responseType) {
        String url = supabaseConfig.getProjectUrl() + "/rest/v1/" + table + "?id=eq." + id;
        return delete(url, responseType);
    }

    /**
     * Performs a generic HTTP request with authentication
     */
    private <T> Optional<T> performRequest(HttpMethod method, String endpoint, Object body, Class<T> responseType) {
        try {
            // Check if token needs refresh
            if (isTokenExpired() && currentRefreshToken != null) {
                if (!refreshToken()) {
                    log.warn("❌ [JAVA] Failed to refresh token, proceeding without authentication");
                }
            }

            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", supabaseConfig.getAnonKey());

            if (currentAccessToken != null) {
                headers.setBearerAuth(currentAccessToken);
            }

            // Prepare request
            HttpEntity<?> request;
            if (body != null) {
                request = new HttpEntity<>(body, headers);
            } else {
                request = new HttpEntity<>(headers);
            }

            log.debug("🔄 [JAVA] Making {} request to: {}", method, endpoint);

            ResponseEntity<T> response = restTemplate.exchange(
                    endpoint,
                    method,
                    request,
                    responseType);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.debug("✅ [JAVA] Request successful");
                return Optional.ofNullable(response.getBody());
            } else {
                log.warn("❌ [JAVA] Request failed with status: {}", response.getStatusCode());
                return Optional.empty();
            }

        } catch (Exception e) {
            log.error("❌ [JAVA] Error performing request: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Gets the current user information
     */
    public Optional<JsonNode> getCurrentUser() {
        String url = supabaseConfig.getProjectUrl() + "/auth/v1/user";
        return get(url, JsonNode.class);
    }

    /**
     * Signs out the current user
     */
    public boolean signOut() {
        if (currentAccessToken == null) {
            return true;
        }

        try {
            String url = supabaseConfig.getProjectUrl() + "/auth/v1/logout";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", supabaseConfig.getAnonKey());
            headers.setBearerAuth(currentAccessToken);

            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<Void> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    Void.class);

            // Clear local tokens regardless of response
            this.currentAccessToken = null;
            this.currentRefreshToken = null;
            this.tokenExpiration = null;

            log.info("✅ [JAVA] User signed out successfully");
            return response.getStatusCode().is2xxSuccessful();

        } catch (Exception e) {
            log.error("❌ [JAVA] Error during sign out: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Gets the current authentication status
     */
    public boolean isAuthenticated() {
        return currentAccessToken != null && !isTokenExpired();
    }

    /**
     * Gets the current access token
     */
    public String getCurrentAccessToken() {
        return currentAccessToken;
    }

    /**
     * Gets the current refresh token
     */
    public String getCurrentRefreshToken() {
        return currentRefreshToken;
    }
}