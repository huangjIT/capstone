package org.example.pet_social.service;

import org.example.pet_social.entity.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Registration/login with BCrypt hashing. Accounts created before 2026-07-02
 * hold unsalted SHA-256 hashes; login accepts those once and transparently
 * re-hashes to BCrypt on success, so the legacy path shrinks over time.
 */
@Service
public class AuthService {

    private final UserService userService;
    private final UserRegistryService userRegistryService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserService userService, UserRegistryService userRegistryService) {
        this.userService = userService;
        this.userRegistryService = userRegistryService;
    }

    /** Returns the created user, or null if the email is already taken. */
    public User register(String name, String email, String password, String role, boolean active, Long matchPreferencesMask) {
        if (userService.getUserByEmail(email) != null) {
            return null;
        }
        User user = new User(name, email, role == null || role.isBlank() ? "PET_OWNER" : role, active);
        user.setPasswordHash(encoder.encode(password));
        user.setMatchPreferencesMask(matchPreferencesMask == null ? 0L : matchPreferencesMask);
        return userRegistryService.registerUser(user);
    }

    /** Returns the user on valid credentials, else null. */
    public User login(String email, String password) {
        User user = userService.getUserByEmail(email);
        if (user == null || user.getPasswordHash() == null) {
            return null;
        }
        String stored = user.getPasswordHash();
        if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
            return encoder.matches(password, stored) ? user : null;
        }
        // Legacy unsalted SHA-256 hash: verify, then upgrade to BCrypt
        if (sha256Hex(password).equals(stored)) {
            user.setPasswordHash(encoder.encode(password));
            userService.registerUser(user); // save() — updates the existing row
            return user;
        }
        return null;
    }

    private String sha256Hex(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(password.getBytes()));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
