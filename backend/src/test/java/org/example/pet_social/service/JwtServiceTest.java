package org.example.pet_social.service;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService("unit-test-secret", 1);

    @Test
    void issueThenVerifyReturnsUserId() {
        String token = jwtService.issue(42L, "a@b.com");
        assertThat(token.split("\\.")).hasSize(3);
        assertThat(jwtService.verify(token)).isEqualTo(Optional.of(42L));
    }

    @Test
    void rejectsNullMalformedAndUnsignedTokens() {
        assertThat(jwtService.verify(null)).isEmpty();
        assertThat(jwtService.verify("")).isEmpty();
        assertThat(jwtService.verify("only.two")).isEmpty();
        assertThat(jwtService.verify("not-base64.!!.???")).isEmpty();
    }

    @Test
    void rejectsTamperedPayload() {
        String token = jwtService.issue(42L, "a@b.com");
        String[] parts = token.split("\\.");
        String forgedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                "{\"sub\":\"1\",\"email\":\"evil@b.com\",\"iat\":0,\"exp\":99999999999}"
                        .getBytes(StandardCharsets.UTF_8));
        assertThat(jwtService.verify(parts[0] + "." + forgedPayload + "." + parts[2])).isEmpty();
    }

    @Test
    void rejectsTokenSignedWithDifferentSecret() {
        String foreign = new JwtService("other-secret", 1).issue(42L, "a@b.com");
        assertThat(jwtService.verify(foreign)).isEmpty();
    }

    @Test
    void rejectsExpiredToken() {
        JwtService expiredIssuer = new JwtService("unit-test-secret", -1);
        String token = expiredIssuer.issue(42L, "a@b.com");
        assertThat(expiredIssuer.verify(token)).isEmpty();
    }

    @Test
    void stripsQuotesFromEmailToKeepPayloadWellFormed() {
        String token = jwtService.issue(7L, "a\"b@c.com");
        assertThat(jwtService.verify(token)).isEqualTo(Optional.of(7L));
    }
}
