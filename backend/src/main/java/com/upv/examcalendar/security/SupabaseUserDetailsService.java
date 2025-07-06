package com.upv.examcalendar.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;

/**
 * User Details Service for Supabase JWT-based authentication.
 * Creates user details from JWT tokens without database lookup (stateless).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SupabaseUserDetailsService {

    private final SupabaseJwtUtil jwtUtil;

    /**
     * Loads user details from a Supabase JWT token.
     * 
     * @param token The JWT token
     * @return SupabaseUserDetails or null if token is invalid
     */
    public SupabaseUserDetails loadUserByToken(String token) {
        try {
            if (!jwtUtil.validateToken(token)) {
                return null;
            }

            String userId = jwtUtil.getUserIdFromToken(token);
            String email = jwtUtil.getEmailFromToken(token);
            String role = jwtUtil.getRoleFromToken(token);
            String sessionId = jwtUtil.getSessionIdFromToken(token);
            boolean isMfaEnabled = jwtUtil.isMFAEnabled(token);

            if (userId == null) {
                log.warn("JWT token missing user ID (sub claim)");
                return null;
            }

            // Create authorities based on role
            List<SimpleGrantedAuthority> authorities = createAuthorities(role);

            return SupabaseUserDetails.builder()
                    .userId(userId)
                    .email(email != null ? email : "anonymous@example.com")
                    .role(role)
                    .sessionId(sessionId)
                    .mfaEnabled(isMfaEnabled)
                    .authorities(authorities)
                    .token(token)
                    .build();

        } catch (Exception e) {
            log.error("Error loading user from token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Creates authorities based on Supabase role.
     * 
     * @param role The Supabase role
     * @return List of authorities
     */
    private List<SimpleGrantedAuthority> createAuthorities(String role) {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        if (role != null) {
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
                    authorities.add(new SimpleGrantedAuthority("ROLE_UNKNOWN"));
                    break;
            }
        }

        return authorities;
    }
}
