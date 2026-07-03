package org.example.pet_social.controller;

import org.example.pet_social.auth.JwtUtil;
import org.example.pet_social.entity.Pet;
import org.example.pet_social.entity.User;
import org.example.pet_social.repository.PetRepository;
import org.example.pet_social.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pets")
public class PetController {

    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public PetController(PetRepository petRepository, UserRepository userRepository, JwtUtil jwtUtil) {
        this.petRepository = petRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPet(@RequestHeader("Authorization") String authHeader,
                                    @PathVariable String id) {
        User user = resolveUser(authHeader);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        Pet pet = petRepository.findById(id).orElse(null);
        if (pet == null || !pet.getOwnerId().equals(user.getId()))
            return ResponseEntity.status(403).body("Forbidden");
        return ResponseEntity.ok(pet);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyPets(@RequestHeader("Authorization") String authHeader) {
        User user = resolveUser(authHeader);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        List<Pet> pets = petRepository.findByOwnerId(user.getId());
        return ResponseEntity.ok(pets);
    }

    @PostMapping
    public ResponseEntity<?> createPet(@RequestHeader("Authorization") String authHeader,
                                       @RequestBody Map<String, Object> body) {
        User user = resolveUser(authHeader);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        Pet pet = new Pet();
        pet.setOwnerId(user.getId());
        pet.setName((String) body.get("name"));
        pet.setSpecies((String) body.get("species"));
        pet.setBreed((String) body.get("breed"));
        pet.setGender((String) body.get("gender"));
        pet.setBio((String) body.get("bio"));
        pet.setProfilePhotoUrl((String) body.get("profilePhotoUrl"));
        if (body.get("dateOfBirth") instanceof String s && !s.isBlank())
            pet.setDateOfBirth(java.time.LocalDate.parse(s));
        if (body.get("weight") instanceof Number n) pet.setWeight(n.doubleValue());
        if (body.get("isNeutered") instanceof Boolean b) pet.setIsNeutered(b);
        if (body.get("isVaccinated") instanceof Boolean b) pet.setIsVaccinated(b);
        Pet saved = petRepository.save(pet);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePet(@RequestHeader("Authorization") String authHeader,
                                       @PathVariable String id,
                                       @RequestBody Map<String, Object> body) {
        User user = resolveUser(authHeader);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        Pet pet = petRepository.findById(id).orElse(null);
        if (pet == null || !pet.getOwnerId().equals(user.getId()))
            return ResponseEntity.status(403).body("Forbidden");
        if (body.containsKey("name")) pet.setName((String) body.get("name"));
        if (body.containsKey("species")) pet.setSpecies((String) body.get("species"));
        if (body.containsKey("gender")) pet.setGender((String) body.get("gender"));
        if (body.containsKey("breed")) pet.setBreed((String) body.get("breed"));
        if (body.containsKey("bio")) pet.setBio((String) body.get("bio"));
        if (body.containsKey("profilePhotoUrl")) pet.setProfilePhotoUrl((String) body.get("profilePhotoUrl"));
        if (body.get("dateOfBirth") instanceof String s && !s.isBlank())
            pet.setDateOfBirth(java.time.LocalDate.parse(s));
        if (body.containsKey("isVaccinated")) pet.setIsVaccinated((Boolean) body.get("isVaccinated"));
        if (body.containsKey("isNeutered")) pet.setIsNeutered((Boolean) body.get("isNeutered"));
        pet.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(petRepository.save(pet));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePet(@RequestHeader("Authorization") String authHeader,
                                       @PathVariable String id) {
        User user = resolveUser(authHeader);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        Pet pet = petRepository.findById(id).orElse(null);
        if (pet == null || !pet.getOwnerId().equals(user.getId()))
            return ResponseEntity.status(403).body("Forbidden");
        petRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("deleted", id));
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.substring(7);
        if (!jwtUtil.isValid(token)) return null;
        String email = jwtUtil.extractEmail(token);
        return userRepository.findByEmail(email).orElse(null);
    }
}
