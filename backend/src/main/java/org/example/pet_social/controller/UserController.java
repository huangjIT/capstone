package org.example.pet_social.controller;

import org.example.pet_social.auth.JwtUtil;
import org.example.pet_social.entity.User;
import org.example.pet_social.repository.FriendshipRepository;
import org.example.pet_social.repository.PetRepository;
import org.example.pet_social.repository.PostRepository;
import org.example.pet_social.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PetRepository petRepository;
    private final FriendshipRepository friendshipRepository;
    private final JwtUtil jwtUtil;

    public UserController(UserRepository userRepository, PostRepository postRepository,
                          PetRepository petRepository, FriendshipRepository friendshipRepository,
                          JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.petRepository = petRepository;
        this.friendshipRepository = friendshipRepository;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestHeader("Authorization") String authHeader) {
        User user = resolveUser(authHeader);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(@RequestHeader("Authorization") String authHeader,
                                      @RequestBody Map<String, String> body) {
        User user = resolveUser(authHeader);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        if (body.containsKey("name")) user.setName(body.get("name"));
        if (body.containsKey("bio")) user.setBio(body.get("bio"));
        if (body.containsKey("location")) user.setLocation(body.get("location"));
        if (body.containsKey("avatarUrl")) user.setAvatarUrl(body.get("avatarUrl"));
        userRepository.save(user);
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me/stats")
    public ResponseEntity<?> getMyStats(@RequestHeader("Authorization") String authHeader) {
        User user = resolveUser(authHeader);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        long posts = postRepository.countByUserId(user.getId());
        long pets = petRepository.countByOwnerId(user.getId());
        long friends = friendshipRepository.countFriendsByUserId(user.getId());
        return ResponseEntity.ok(Map.of("posts", posts, "pets", pets, "friends", friends));
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.substring(7);
        if (!jwtUtil.isValid(token)) return null;
        String email = jwtUtil.extractEmail(token);
        return userRepository.findByEmail(email).orElse(null);
    }
}
