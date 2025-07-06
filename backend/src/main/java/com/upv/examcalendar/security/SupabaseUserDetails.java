package com.upv.examcalendar.security;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.ArrayList;

/**
 * Custom UserDetails implementation for Supabase users.
 * Represents authenticated users from Supabase JWT tokens.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupabaseUserDetails implements UserDetails {

    private String userId;
    private String email;
    private String role;
    private String sessionId;
    private boolean mfaEnabled;
    private String token;
    private List<SimpleGrantedAuthority> authorities;

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        // JWT-based authentication doesn't use passwords
        return null;
    }

    @Override
    public List<SimpleGrantedAuthority> getAuthorities() {
        return authorities != null ? authorities : new ArrayList<>();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    /**
     * Checks if user is authenticated (not anonymous).
     * 
     * @return true if user is authenticated
     */
    public boolean isAuthenticated() {
        return SupabaseJwtUtil.AUTHENTICATED_ROLE.equals(role);
    }

    /**
     * Checks if user is anonymous.
     * 
     * @return true if user is anonymous
     */
    public boolean isAnonymous() {
        return SupabaseJwtUtil.ANON_ROLE.equals(role);
    }

    /**
     * Checks if user has service role (admin).
     * 
     * @return true if user has service role
     */
    public boolean isServiceRole() {
        return SupabaseJwtUtil.SERVICE_ROLE.equals(role);
    }
}