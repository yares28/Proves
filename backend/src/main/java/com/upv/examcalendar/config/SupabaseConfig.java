package com.upv.examcalendar.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for Supabase integration.
 * Maps to environment variables used by the TypeScript client.
 */
@Data
@Component
@ConfigurationProperties(prefix = "supabase")
public class SupabaseConfig {

    /**
     * Supabase project URL (NEXT_PUBLIC_SUPABASE_URL)
     */
    private String projectUrl;

    /**
     * Supabase anonymous key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
     */
    private String anonKey;

    /**
     * Supabase service role key (SUPABASE_SERVICE_ROLE_KEY)
     */
    private String serviceRoleKey;

    /**
     * JWT secret for token validation
     */
    private Jwt jwt = new Jwt();

    @Data
    public static class Jwt {
        /**
         * JWT secret for token validation (SUPABASE_JWT_SECRET)
         */
        private String secret;
    }

    /**
     * Gets the project URL with proper formatting
     */
    public String getProjectUrl() {
        if (projectUrl != null && !projectUrl.endsWith("/")) {
            return projectUrl + "/";
        }
        return projectUrl;
    }

    /**
     * Gets the anonymous key for user operations
     */
    public String getAnonKey() {
        return anonKey;
    }

    /**
     * Gets the service role key for admin operations
     */
    public String getServiceRoleKey() {
        return serviceRoleKey;
    }

    /**
     * Gets the JWT secret for token validation
     */
    public String getJwtSecret() {
        return jwt.getSecret();
    }
}