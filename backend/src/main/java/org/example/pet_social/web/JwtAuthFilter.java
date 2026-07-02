package org.example.pet_social.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.pet_social.service.JwtService;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * Bearer-token gate for the private APIs (registered on /api/matches/* and
 * /api/messages/* in WebConfig — the rest of the API stays open until full
 * Spring Security lands). On success the authenticated userId is exposed as
 * request attribute {@link #AUTH_USER_ID}.
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    public static final String AUTH_USER_ID = "authUserId";

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        // CORS preflight requests carry no Authorization header by design
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }
        String header = request.getHeader("Authorization");
        String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
        Optional<Long> userId = jwtService.verify(token);
        if (userId.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Missing or invalid Bearer token\"}");
            return;
        }
        request.setAttribute(AUTH_USER_ID, userId.get());
        chain.doFilter(request, response);
    }
}
