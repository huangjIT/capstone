package org.example.pet_social.controller;

import org.example.pet_social.auth.JwtUtil;
import org.example.pet_social.entity.*;
import org.example.pet_social.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.*;

@RestController
@RequestMapping("/api/date")
public class DateController {

    private final DateInvitationRepository invitationRepo;
    private final DateRequestRepository requestRepo;
    private final UserRepository userRepo;
    private final PetRepository petRepo;
    private final MessageRepository messageRepo;
    private final JwtUtil jwtUtil;

    public DateController(DateInvitationRepository invitationRepo,
                          DateRequestRepository requestRepo,
                          UserRepository userRepo,
                          PetRepository petRepo,
                          MessageRepository messageRepo,
                          JwtUtil jwtUtil) {
        this.invitationRepo = invitationRepo;
        this.requestRepo = requestRepo;
        this.userRepo = userRepo;
        this.petRepo = petRepo;
        this.messageRepo = messageRepo;
        this.jwtUtil = jwtUtil;
    }

    // ── My Invitations ────────────────────────────────────────────────────────

    @GetMapping("/invitations/my")
    public ResponseEntity<?> getMyInvitations(@RequestHeader("Authorization") String auth) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        List<DateInvitation> list = invitationRepo.findByHostUserId(user.getId());
        list.sort(Comparator.comparing(DateInvitation::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));

        List<Map<String, Object>> result = list.stream().map(inv -> {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", inv.getId());
            dto.put("hostUserId", inv.getHostUserId());
            dto.put("hostPetId", inv.getHostPetId());
            dto.put("location", inv.getLocation());
            dto.put("date", inv.getDate());
            dto.put("time", inv.getTime());
            dto.put("message", inv.getMessage());
            dto.put("status", inv.getStatus());
            dto.put("createdAt", inv.getCreatedAt());

            long pending = requestRepo.countByInvitationIdAndStatus(inv.getId(), "PENDING");
            dto.put("pendingRequestCount", pending);

            if (inv.getHostPetId() != null) {
                petRepo.findById(inv.getHostPetId()).ifPresent(pet -> {
                    dto.put("petName", pet.getName());
                    dto.put("petSpecies", pet.getSpecies());
                    dto.put("petBreed", pet.getBreed());
                    dto.put("petGender", pet.getGender());
                    dto.put("petProfilePhotoUrl", pet.getProfilePhotoUrl());
                    dto.put("petAge", computeAge(pet.getDateOfBirth()));
                });
            }
            return dto;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping("/invitations")
    public ResponseEntity<?> createInvitation(@RequestHeader("Authorization") String auth,
                                              @RequestBody Map<String, Object> body) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        DateInvitation inv = new DateInvitation();
        inv.setHostUserId(user.getId());
        inv.setHostPetId((String) body.get("hostPetId"));
        inv.setLocation((String) body.get("location"));
        if (body.get("latitude") instanceof Number lat) inv.setLatitude(lat.doubleValue());
        if (body.get("longitude") instanceof Number lng) inv.setLongitude(lng.doubleValue());
        inv.setDate((String) body.get("date"));
        inv.setTime((String) body.get("time"));
        inv.setMessage((String) body.get("message"));
        String status = body.containsKey("status") ? (String) body.get("status") : "ACTIVE";
        inv.setStatus(status);
        inv.setCreatedAt(LocalDateTime.now());
        inv.setUpdatedAt(LocalDateTime.now());

        return ResponseEntity.ok(invitationRepo.save(inv));
    }

    @PutMapping("/invitations/{id}")
    public ResponseEntity<?> updateInvitation(@RequestHeader("Authorization") String auth,
                                              @PathVariable String id,
                                              @RequestBody Map<String, Object> body) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        DateInvitation inv = invitationRepo.findById(id).orElse(null);
        if (inv == null || !inv.getHostUserId().equals(user.getId()))
            return ResponseEntity.status(403).body("Forbidden");

        if (body.containsKey("hostPetId")) inv.setHostPetId((String) body.get("hostPetId"));
        if (body.containsKey("location")) inv.setLocation((String) body.get("location"));
        if (body.get("latitude") instanceof Number lat) inv.setLatitude(lat.doubleValue());
        if (body.get("longitude") instanceof Number lng) inv.setLongitude(lng.doubleValue());
        if (body.containsKey("date")) inv.setDate((String) body.get("date"));
        if (body.containsKey("time")) inv.setTime((String) body.get("time"));
        if (body.containsKey("message")) inv.setMessage((String) body.get("message"));
        if (body.containsKey("status")) inv.setStatus((String) body.get("status"));
        inv.setUpdatedAt(LocalDateTime.now());

        return ResponseEntity.ok(invitationRepo.save(inv));
    }

    @DeleteMapping("/invitations/{id}")
    public ResponseEntity<?> deleteInvitation(@RequestHeader("Authorization") String auth,
                                              @PathVariable String id) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        DateInvitation inv = invitationRepo.findById(id).orElse(null);
        if (inv == null || !inv.getHostUserId().equals(user.getId()))
            return ResponseEntity.status(403).body("Forbidden");

        invitationRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("deleted", id));
    }

    // ── Feed ──────────────────────────────────────────────────────────────────

    @GetMapping("/invitations/feed")
    public ResponseEntity<?> getFeed(@RequestHeader("Authorization") String auth,
                                     @RequestParam(required = false) Double lat,
                                     @RequestParam(required = false) Double lng,
                                     @RequestParam(required = false) String species,
                                     @RequestParam(required = false) String age,
                                     @RequestParam(required = false) String vaccine,
                                     @RequestParam(required = false) String breed) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        List<DateInvitation> others = invitationRepo.findByHostUserIdNotAndStatus(user.getId(), "ACTIVE");
        List<Map<String, Object>> result = new ArrayList<>();

        for (DateInvitation inv : others) {
            if (inv.getHostPetId() == null) continue;
            Pet pet = petRepo.findById(inv.getHostPetId()).orElse(null);
            if (pet == null) continue;

            // Apply species filter
            if (species != null && !species.equals("All")) {
                String petSpecies = pet.getSpecies() != null ? pet.getSpecies().toUpperCase() : "";
                if (species.equals("Dog") && !petSpecies.equals("DOG")) continue;
                else if (species.equals("Cat") && !petSpecies.equals("CAT")) continue;
                else if (species.equals("Other") && (petSpecies.equals("DOG") || petSpecies.equals("CAT"))) continue;
            }

            // Apply vaccine filter
            if (vaccine != null && !vaccine.equals("All")) {
                boolean isVaccinated = Boolean.TRUE.equals(pet.getIsVaccinated());
                if (vaccine.equals("Yes") && !isVaccinated) continue;
                if (vaccine.equals("No") && isVaccinated) continue;
            }

            // Apply breed filter
            if (breed != null && !breed.equals("All")) {
                String petBreed = pet.getBreed() != null ? pet.getBreed().toLowerCase() : "";
                if (!petBreed.contains(breed.toLowerCase())) continue;
            }

            // Apply age filter
            if (age != null && !age.equals("Any") && pet.getDateOfBirth() != null) {
                int years = Period.between(pet.getDateOfBirth(), LocalDate.now()).getYears();
                boolean matches = switch (age) {
                    case "0-1y" -> years < 1;
                    case "1-3y" -> years >= 1 && years < 3;
                    case "3-7y" -> years >= 3 && years < 7;
                    case "7y+" -> years >= 7;
                    default -> true;
                };
                if (!matches) continue;
            }

            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", inv.getId());
            dto.put("hostUserId", inv.getHostUserId());
            dto.put("location", inv.getLocation());
            dto.put("date", inv.getDate());
            dto.put("time", inv.getTime());
            dto.put("message", inv.getMessage());

            // Owner info
            userRepo.findById(inv.getHostUserId()).ifPresent(owner -> {
                dto.put("ownerName", owner.getName());
                dto.put("ownerAvatarUrl", owner.getAvatarUrl());
            });

            // Pet info
            dto.put("petId", pet.getId());
            dto.put("petName", pet.getName());
            dto.put("petSpecies", pet.getSpecies());
            dto.put("petBreed", pet.getBreed());
            dto.put("petGender", pet.getGender());
            dto.put("petProfilePhotoUrl", pet.getProfilePhotoUrl());
            dto.put("petIsVaccinated", Boolean.TRUE.equals(pet.getIsVaccinated()));
            dto.put("petIsNeutered", Boolean.TRUE.equals(pet.getIsNeutered()));
            dto.put("petAge", computeAge(pet.getDateOfBirth()));

            // Distance
            if (lat != null && lng != null && inv.getLatitude() != null && inv.getLongitude() != null) {
                double km = haversineKm(lat, lng, inv.getLatitude(), inv.getLongitude());
                dto.put("distanceKm", Math.round(km * 10.0) / 10.0);
                dto.put("distanceLabel", km < 1.0 ? Math.round(km * 1000) + "m" : String.format("%.1fkm", km));
            }

            // Current user's existing request for this invitation
            DateRequest userReq = requestRepo.findByInvitationIdAndRequesterUserId(inv.getId(), user.getId());
            if (userReq != null) {
                dto.put("myRequestId", userReq.getId());
                dto.put("myRequestStatus", userReq.getStatus());
                long unread = messageRepo.countByTypeAndDateInvitationIdAndReceiverIdAndIsRead(
                    "DATE", inv.getId(), user.getId(), false);
                dto.put("unreadMessageCount", unread);
            } else {
                dto.put("unreadMessageCount", 0);
            }

            result.add(dto);
        }

        // Sort by distance ascending when location available, else by date created
        if (lat != null && lng != null) {
            result.sort(Comparator.comparingDouble(dto ->
                dto.containsKey("distanceKm")
                    ? ((Number) dto.get("distanceKm")).doubleValue()
                    : Double.MAX_VALUE));
        }

        return ResponseEntity.ok(result);
    }

    // ── Date Requests ─────────────────────────────────────────────────────────

    @GetMapping("/requests/my-sent-unread")
    public ResponseEntity<?> getMySentUnread(@RequestHeader("Authorization") String auth) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        List<DateRequest> reqs = requestRepo.findByRequesterUserId(user.getId());
        List<Map<String, Object>> result = reqs.stream().map(req -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("invitationId", req.getInvitationId());
            m.put("requestId", req.getId());
            m.put("status", req.getStatus());
            long unread = messageRepo.countByTypeAndDateInvitationIdAndReceiverIdAndIsRead(
                "DATE", req.getInvitationId(), user.getId(), false);
            m.put("unreadCount", unread);
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/requests/my-sent")
    public ResponseEntity<?> getMySentRequests(@RequestHeader("Authorization") String auth) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        List<DateRequest> reqs = requestRepo.findByRequesterUserId(user.getId());
        List<Map<String, Object>> result = reqs.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("invitationId", r.getInvitationId());
            m.put("requestId", r.getId());
            m.put("status", r.getStatus());
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping("/requests")
    public ResponseEntity<?> sendRequest(@RequestHeader("Authorization") String auth,
                                         @RequestBody Map<String, Object> body) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        String invitationId = (String) body.get("invitationId");
        if (invitationId == null) return ResponseEntity.badRequest().body("invitationId required");

        DateInvitation inv = invitationRepo.findById(invitationId).orElse(null);
        if (inv == null) return ResponseEntity.status(404).body("Invitation not found");
        if (inv.getHostUserId().equals(user.getId()))
            return ResponseEntity.badRequest().body("Cannot request your own invitation");
        if (requestRepo.existsByInvitationIdAndRequesterUserId(invitationId, user.getId()))
            return ResponseEntity.badRequest().body("Already sent a request");

        DateRequest req = new DateRequest();
        req.setInvitationId(invitationId);
        req.setRequesterUserId(user.getId());
        req.setRequesterPetId((String) body.get("requesterPetId"));
        req.setMessage((String) body.get("message"));
        req.setStatus("PENDING");
        req.setCreatedAt(LocalDateTime.now());

        return ResponseEntity.ok(requestRepo.save(req));
    }

    @PutMapping("/requests/{id}")
    public ResponseEntity<?> updateRequestStatus(@RequestHeader("Authorization") String auth,
                                                  @PathVariable String id,
                                                  @RequestBody Map<String, Object> body) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        DateRequest req = requestRepo.findById(id).orElse(null);
        if (req == null) return ResponseEntity.status(404).body("Request not found");

        DateInvitation inv = invitationRepo.findById(req.getInvitationId()).orElse(null);
        if (inv == null || !inv.getHostUserId().equals(user.getId()))
            return ResponseEntity.status(403).body("Forbidden");

        String status = (String) body.get("status");
        if (status != null) req.setStatus(status);
        return ResponseEntity.ok(requestRepo.save(req));
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(@RequestHeader("Authorization") String auth) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        List<DateInvitation> myInvitations = invitationRepo.findByHostUserId(user.getId());
        List<Map<String, Object>> result = new ArrayList<>();

        // Received requests (host view)
        for (DateInvitation inv : myInvitations) {
            List<DateRequest> requests = requestRepo.findByInvitationId(inv.getId());
            for (DateRequest req : requests) {
                Map<String, Object> dto = new LinkedHashMap<>();
                dto.put("id", req.getId());
                dto.put("type", "date_request");
                dto.put("direction", "received");
                dto.put("status", req.getStatus());
                dto.put("createdAt", req.getCreatedAt());
                dto.put("message", req.getMessage());
                dto.put("invitationId", inv.getId());
                dto.put("invitationLocation", inv.getLocation());
                dto.put("invitationDate", inv.getDate());
                dto.put("invitationTime", inv.getTime());

                userRepo.findById(req.getRequesterUserId()).ifPresent(requester -> {
                    dto.put("requesterUserId", requester.getId());
                    dto.put("requesterName", requester.getName());
                    dto.put("requesterAvatarUrl", requester.getAvatarUrl());
                });

                if (req.getRequesterPetId() != null) {
                    petRepo.findById(req.getRequesterPetId()).ifPresent(pet -> {
                        dto.put("requesterPetName", pet.getName());
                        dto.put("requesterPetSpecies", pet.getSpecies());
                        dto.put("requesterPetBreed", pet.getBreed());
                        dto.put("requesterPetAge", computeAge(pet.getDateOfBirth()));
                        dto.put("requesterPetPhotoUrl", pet.getProfilePhotoUrl());
                        dto.put("requesterPetIsVaccinated", Boolean.TRUE.equals(pet.getIsVaccinated()));
                    });
                }

                result.add(dto);
            }
        }

        // Sent requests (requester view)
        List<DateRequest> sentRequests = requestRepo.findByRequesterUserId(user.getId());
        for (DateRequest req : sentRequests) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", req.getId());
            dto.put("type", "date_request");
            dto.put("direction", "sent");
            dto.put("status", req.getStatus());
            dto.put("createdAt", req.getCreatedAt());
            dto.put("message", req.getMessage());

            invitationRepo.findById(req.getInvitationId()).ifPresent(inv -> {
                dto.put("invitationId", inv.getId());
                dto.put("invitationLocation", inv.getLocation());
                dto.put("invitationDate", inv.getDate());
                dto.put("invitationTime", inv.getTime());

                userRepo.findById(inv.getHostUserId()).ifPresent(host -> {
                    dto.put("hostUserId", host.getId());
                    dto.put("hostName", host.getName());
                    dto.put("hostAvatarUrl", host.getAvatarUrl());
                });

                if (inv.getHostPetId() != null) {
                    petRepo.findById(inv.getHostPetId()).ifPresent(pet -> {
                        dto.put("hostPetName", pet.getName());
                        dto.put("hostPetSpecies", pet.getSpecies());
                        dto.put("hostPetBreed", pet.getBreed());
                        dto.put("hostPetPhotoUrl", pet.getProfilePhotoUrl());
                    });
                }
            });

            long unread = messageRepo.countByTypeAndDateInvitationIdAndReceiverIdAndIsRead(
                "DATE", req.getInvitationId(), user.getId(), false);
            dto.put("unreadMessageCount", unread);

            result.add(dto);
        }

        result.sort(Comparator.comparing(
            dto -> (LocalDateTime) dto.get("createdAt"),
            Comparator.nullsLast(Comparator.reverseOrder())
        ));

        return ResponseEntity.ok(result);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.substring(7);
        if (!jwtUtil.isValid(token)) return null;
        String email = jwtUtil.extractEmail(token);
        return userRepo.findByEmail(email).orElse(null);
    }

    private double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private String computeAge(LocalDate dob) {
        if (dob == null) return null;
        int years = Period.between(dob, LocalDate.now()).getYears();
        if (years == 0) {
            int months = Period.between(dob, LocalDate.now()).getMonths();
            return months + "mo";
        }
        return years + "y";
    }
}
