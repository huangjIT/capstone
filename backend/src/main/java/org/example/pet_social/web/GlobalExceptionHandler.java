package org.example.pet_social.web;

import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

/**
 * Catches exceptions that escape controllers and returns a consistent JSON
 * error shape instead of a raw stack trace, while recording an error count
 * per exception type/status for the Prometheus/Grafana stack.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final MeterRegistry meterRegistry;

    public GlobalExceptionHandler(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex, HttpServletRequest request) {
        return respond(HttpStatus.BAD_REQUEST, ex, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, ex, request);
    }

    private ResponseEntity<ErrorResponse> respond(HttpStatus status, Exception ex, HttpServletRequest request) {
        String correlationId = String.valueOf(request.getAttribute(RequestLoggingFilter.CORRELATION_ID_ATTRIBUTE));

        meterRegistry.counter("errors.count",
                "exception", ex.getClass().getSimpleName(),
                "status", String.valueOf(status.value())
        ).increment();

        if (status.is5xxServerError()) {
            log.error("Unhandled exception on {} {} correlationId={}", request.getMethod(), request.getRequestURI(), correlationId, ex);
        } else {
            log.warn("Request error on {} {} correlationId={} message={}", request.getMethod(), request.getRequestURI(), correlationId, ex.getMessage());
        }

        ErrorResponse body = new ErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI(),
                correlationId
        );
        return ResponseEntity.status(status).body(body);
    }
}