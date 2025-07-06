package com.upv.examcalendar.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.ArrayList;

/**
 * JWT Authentication Filter for processing Supabase JWT tokens.
 * Integrates with Spring Security authentication chain.
 * 
 * Supports both Authorization Bearer header and apikey header (Supabase style).
 * Compatible with Supabase client patterns.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final SupabaseJwtUtil jwtUtil;
    private final SupabaseUserDetailsService userDetailsService;

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String APIKEY_HEADER = "apikey";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        try {
            String jwt = extractJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && jwtUtil.validateToken(jwt)) {
                String userId = jwtUtil.getUserIdFromToken(jwt);
                String role = jwtUtil.getRoleFromToken(jwt);
                String email = jwtUtil.getEmailFromToken(jwt);

                if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // Create authentication token
                    SupabaseUserDetails userDetails = userDetailsService.loadUserByToken(jwt);

                    if (userDetails != null) {
                        // Create authorities based on Supabase role
                        List<SimpleGrantedAuthority> authorities = createAuthorities(role);

                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                authorities);

                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);

                        log.debug("Successfully authenticated user: {} with role: {}", email, role);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
            // Don't throw exception - let the request continue but without authentication
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extracts JWT token from request headers.
     * Supports both Authorization Bearer and apikey headers (Supabase patterns).
     * 
     * @param request The HTTP request
     * @return The JWT token, or null if not found
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        // First try Authorization header with Bearer prefix
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }

        // Fallback to apikey header (Supabase client pattern)
        String apiKeyToken = request.getHeader(APIKEY_HEADER);
        if (StringUtils.hasText(apiKeyToken)) {
            return apiKeyToken;
        }

        return null;
    }

    /**
     * Creates Spring Security authorities based on Supabase role.
     * 
     * @param role The Supabase role from JWT token
     * @return List of authorities
     */
    private List<SimpleGrantedAuthority> createAuthorities(String role) {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        if (role != null) {
            // Map Supabase roles to Spring Security authorities
            switch (role) {
                case SupabaseJwtUtil.ANON_ROLE:
                    authorities.add(new SimpleGrantedAuthority("ROLE_ANONYMOUS"));
                    break;
                case SupabaseJwtUtil.AUTHENTICATED_ROLE:
                    authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                    authorities.add(new SimpleGrantedAuthority("ROLE_AUTHENTICATED"));
                    break;
                case SupabaseJwtUtil.SERVICE_ROLE:
                    authorities.add(new SimpleGrantedAuthority("ROLE_SERVICE"));
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                    break;
                default:
                    log.warn("Unknown Supabase role: {}", role);
                    authorities.add(new SimpleGrantedAuthority("ROLE_UNKNOWN"));
                    break;
            }
        }

        return authorities;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        // Skip authentication for public endpoints
        String path = request.getRequestURI();

        // Allow health checks and actuator endpoints without authentication
        if (path.startsWith("/actuator/")) {
            return true;
        }

        // Allow public API endpoints (following Supabase patterns)
        if (path.equals("/api/health") || path.equals("/api/public")) {
            return true;
        }

        return false;
    }
}