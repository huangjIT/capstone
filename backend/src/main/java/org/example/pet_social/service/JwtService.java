package org.example.pet_social.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

/**
 * Minimal HMAC-SHA256 JWT (header.payload.signature) issued on login/register
 * and checked by JwtAuthFilter. Deliberately dependency-free; swap for a full
 * Spring Security + jjwt setup if requirements grow beyond bearer-token auth.
 */
@Service
public class JwtService {

    private static final String HEADER_B64 = base64Url("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final byte[] secret;
    private final long ttlSeconds;

    public JwtService(@Value("${app.jwt.secret:pawpal-dev-secret-change-in-production}") String secret,
                      @Value("${app.jwt.ttl-hours:168}") long ttlHours) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.ttlSeconds = ttlHours * 3600;
    }

    public String issue(Long userId, String email) {
        long now = Instant.now().getEpochSecond();
        String payloadJson = String.format("{\"sub\":\"%d\",\"email\":\"%s\",\"iat\":%d,\"exp\":%d}",
                userId, email.replace("\"", ""), now, now + ttlSeconds);
        String signingInput = HEADER_B64 + "." + base64Url(payloadJson.getBytes(StandardCharsets.UTF_8));
        return signingInput + "." + base64Url(hmac(signingInput));
    }

    /** Returns the userId if the token is well-formed, correctly signed, and not expired. */
    public Optional<Long> verify(String token) {
        if (token == null) {
            return Optional.empty();
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return Optional.empty();
        }
        String signingInput = parts[0] + "." + parts[1];
        byte[] expected = hmac(signingInput);
        byte[] provided;
        try {
            provided = Base64.getUrlDecoder().decode(parts[2]);
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
        if (!MessageDigest.isEqual(expected, provided)) {
            return Optional.empty();
        }
        try {
            JsonNode payload = objectMapper.readTree(Base64.getUrlDecoder().decode(parts[1]));
            if (payload.path("exp").asLong(0) < Instant.now().getEpochSecond()) {
                return Optional.empty();
            }
            return Optional.of(Long.parseLong(payload.path("sub").asText()));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private byte[] hmac(String input) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new IllegalStateException("HmacSHA256 unavailable", ex);
        }
    }

    private static String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
