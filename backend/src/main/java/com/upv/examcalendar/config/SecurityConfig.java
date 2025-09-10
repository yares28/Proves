package com.upv.examcalendar.config;

import com.upv.examcalendar.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Spring Security configuration for Supabase JWT authentication.
 * Based on Spring Boot security best practices and Supabase authentication
 * patterns.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;

        /**
         * Configures the security filter chain with JWT authentication.
         * Follows Supabase authentication patterns and Row Level Security concepts.
         * 
         * @param http HttpSecurity configuration
         * @return SecurityFilterChain
         * @throws Exception if configuration fails
         */
        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                // Disable CSRF as we're using JWT tokens (stateless)
                                .csrf(AbstractHttpConfigurer::disable)

                                // Enable CORS with custom configuration
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                                // Configure session management (stateless for JWT)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                // Configure request authorization following Supabase patterns
                                .authorizeHttpRequests(authz -> authz
                                                // Public endpoints (similar to Supabase anon access)
                                                .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()

                                                // Actuator endpoints (health checks)
                                                .requestMatchers("/actuator/**").permitAll()

                                                // Static resources
                                                .requestMatchers("/error").permitAll()

                                                // API documentation endpoints
                                                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**",
                                                                "/swagger-ui.html")
                                                .permitAll()

                                                // ETSINF table endpoints - require authentication
                                                .requestMatchers(HttpMethod.GET, "/api/exams/**")
                                                .hasAnyRole("USER", "AUTHENTICATED", "SERVICE")
                                                .requestMatchers(HttpMethod.POST, "/api/exams/**")
                                                .hasAnyRole("AUTHENTICATED", "SERVICE")
                                                .requestMatchers(HttpMethod.PUT, "/api/exams/**")
                                                .hasAnyRole("AUTHENTICATED", "SERVICE")
                                                .requestMatchers(HttpMethod.DELETE, "/api/exams/**")
                                                .hasAnyRole("SERVICE")

                                                // Admin endpoints - require service role
                                                .requestMatchers("/api/admin/**").hasRole("SERVICE")

                                                // Default: require authentication for all other endpoints
                                                .anyRequest().hasAnyRole("AUTHENTICATED", "SERVICE"))

                                // Add JWT authentication filter
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                                // Configure exception handling
                                .exceptionHandling(exceptions -> exceptions
                                                .authenticationEntryPoint((request, response, authException) -> {
                                                        response.setStatus(401);
                                                        response.setContentType("application/json");
                                                        response.getWriter().write(
                                                                        "{\"error\":\"Unauthorized\",\"message\":\"" +
                                                                                        authException.getMessage()
                                                                                        + "\"}");
                                                })
                                                .accessDeniedHandler((request, response, accessDeniedException) -> {
                                                        response.setStatus(403);
                                                        response.setContentType("application/json");
                                                        response.getWriter()
                                                                        .write("{\"error\":\"Forbidden\",\"message\":\""
                                                                                        +
                                                                                        accessDeniedException
                                                                                                        .getMessage()
                                                                                        + "\"}");
                                                }));

                return http.build();
        }

        /**
         * CORS configuration for frontend integration.
         * Allows requests from Next.js frontend and common development environments.
         * 
         * @return CorsConfigurationSource
         */
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                // Allow specific origins (secure configuration without wildcards)
                configuration.setAllowedOrigins(Arrays.asList(
                                "http://localhost:3000", // Next.js development
                                "http://localhost:3001", // Alternative development port
                                "https://www.upvcal.com", // Production domain
                                "https://your-production-domain.com" // Replace with actual production domain
                // Note: Remove wildcard patterns for security
                // Add specific deployments as needed
                ));

                // Allow common HTTP methods
                configuration.setAllowedMethods(Arrays.asList(
                                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

                // Allow common headers including Supabase headers
                configuration.setAllowedHeaders(Arrays.asList(
                                "Authorization",
                                "Content-Type",
                                "Accept",
                                "Origin",
                                "Access-Control-Request-Method",
                                "Access-Control-Request-Headers",
                                "apikey", // Supabase apikey header
                                "X-Requested-With",
                                "X-Client-Info" // Supabase client info
                ));

                // Expose headers that frontend might need
                configuration.setExposedHeaders(Arrays.asList(
                                "Access-Control-Allow-Origin",
                                "Access-Control-Allow-Credentials",
                                "X-Total-Count", // For pagination
                                "X-Page-Count" // For pagination
                ));

                // Allow credentials (needed for authentication)
                configuration.setAllowCredentials(true);

                // Cache preflight for 1 hour
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);

                return source;
        }
}