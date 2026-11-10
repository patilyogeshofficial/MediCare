
package com.medicare.backend.security;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger =
            LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService) {

        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // No Bearer token: continue normally.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        try {

            // Extract email from JWT.
            String userEmail = jwtService.extractUsername(jwt);

            if (userEmail == null || userEmail.isBlank()) {
                response.sendError(
                        HttpServletResponse.SC_UNAUTHORIZED,
                        "Invalid authentication token");
                return;
            }

            if (SecurityContextHolder.getContext().getAuthentication() == null) {

                // Load current user details from database.
                UserDetails userDetails =
                        userDetailsService.loadUserByUsername(userEmail);

                // Reject inactive accounts.
                if (!userDetails.isEnabled()) {
                    response.sendError(
                            HttpServletResponse.SC_UNAUTHORIZED,
                            "Account is disabled");
                    return;
                }

                // Validate token signature, username and expiration.
                if (!jwtService.isTokenValid(jwt, userDetails)) {
                    response.sendError(
                            HttpServletResponse.SC_UNAUTHORIZED,
                            "Invalid or expired authentication token");
                    return;
                }

                // Create authentication token.
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                // Set security context.
                var securityContext =
                        SecurityContextHolder.createEmptyContext();

                securityContext.setAuthentication(authentication);

                SecurityContextHolder.setContext(securityContext);
            }

        } catch (AuthenticationException exception) {

            SecurityContextHolder.clearContext();

            logger.warn(
                    "JWT authentication rejected: {}",
                    exception.getClass().getSimpleName()
            );

            response.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Authentication failed"
            );
            return;

        } catch (Exception exception) {

            SecurityContextHolder.clearContext();

            logger.warn(
                    "JWT validation failed: {}",
                    exception.getClass().getSimpleName()
            );

            response.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Invalid authentication token"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }
}
