package com.upv.examcalendar.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.function.Function;

/**
 * JWT utility for Supabase authentication integration.
 * Based on Supabase GoTrue JWT implementation and Spring Security best
 * practices.
 * 
 * Reference: https://supabase.com/docs/guides/auth/jwts
 * JWT Structure includes: role, sub, iss, exp, iat, aud, etc.
 */
@Component
@Slf4j
public class SupabaseJwtUtil {

    @Value("${supabase.jwt.secret}")
    private String jwtSecret;

    @Value("${supabase.project.url:}")
    private String projectUrl;

    // Standard Supabase JWT claims
    private static final String ROLE_CLAIM = "role";
    private static final String USER_ID_CLAIM = "sub";
    private static final String EMAIL_CLAIM = "email";
    private static final String APP_METADATA_CLAIM = "app_metadata";
    private static final String USER_METADATA_CLAIM = "user_metadata";
    private static final String AAL_CLAIM = "aal"; // Authentication Assurance Level for MFA
    private static final String AMR_CLAIM = "amr"; // Authentication Methods References
    private static final String SESSION_ID_CLAIM = "session_id";

    // Supabase roles
    public static final String ANON_ROLE = "anon";
    public static final String AUTHENTICATED_ROLE = "authenticated";
    public static final String SERVICE_ROLE = "service_role";

    /**
     * Validates a Supabase JWT token using the project's JWT secret.
     * 
     * @param token The JWT token to validate
     * @return true if the token is valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            SecretKey key = getSigningKey();
            Jws<Claims> claimsJws = Jwts.parser()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);

            // Additional Supabase-specific validations
            Claims claims = claimsJws.getBody();

            // Check if token is expired
            if (isTokenExpired(claims)) {
                log.warn("JWT token is expired");
                return false;
            }

            // Validate issuer (should be Supabase project URL)
            String issuer = claims.getIssuer();
            if (issuer != null && !issuer.isEmpty() && !projectUrl.isEmpty()) {
                String expectedIssuer = projectUrl + "/auth/v1";
                if (!issuer.equals(expectedIssuer)) {
                    log.warn("JWT issuer validation failed. Expected: {}, Got: {}", expectedIssuer, issuer);
                    return false;
                }
            }

            // Validate role claim exists
            String role = getRoleFromToken(claims);
            if (role == null || role.isEmpty()) {
                log.warn("JWT token missing role claim");
                return false;
            }

            log.debug("JWT token validated successfully for role: {}", role);
            return true;

        } catch (ExpiredJwtException e) {
            log.error("JWT token is expired: {}", e.getMessage());
            return false;
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
            return false;
        } catch (MalformedJwtException e) {
            log.error("JWT token is malformed: {}", e.getMessage());
            return false;
        } catch (SignatureException e) {
            log.error("JWT signature validation failed: {}", e.getMessage());
            return false;
        } catch (IllegalArgumentException e) {
            log.error("JWT token compact is empty: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Unexpected error validating JWT token: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extracts the user ID (sub claim) from the JWT token.
     * 
     * @param token The JWT token
     * @return The user ID, or null if not found or invalid
     */
    public String getUserIdFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.getSubject());
    }

    /**
     * Extracts the role claim from the JWT token.
     * 
     * @param token The JWT token
     * @return The role, or null if not found or invalid
     */
    public String getRoleFromToken(String token) {
        return getClaimFromToken(token, claims -> getRoleFromToken(claims));
    }

    /**
     * Extracts the email claim from the JWT token.
     * 
     * @param token The JWT token
     * @return The email, or null if not found or invalid
     */
    public String getEmailFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get(EMAIL_CLAIM, String.class));
    }

    /**
     * Extracts the Authentication Assurance Level (AAL) from the JWT token.
     * Used for MFA validation.
     * 
     * @param token The JWT token
     * @return The AAL (aal1, aal2, etc.), or null if not found
     */
    public String getAALFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get(AAL_CLAIM, String.class));
    }

    /**
     * Checks if the user has Multi-Factor Authentication enabled (AAL2).
     * 
     * @param token The JWT token
     * @return true if user has MFA enabled, false otherwise
     */
    public boolean isMFAEnabled(String token) {
        String aal = getAALFromToken(token);
        return "aal2".equals(aal);
    }

    /**
     * Extracts the session ID from the JWT token.
     * 
     * @param token The JWT token
     * @return The session ID, or null if not found
     */
    public String getSessionIdFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get(SESSION_ID_CLAIM, String.class));
    }

    /**
     * Checks if the token represents an authenticated user.
     * 
     * @param token The JWT token
     * @return true if user is authenticated, false otherwise
     */
    public boolean isAuthenticatedUser(String token) {
        String role = getRoleFromToken(token);
        return AUTHENTICATED_ROLE.equals(role);
    }

    /**
     * Checks if the token represents an anonymous user.
     * 
     * @param token The JWT token
     * @return true if user is anonymous, false otherwise
     */
    public boolean isAnonymousUser(String token) {
        String role = getRoleFromToken(token);
        return ANON_ROLE.equals(role);
    }

    /**
     * Checks if the token represents a service role.
     * 
     * @param token The JWT token
     * @return true if token has service role, false otherwise
     */
    public boolean isServiceRole(String token) {
        String role = getRoleFromToken(token);
        return SERVICE_ROLE.equals(role);
    }

    /**
     * Gets the expiration date from the token.
     * 
     * @param token The JWT token
     * @return The expiration date, or null if invalid
     */
    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    /**
     * Checks if the token is expired.
     * 
     * @param token The JWT token
     * @return true if expired, false otherwise
     */
    public boolean isTokenExpired(String token) {
        Date expiration = getExpirationDateFromToken(token);
        return expiration != null && expiration.before(new Date());
    }

    // Private helper methods

    private SecretKey getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        try {
            final Claims claims = getAllClaimsFromToken(token);
            return claimsResolver.apply(claims);
        } catch (Exception e) {
            log.error("Error extracting claim from token: {}", e.getMessage());
            return null;
        }
    }

    private Claims getAllClaimsFromToken(String token) {
        SecretKey key = getSigningKey();
        return Jwts.parser()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private String getRoleFromToken(Claims claims) {
        return claims.get(ROLE_CLAIM, String.class);
    }

    private boolean isTokenExpired(Claims claims) {
        Date expiration = claims.getExpiration();
        return expiration != null && expiration.before(new Date());
    }
}