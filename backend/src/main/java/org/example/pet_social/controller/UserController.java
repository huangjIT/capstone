package org.example.pet_social.controller;

import org.example.pet_social.entity.User;
import org.example.pet_social.service.UserRegistryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * HTTP layer for user registration.
 *
 * Keep this controller thin:
 * - receive the request
 * - delegate orchestration to UserRegistryService
 * - return the saved user
 */
@RestController
@RequestMapping({"/api/users"})
public class UserController {

    private final UserRegistryService userRegistryService;

    public UserController(UserRegistryService userRegistryService) {
        this.userRegistryService = userRegistryService;
    }

    /**
     * Register a user.
     *
     * Flow:
     * 1) Save user in DB
     * 2) Initialize Redis runtime state
     * 3) Return the saved user
     */
    @PostMapping("/register")
    public ResponseEntity<User> registerDriver(@RequestBody User user) {
        User savedUser = userRegistryService.registerDriver(user);
        return ResponseEntity.ok(savedUser);
    }
}
