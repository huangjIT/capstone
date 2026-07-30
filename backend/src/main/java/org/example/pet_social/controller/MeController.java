package org.example.pet_social.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.example.pet_social.dto.UserProfileResponse;
import org.example.pet_social.entity.User;
import org.example.pet_social.repository.FriendshipRepository;
import org.example.pet_social.repository.PetRepository;
import org.example.pet_social.repository.PostRepository;
import org.example.pet_social.service.UserService;
import org.example.pet_social.web.RequestAuth;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Token-derived profile endpoints for the mobile Me tab. The user is always
 * the token's subject — no client-supplied ids (closes the IDOR class the
 * legacy ?userId= endpoints have).
 */
@RestController
@RequestMapping("/api/users/me")
public class MeController {

    public record UpdateProfileBody(
            @NotBlank(message = "Name is required") String name,
            @Size(max = 1000, message = "Bio too long") String bio,
            String location,
            String avatarUrl
    ) {}

    private final UserService userService;
    private final PetRepository petRepository;
    private final PostRepository postRepository;
    private final FriendshipRepository friendshipRepository;
    private final RequestAuth requestAuth;

    public MeController(UserService userService, PetRepository petRepository,
                        PostRepository postRepository, FriendshipRepository friendshipRepository,
                        RequestAuth requestAuth) {
        this.userService = userService;
        this.petRepository = petRepository;
        this.postRepository = postRepository;
        this.friendshipRepository = friendshipRepository;
        this.requestAuth = requestAuth;
    }

    @GetMapping
    public ResponseEntity<UserProfileResponse> me(HttpServletRequest request) {
        User user = userService.getUserById(requestAuth.requireUserId(request));
        if (user == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(UserProfileResponse.from(user));
    }

    @PutMapping
    public ResponseEntity<UserProfileResponse> update(@Valid @RequestBody UpdateProfileBody body,
                                                      HttpServletRequest request) {
        User user = userService.getUserById(requestAuth.requireUserId(request));
        if (user == null) return ResponseEntity.notFound().build();
        user.setName(body.name());
        user.setBio(body.bio());
        user.setLocation(body.location());
        if (body.avatarUrl() != null) {
            user.setAvatarUrl(body.avatarUrl());
        }
        return ResponseEntity.ok(UserProfileResponse.from(userService.registerUser(user)));
    }

    /** Me-tab stat tiles: {posts, pets, friends}. */
    @GetMapping("/stats")
    public Map<String, Long> stats(HttpServletRequest request) {
        Long userId = requestAuth.requireUserId(request);
        return Map.of(
                "posts", postRepository.countByUser_Id(userId),
                "pets", petRepository.countByOwner_Id(userId),
                "friends", friendshipRepository.countAcceptedForUser(userId)
        );
    }
}