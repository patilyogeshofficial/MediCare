package com.medicare.backend.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        filterChain.doFilter(request, response);
        return;
    }

    final String jwt = authHeader.substring(7);
    final String userEmail;

    try {
        userEmail = jwtService.extractUsername(jwt);
    } catch (Exception exception) {
        logger.warn("Invalid JWT token");
        filterChain.doFilter(request, response);
        return;
    }

    if (userEmail != null
            && SecurityContextHolder.getContext().getAuthentication() == null) {

        try {
            UserDetails userDetails =
                    userDetailsService.loadUserByUsername(userEmail);

            boolean valid = jwtService.isTokenValid(jwt, userDetails);

           


            if (valid) {

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

                var securityContext = SecurityContextHolder.createEmptyContext();

securityContext.setAuthentication(authentication);

SecurityContextHolder.setContext(securityContext);


            }

        } catch (Exception exception) {
            logger.warn("JWT authentication failed: {}",
                    exception.getClass().getSimpleName());
            SecurityContextHolder.clearContext();
        }
    }




    filterChain.doFilter(request, response);
}
}