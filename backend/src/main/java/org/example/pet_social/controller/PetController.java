package org.example.pet_social.controller;

import org.example.pet_social.dto.BlindDatePetResponse;
import org.example.pet_social.dto.NearbyPetResponse;
import org.example.pet_social.dto.PetCreateRequest;
import org.example.pet_social.dto.PetResponse;
import org.example.pet_social.dto.WalkingPartnerResponse;
import org.example.pet_social.entity.Pet;
import org.example.pet_social.repository.PetRepository;
import org.example.pet_social.service.PetQueryService;
import org.example.pet_social.service.UserService;
import org.example.pet_social.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pets")
public class PetController {

    private final PetRepository petRepository;
    private final PetQueryService petQueryService;
    private final UserService userService;

    public PetController(PetRepository petRepository, PetQueryService petQueryService, UserService userService) {
        this.petRepository = petRepository;
        this.petQueryService = petQueryService;
        this.userService = userService;
    }

    /** HomeMapScreen: pet pins around the viewport (locations come from Redis users:geo). */
    @GetMapping("/nearby")
    public List<NearbyPetResponse> nearby(@RequestParam double lat,
                                          @RequestParam double lon,
                                          @RequestParam(defaultValue = "5") double radiusKm,
                                          @RequestParam(defaultValue = "50") int limit) {
        return petQueryService.findNearbyPets(lat, lon, radiusKm, limit);
    }

    /** FindPartnersScreen: walking-partner cards. */
    @GetMapping("/partners")
    public List<WalkingPartnerResponse> partners(@RequestParam(required = false) Long userId,
                                                 @RequestParam(required = false) Double lat,
                                                 @RequestParam(required = false) Double lon,
                                                 @RequestParam(required = false) String species) {
        return petQueryService.findWalkingPartners(userId, lat, lon, species);
    }

    /** PetBlindDateScreen: swipe deck. */
    @GetMapping("/blind-dates")
    public List<BlindDatePetResponse> blindDates(@RequestParam(required = false) Long userId,
                                                 @RequestParam(required = false) Double lat,
                                                 @RequestParam(required = false) Double lon,
                                                 @RequestParam(required = false) String species) {
        return petQueryService.findBlindDatePets(userId, lat, lon, species);
    }

    @GetMapping("/owner/{ownerId}")
    public List<PetResponse> byOwner(@PathVariable Long ownerId) {
        return petRepository.findWithOwnerByOwnerId(ownerId).stream().map(PetResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PetResponse> get(@PathVariable Long id) {
        return petRepository.findById(id)
                .map(pet -> ResponseEntity.ok(PetResponse.from(pet)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PetResponse> create(@RequestBody PetCreateRequest req) {
        User owner = userService.getUserById(req.ownerId());
        if (owner == null) {
            return ResponseEntity.badRequest().build();
        }
        Pet pet = new Pet(owner, req.name(), req.species() == null ? "OTHER" : req.species().toUpperCase(), req.breed());
        pet.setGender(req.gender());
        pet.setDateOfBirth(req.dateOfBirth());
        pet.setBio(req.bio());
        pet.setAvatarEmoji(req.avatarEmoji());
        if (req.personalityTags() != null) {
            pet.setPersonalityTags(String.join(",", req.personalityTags()));
        }
        pet.setIsVaccinated(req.vaccinated());
        pet.setIsNeutered(req.neutered());
        pet.setIsAvailableForPlaydate(req.availableForPlaydate() == null || req.availableForPlaydate());
        pet.setPreferredWalkTime(req.preferredWalkTime());
        return ResponseEntity.ok(PetResponse.from(petRepository.save(pet)));
    }
}
