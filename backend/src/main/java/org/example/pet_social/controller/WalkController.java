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
@RequestMapping("/api/walk")
public class WalkController {

    private final WalkInvitationRepository invitationRepo;
    private final WalkRequestRepository requestRepo;
    private final UserRepository userRepo;
    private final PetRepository petRepo;
    private final MessageRepository messageRepo;
    private final JwtUtil jwtUtil;

    public WalkController(WalkInvitationRepository invitationRepo,
                          WalkRequestRepository requestRepo,
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
        List<WalkInvitation> list = invitationRepo.findByHostUserId(user.getId());
        list.sort(Comparator.comparing(WalkInvitation::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        List<Map<String, Object>> result = list.stream().map(inv -> {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", inv.getId());
            dto.put("hostUserId", inv.getHostUserId());
            dto.put("hostPetIds", inv.getHostPetIds());
            dto.put("route", inv.getRoute());
            dto.put("date", inv.getDate());
            dto.put("time", inv.getTime());
            dto.put("durationMinutes", inv.getDurationMinutes());
            dto.put("maxSpots", inv.getMaxSpots());
            dto.put("message", inv.getMessage());
            dto.put("status", inv.getStatus());
            dto.put("createdAt", inv.getCreatedAt());
            long pending = requestRepo.countByInvitationIdAndStatus(inv.getId(), "PENDING");
            dto.put("pendingRequestCount", pending);
            return dto;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/invitations")
    public ResponseEntity<?> createInvitation(@RequestHeader("Authorization") String auth,
                                              @RequestBody Map<String, Object> body) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        WalkInvitation inv = new WalkInvitation();
        inv.setHostUserId(user.getId());
        if (body.get("hostPetIds") instanceof List<?> ids)
            inv.setHostPetIds(ids.stream().map(Object::toString).toList());
        inv.setRoute((String) body.get("route"));
        if (body.get("latitude") instanceof Number lat) inv.setLatitude(lat.doubleValue());
        if (body.get("longitude") instanceof Number lng) inv.setLongitude(lng.doubleValue());
        inv.setDate((String) body.get("date"));
        inv.setTime((String) body.get("time"));
        inv.setMessage((String) body.get("message"));
        if (body.get("durationMinutes") instanceof Number n) inv.setDurationMinutes(n.intValue());
        if (body.get("maxSpots") instanceof Number n) inv.setMaxSpots(n.intValue());
        inv.setStatus("ACTIVE");
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

        WalkInvitation inv = invitationRepo.findById(id).orElse(null);
        if (inv == null || !inv.getHostUserId().equals(user.getId()))
            return ResponseEntity.status(403).body("Forbidden");

        if (body.containsKey("route")) inv.setRoute((String) body.get("route"));
        if (body.get("latitude") instanceof Number lat) inv.setLatitude(lat.doubleValue());
        if (body.get("longitude") instanceof Number lng) inv.setLongitude(lng.doubleValue());
        if (body.containsKey("date")) inv.setDate((String) body.get("date"));
        if (body.containsKey("time")) inv.setTime((String) body.get("time"));
        if (body.containsKey("message")) inv.setMessage((String) body.get("message"));
        if (body.containsKey("status")) inv.setStatus((String) body.get("status"));
        if (body.get("hostPetIds") instanceof List<?> ids)
            inv.setHostPetIds(ids.stream().map(Object::toString).toList());
        if (body.containsKey("durationMinutes") && body.get("durationMinutes") instanceof Number n)
            inv.setDurationMinutes(n.intValue());
        if (body.containsKey("maxSpots") && body.get("maxSpots") instanceof Number n)
            inv.setMaxSpots(n.intValue());
        inv.setUpdatedAt(LocalDateTime.now());

        return ResponseEntity.ok(invitationRepo.save(inv));
    }

    @DeleteMapping("/invitations/{id}")
    public ResponseEntity<?> deleteInvitation(@RequestHeader("Authorization") String auth,
                                              @PathVariable String id) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        WalkInvitation inv = invitationRepo.findById(id).orElse(null);
        if (inv == null || !inv.getHostUserId().equals(user.getId()))
            return ResponseEntity.status(403).body("Forbidden");

        invitationRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("deleted", id));
    }

    // ── Feed (other users' active invitations) ────────────────────────────────

    @GetMapping("/invitations/feed")
    public ResponseEntity<?> getFeed(@RequestHeader("Authorization") String auth,
                                     @RequestParam(required = false) Double lat,
                                     @RequestParam(required = false) Double lng) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        List<WalkInvitation> others = invitationRepo.findByHostUserIdNotAndStatus(user.getId(), "ACTIVE");
        List<Map<String, Object>> result = new ArrayList<>();

        for (WalkInvitation inv : others) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", inv.getId());
            dto.put("route", inv.getRoute());
            dto.put("date", inv.getDate());
            dto.put("time", inv.getTime());
            dto.put("durationMinutes", inv.getDurationMinutes());
            dto.put("maxSpots", inv.getMaxSpots());
            dto.put("message", inv.getMessage());
            dto.put("latitude", inv.getLatitude());
            dto.put("longitude", inv.getLongitude());

            long accepted = requestRepo.countByInvitationIdAndStatus(inv.getId(), "ACCEPTED");
            dto.put("spotsLeft", Math.max(0, inv.getMaxSpots() - (int) accepted));

            // Owner info
            userRepo.findById(inv.getHostUserId()).ifPresent(owner -> {
                dto.put("ownerId", owner.getId());
                dto.put("ownerName", owner.getName());
                dto.put("ownerAvatarUrl", owner.getAvatarUrl());
            });

            // Pets info — collect all selected pets
            List<Map<String, Object>> petList = new ArrayList<>();
            for (String petId : inv.getHostPetIds()) {
                petRepo.findById(petId).ifPresent(pet -> {
                    Map<String, Object> p = new LinkedHashMap<>();
                    p.put("petId", pet.getId());
                    p.put("petName", pet.getName());
                    p.put("petSpecies", pet.getSpecies());
                    p.put("petBreed", pet.getBreed());
                    p.put("petGender", pet.getGender());
                    p.put("petProfilePhotoUrl", pet.getProfilePhotoUrl());
                    p.put("petIsVaccinated", Boolean.TRUE.equals(pet.getIsVaccinated()));
                    p.put("petIsNeutered", Boolean.TRUE.equals(pet.getIsNeutered()));
                    p.put("petAge", computeAge(pet.getDateOfBirth()));
                    petList.add(p);
                });
            }
            dto.put("pets", petList);
            // Convenience fields from the first pet for backward-compat display
            if (!petList.isEmpty()) {
                Map<String, Object> first = petList.get(0);
                dto.put("petName", first.get("petName"));
                dto.put("petSpecies", first.get("petSpecies"));
                dto.put("petBreed", first.get("petBreed"));
                dto.put("petGender", first.get("petGender"));
                dto.put("petProfilePhotoUrl", first.get("petProfilePhotoUrl"));
                dto.put("petIsVaccinated", first.get("petIsVaccinated"));
                dto.put("petIsNeutered", first.get("petIsNeutered"));
                dto.put("petAge", first.get("petAge"));
            }

            // Distance from user
            if (lat != null && lng != null && inv.getLatitude() != null && inv.getLongitude() != null) {
                double km = haversineKm(lat, lng, inv.getLatitude(), inv.getLongitude());
                dto.put("distanceKm", Math.round(km * 10.0) / 10.0);
                dto.put("distanceLabel", km < 1.0 ? Math.round(km * 1000) + "m" : String.format("%.1fkm", km));
            }

            // Current user's existing request for this invitation (if any)
            WalkRequest userReq = requestRepo.findByInvitationIdAndRequesterUserId(inv.getId(), user.getId());
            if (userReq != null) {
                dto.put("myRequestId", userReq.getId());
                dto.put("myRequestStatus", userReq.getStatus());
                long unread = messageRepo.countByTypeAndWalkInvitationIdAndReceiverIdAndIsRead("WALK", inv.getId(), user.getId(), false);
                dto.put("unreadMessageCount", unread);
            }

            result.add(dto);
        }

        // Sort by distance ascending when user location is available
        if (lat != null && lng != null) {
            result.sort(Comparator.comparingDouble(dto ->
                dto.containsKey("distanceKm")
                    ? ((Number) dto.get("distanceKm")).doubleValue()
                    : Double.MAX_VALUE));
        }

        return ResponseEntity.ok(result);
    }

    // ── Walk Requests ─────────────────────────────────────────────────────────

    @GetMapping("/requests/my-sent-unread")
    public ResponseEntity<?> getMySentUnread(@RequestHeader("Authorization") String auth) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        List<WalkRequest> reqs = requestRepo.findByRequesterUserId(user.getId());
        List<Map<String, Object>> result = reqs.stream().map(req -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("invitationId", req.getInvitationId());
            m.put("requestId", req.getId());
            m.put("status", req.getStatus());
            long unread = messageRepo.countByTypeAndWalkInvitationIdAndReceiverIdAndIsRead("WALK", req.getInvitationId(), user.getId(), false);
            m.put("unreadCount", unread);
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/requests/my-sent")
    public ResponseEntity<?> getMySentRequests(@RequestHeader("Authorization") String auth) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        List<WalkRequest> reqs = requestRepo.findByRequesterUserId(user.getId());
        List<Map<String, Object>> result = reqs.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("invitationId", r.getInvitationId());
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

        WalkInvitation inv = invitationRepo.findById(invitationId).orElse(null);
        if (inv == null) return ResponseEntity.status(404).body("Invitation not found");
        if (inv.getHostUserId().equals(user.getId()))
            return ResponseEntity.badRequest().body("Cannot request your own invitation");
        if (requestRepo.existsByInvitationIdAndRequesterUserId(invitationId, user.getId()))
            return ResponseEntity.badRequest().body("Already sent a request");

        WalkRequest req = new WalkRequest();
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

        WalkRequest req = requestRepo.findById(id).orElse(null);
        if (req == null) return ResponseEntity.status(404).body("Request not found");

        // Only the invitation host may accept/reject
        WalkInvitation inv = invitationRepo.findById(req.getInvitationId()).orElse(null);
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

        List<WalkInvitation> myInvitations = invitationRepo.findByHostUserId(user.getId());
        List<Map<String, Object>> result = new ArrayList<>();

        for (WalkInvitation inv : myInvitations) {
            List<WalkRequest> requests = requestRepo.findByInvitationId(inv.getId());
            for (WalkRequest req : requests) {
                Map<String, Object> dto = new LinkedHashMap<>();
                dto.put("id", req.getId());
                dto.put("type", "walk_request");
                dto.put("direction", "received");
                dto.put("status", req.getStatus());
                dto.put("createdAt", req.getCreatedAt());
                dto.put("message", req.getMessage());
                dto.put("invitationId", inv.getId());
                dto.put("invitationRoute", inv.getRoute());
                dto.put("invitationDate", inv.getDate());
                dto.put("invitationTime", inv.getTime());
                dto.put("invitationDurationMinutes", inv.getDurationMinutes());

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
                        dto.put("requesterPetIsNeutered", Boolean.TRUE.equals(pet.getIsNeutered()));
                    });
                }

                result.add(dto);
            }
        }

        // Also add walk requests sent BY the current user (requester-side view)
        List<WalkRequest> sentRequests = requestRepo.findByRequesterUserId(user.getId());
        for (WalkRequest req : sentRequests) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", req.getId());
            dto.put("type", "walk_request");
            dto.put("direction", "sent");
            dto.put("status", req.getStatus());
            dto.put("createdAt", req.getCreatedAt());
            dto.put("message", req.getMessage());

            invitationRepo.findById(req.getInvitationId()).ifPresent(inv -> {
                dto.put("invitationId", inv.getId());
                dto.put("invitationRoute", inv.getRoute());
                dto.put("invitationDate", inv.getDate());
                dto.put("invitationTime", inv.getTime());
                dto.put("invitationDurationMinutes", inv.getDurationMinutes());

                userRepo.findById(inv.getHostUserId()).ifPresent(host -> {
                    dto.put("hostUserId", host.getId());
                    dto.put("hostName", host.getName());
                    dto.put("hostAvatarUrl", host.getAvatarUrl());
                });
            });

            long unread = messageRepo.countByTypeAndWalkInvitationIdAndReceiverIdAndIsRead("WALK", req.getInvitationId(), user.getId(), false);
            dto.put("unreadMessageCount", unread);

            result.add(dto);
        }

        result.sort(Comparator.comparing(
            dto -> (java.time.LocalDateTime) dto.get("createdAt"),
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
