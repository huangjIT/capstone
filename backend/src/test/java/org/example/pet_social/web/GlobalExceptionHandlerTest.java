package org.example.pet_social.web;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler(new SimpleMeterRegistry());
        request = mock(HttpServletRequest.class);
        when(request.getAttribute(RequestLoggingFilter.CORRELATION_ID_ATTRIBUTE)).thenReturn("test-cid");
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/test");
    }

    @Test
    void responseStatusExceptionKeepsItsDeliberateStatusAndReason() {
        ResponseEntity<ErrorResponse> res = handler.handleResponseStatus(
                new ResponseStatusException(HttpStatus.BAD_REQUEST, "hostPetId is required"), request);

        assertEquals(400, res.getStatusCode().value());
        assertEquals("hostPetId is required", res.getBody().message());
    }

    @Test
    void unexpectedExceptionStillMapsTo500() {
        ResponseEntity<ErrorResponse> res = handler.handleUnexpected(new RuntimeException("boom"), request);
        assertEquals(500, res.getStatusCode().value());
    }

    @Test
    void illegalArgumentMapsTo400() {
        ResponseEntity<ErrorResponse> res = handler.handleBadRequest(new IllegalArgumentException("bad input"), request);
        assertEquals(400, res.getStatusCode().value());
        assertEquals("bad input", res.getBody().message());
    }
}
