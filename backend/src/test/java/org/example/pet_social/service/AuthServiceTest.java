package org.example.pet_social.service;

import org.example.pet_social.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.security.MessageDigest;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private UserService userService;
    private UserRegistryService userRegistryService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userService = mock(UserService.class);
        userRegistryService = mock(UserRegistryService.class);
        authService = new AuthService(userService, userRegistryService);
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(userService.getUserByEmail("taken@x.com")).thenReturn(new User());
        assertThat(authService.register("Sam", "taken@x.com", "pw", null, true, null)).isNull();
        verify(userRegistryService, never()).registerUser(any());
    }

    @Test
    void registerStoresBcryptHashAndDefaults() {
        when(userService.getUserByEmail("new@x.com")).thenReturn(null);
        when(userRegistryService.registerUser(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User created = authService.register("Sam", "new@x.com", "secret", "", true, null);

        assertThat(created).isNotNull();
        assertThat(created.getRole()).isEqualTo("PET_OWNER");
        assertThat(created.getMatchPreferencesMask()).isZero();
        assertThat(created.getPasswordHash()).startsWith("$2");
        assertThat(new BCryptPasswordEncoder().matches("secret", created.getPasswordHash())).isTrue();
    }

    @Test
    void loginAcceptsCorrectBcryptPassword() {
        User user = new User();
        user.setPasswordHash(new BCryptPasswordEncoder().encode("secret"));
        when(userService.getUserByEmail("u@x.com")).thenReturn(user);

        assertThat(authService.login("u@x.com", "secret")).isSameAs(user);
        assertThat(authService.login("u@x.com", "wrong")).isNull();
    }

    @Test
    void loginRejectsUnknownUserAndMissingHash() {
        when(userService.getUserByEmail("nobody@x.com")).thenReturn(null);
        assertThat(authService.login("nobody@x.com", "pw")).isNull();

        when(userService.getUserByEmail("nohash@x.com")).thenReturn(new User());
        assertThat(authService.login("nohash@x.com", "pw")).isNull();
    }

    @Test
    void loginUpgradesLegacySha256HashToBcrypt() throws Exception {
        String legacy = HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest("secret".getBytes()));
        User user = new User();
        user.setPasswordHash(legacy);
        when(userService.getUserByEmail("old@x.com")).thenReturn(user);

        User result = authService.login("old@x.com", "secret");

        assertThat(result).isSameAs(user);
        assertThat(user.getPasswordHash()).startsWith("$2");
        verify(userService).registerUser(user);
    }

    @Test
    void loginRejectsWrongPasswordAgainstLegacyHashWithoutUpgrading() throws Exception {
        String legacy = HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest("secret".getBytes()));
        User user = new User();
        user.setPasswordHash(legacy);
        when(userService.getUserByEmail("old@x.com")).thenReturn(user);

        assertThat(authService.login("old@x.com", "wrong")).isNull();
        assertThat(user.getPasswordHash()).isEqualTo(legacy);
        verify(userService, never()).registerUser(any());
    }
}
