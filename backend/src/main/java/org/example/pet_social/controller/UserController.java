package org.example.pet_social.controller;

import org.example.pet_social.dto.AuthResponse;
import org.example.pet_social.dto.LoginRequest;
import org.example.pet_social.dto.SignupRequest;
import org.example.pet_social.entity.User;
import org.example.pet_social.service.UserRegistryService;
import org.example.pet_social.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRegistryService userRegistryService;
    private final UserService userService;

    public UserController(UserRegistryService userRegistryService, UserService userService) {
        this.userRegistryService = userRegistryService;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@RequestBody SignupRequest req) {
        if (userService.getUserByEmail(req.getEmail()) != null) {
            return ResponseEntity.badRequest().build();
        }
        User user = new User(req.getName(), req.getEmail(), req.getRole(), req.isActive());
        user.setPasswordHash(hashPassword(req.getPassword()));
        user.setMatchPreferencesMask(req.getMatchPreferencesMask());
        User saved = userRegistryService.registerUser(user);
        return ResponseEntity.ok(toResponse(saved));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginUser(@RequestBody LoginRequest req) {
        User user = userService.getUserByEmail(req.getEmail());
        if (user == null || !hashPassword(req.getPassword()).equals(user.getPasswordHash())) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(toResponse(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuthResponse> getUser(@PathVariable Long id) {
        User user = userService.getUserById(id);
        if (user == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(toResponse(user));
    }

    private AuthResponse toResponse(User u) {
        return new AuthResponse(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.isActive());
    }

    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(password.getBytes()));
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 unavailable", e);
        }
    }
}
