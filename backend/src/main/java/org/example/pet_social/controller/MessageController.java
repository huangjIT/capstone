package org.example.pet_social.controller;

import org.example.pet_social.auth.JwtUtil;
import org.example.pet_social.entity.DateRequest;
import org.example.pet_social.entity.Message;
import org.example.pet_social.entity.User;
import org.example.pet_social.entity.WalkRequest;
import org.example.pet_social.repository.DateRequestRepository;
import org.example.pet_social.repository.MessageRepository;
import org.example.pet_social.repository.UserRepository;
import org.example.pet_social.repository.WalkRequestRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageRepository messageRepo;
    private final UserRepository userRepo;
    private final WalkRequestRepository walkRequestRepo;
    private final DateRequestRepository dateRequestRepo;
    private final JwtUtil jwtUtil;

    public MessageController(MessageRepository messageRepo, UserRepository userRepo,
                             WalkRequestRepository walkRequestRepo, DateRequestRepository dateRequestRepo,
                             JwtUtil jwtUtil) {
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.walkRequestRepo = walkRequestRepo;
        this.dateRequestRepo = dateRequestRepo;
        this.jwtUtil = jwtUtil;
    }

    // Walk-request-scoped conversation (isolated per request)
    @GetMapping("/walk-request/{walkRequestId}")
    public ResponseEntity<?> getWalkRequestMessages(@RequestHeader("Authorization") String auth,
                                                     @PathVariable String walkRequestId) {
        User me = resolveUser(auth);
        if (me == null) return ResponseEntity.status(401).body("Unauthorized");

        List<Message> messages = messageRepo.findByWalkRequestIdOrderByCreatedAtAsc(walkRequestId);

        // Mark incoming as read
        messages.stream()
            .filter(m -> m.getReceiverId().equals(me.getId()) && !Boolean.TRUE.equals(m.getIsRead()))
            .forEach(m -> { m.setIsRead(true); messageRepo.save(m); });

        return ResponseEntity.ok(enrich(messages, me.getId()));
    }

    // Date-request-scoped conversation
    @GetMapping("/date-request/{dateRequestId}")
    public ResponseEntity<?> getDateRequestMessages(@RequestHeader("Authorization") String auth,
                                                     @PathVariable String dateRequestId) {
        User me = resolveUser(auth);
        if (me == null) return ResponseEntity.status(401).body("Unauthorized");

        List<Message> messages = messageRepo.findByDateRequestIdOrderByCreatedAtAsc(dateRequestId);

        messages.stream()
            .filter(m -> m.getReceiverId().equals(me.getId()) && !Boolean.TRUE.equals(m.getIsRead()))
            .forEach(m -> { m.setIsRead(true); messageRepo.save(m); });

        return ResponseEntity.ok(enrich(messages, me.getId()));
    }

    // Unread message counts per business type, for nav/header badges
    @GetMapping("/unread-counts")
    public ResponseEntity<?> getUnreadCounts(@RequestHeader("Authorization") String auth) {
        User me = resolveUser(auth);
        if (me == null) return ResponseEntity.status(401).body("Unauthorized");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("WALK", messageRepo.countByTypeAndReceiverIdAndIsRead("WALK", me.getId(), false));
        result.put("DATE", messageRepo.countByTypeAndReceiverIdAndIsRead("DATE", me.getId(), false));
        result.put("MARKET", messageRepo.countByTypeAndReceiverIdAndIsRead("MARKET", me.getId(), false));
        return ResponseEntity.ok(result);
    }

    // Market-item-scoped conversation between the current user and another user
    @GetMapping("/market-item/{itemId}/{otherUserId}")
    public ResponseEntity<?> getMarketItemMessages(@RequestHeader("Authorization") String auth,
                                                    @PathVariable String itemId,
                                                    @PathVariable String otherUserId) {
        User me = resolveUser(auth);
        if (me == null) return ResponseEntity.status(401).body("Unauthorized");

        List<Message> messages = messageRepo.findByMarketItemIdOrderByCreatedAtAsc(itemId).stream()
            .filter(m -> (m.getSenderId().equals(me.getId()) && m.getReceiverId().equals(otherUserId))
                      || (m.getSenderId().equals(otherUserId) && m.getReceiverId().equals(me.getId())))
            .toList();

        messages.stream()
            .filter(m -> m.getReceiverId().equals(me.getId()) && !Boolean.TRUE.equals(m.getIsRead()))
            .forEach(m -> { m.setIsRead(true); messageRepo.save(m); });

        return ResponseEntity.ok(enrich(messages, me.getId()));
    }

    // General conversation between two users (for other chat contexts)
    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<?> getConversation(@RequestHeader("Authorization") String auth,
                                              @PathVariable String otherUserId) {
        User me = resolveUser(auth);
        if (me == null) return ResponseEntity.status(401).body("Unauthorized");

        List<Message> messages = messageRepo.findConversationSorted(
            me.getId(), otherUserId, Sort.by(Sort.Direction.ASC, "createdAt")
        );

        messages.stream()
            .filter(m -> m.getReceiverId().equals(me.getId()) && !Boolean.TRUE.equals(m.getIsRead()))
            .forEach(m -> { m.setIsRead(true); messageRepo.save(m); });

        return ResponseEntity.ok(enrich(messages, me.getId()));
    }

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestHeader("Authorization") String auth,
                                          @RequestBody Map<String, Object> body) {
        User me = resolveUser(auth);
        if (me == null) return ResponseEntity.status(401).body("Unauthorized");

        String receiverId = (String) body.get("receiverId");
        String content = (String) body.get("content");
        String walkRequestId = (String) body.get("walkRequestId");
        String dateRequestId = (String) body.get("dateRequestId");
        String marketItemId = (String) body.get("marketItemId");

        if (receiverId == null || content == null || content.isBlank())
            return ResponseEntity.badRequest().body("receiverId and content required");

        Message msg = new Message(me.getId(), receiverId, content.trim());

        if (walkRequestId != null) {
            WalkRequest req = walkRequestRepo.findById(walkRequestId).orElse(null);
            if (req != null) {
                if (req.getStatus().equals("REJECTED") || req.getStatus().equals("BLOCKED")) {
                    return ResponseEntity.status(403).body("Conversation is closed");
                }
                msg.setWalkRequestId(walkRequestId);
                msg.setType("WALK");
                msg.setWalkInvitationId(req.getInvitationId());
            }
        } else if (dateRequestId != null) {
            DateRequest req = dateRequestRepo.findById(dateRequestId).orElse(null);
            if (req != null) {
                if (req.getStatus().equals("REJECTED") || req.getStatus().equals("BLOCKED")) {
                    return ResponseEntity.status(403).body("Conversation is closed");
                }
                msg.setDateRequestId(dateRequestId);
                msg.setType("DATE");
                msg.setDateInvitationId(req.getInvitationId());
            }
        } else if (marketItemId != null) {
            msg.setMarketItemId(marketItemId);
            msg.setType("MARKET");
        }
        msg = messageRepo.save(msg);

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", msg.getId());
        dto.put("senderId", msg.getSenderId());
        dto.put("receiverId", msg.getReceiverId());
        dto.put("walkRequestId", msg.getWalkRequestId());
        dto.put("dateRequestId", msg.getDateRequestId());
        dto.put("type", msg.getType());
        dto.put("walkInvitationId", msg.getWalkInvitationId());
        dto.put("dateInvitationId", msg.getDateInvitationId());
        dto.put("content", msg.getContent());
        dto.put("createdAt", msg.getCreatedAt());
        dto.put("isOwn", true);
        dto.put("senderName", me.getName());
        dto.put("senderAvatarUrl", me.getAvatarUrl());
        return ResponseEntity.ok(dto);
    }

    private List<Map<String, Object>> enrich(List<Message> messages, String myId) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Message msg : messages) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", msg.getId());
            dto.put("senderId", msg.getSenderId());
            dto.put("receiverId", msg.getReceiverId());
            dto.put("walkRequestId", msg.getWalkRequestId());
            dto.put("content", msg.getContent());
            dto.put("createdAt", msg.getCreatedAt());
            dto.put("isOwn", msg.getSenderId().equals(myId));
            userRepo.findById(msg.getSenderId()).ifPresent(sender -> {
                dto.put("senderName", sender.getName());
                dto.put("senderAvatarUrl", sender.getAvatarUrl());
            });
            result.add(dto);
        }
        return result;
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.substring(7);
        if (!jwtUtil.isValid(token)) return null;
        String email = jwtUtil.extractEmail(token);
        return userRepo.findByEmail(email).orElse(null);
    }
}
