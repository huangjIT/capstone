package org.example.pet_social.web;

import org.example.pet_social.service.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /** Allowed browser origins, from app.cors.allowed-origins (comma-separated). */
    private final String[] allowedOrigins;

    public WebConfig(@Value("${app.cors.allowed-origins:http://localhost:8081}") String allowedOrigins) {
        this.allowedOrigins = allowedOrigins.split("\\s*,\\s*");
    }

    /** Restrict CORS to the configured origins instead of the previous wildcard. */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtAuthFilter(JwtService jwtService) {
        FilterRegistrationBean<JwtAuthFilter> registration = new FilterRegistrationBean<>(new JwtAuthFilter(jwtService));
        registration.addUrlPatterns(
                // Private per-user data — identity is taken from the token, never a client param.
                "/api/matches/*", "/api/messages/*", "/api/notifications/*",
                // Mobile-app namespaces (token-derived identity throughout)
                "/api/walk/*", "/api/date/*", "/api/market/*",
                "/api/users/me", "/api/users/me/*", "/api/pets/my",
                // Ops/debug JSON surfaces that must not be world-readable/writable. The /dashboard
                // HTML page is a browser tool (can't send a Bearer header) — restrict it at the
                // network layer or with a prod profile instead of this filter (see SECURITY_FIXES.md).
                "/api/inspector/*", "/api/test-data/*");
        registration.setOrder(10);
        return registration;
    }
}
