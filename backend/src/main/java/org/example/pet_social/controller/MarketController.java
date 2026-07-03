package org.example.pet_social.controller;

import org.example.pet_social.auth.JwtUtil;
import org.example.pet_social.entity.*;
import org.example.pet_social.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/market")
public class MarketController {

    private final MarketItemRepository itemRepo;
    private final UserRepository userRepo;
    private final MessageRepository messageRepo;
    private final JwtUtil jwtUtil;

    public MarketController(MarketItemRepository itemRepo,
                            UserRepository userRepo,
                            MessageRepository messageRepo,
                            JwtUtil jwtUtil) {
        this.itemRepo = itemRepo;
        this.userRepo = userRepo;
        this.messageRepo = messageRepo;
        this.jwtUtil = jwtUtil;
    }

    // ── Items feed (other users' active items) ────────────────────────────────

    @GetMapping("/items")
    public ResponseEntity<?> getFeed(@RequestHeader("Authorization") String auth,
                                     @RequestParam(required = false) String category) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        List<MarketItem> items = (category != null && !category.isBlank() && !category.equalsIgnoreCase("All"))
            ? itemRepo.findBySellerUserIdNotAndStatusAndCategory(user.getId(), "ACTIVE", category.toUpperCase())
            : itemRepo.findBySellerUserIdNotAndStatus(user.getId(), "ACTIVE");

        items.sort(Comparator.comparing(MarketItem::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));

        List<Map<String, Object>> result = items.stream().map(item -> {
            Map<String, Object> dto = toDto(item);
            userRepo.findById(item.getSellerUserId()).ifPresent(seller -> {
                dto.put("sellerName", seller.getName());
                dto.put("sellerAvatarUrl", seller.getAvatarUrl());
            });
            long unread = messageRepo.countByTypeAndMarketItemIdAndReceiverIdAndIsRead(
                "MARKET", item.getId(), user.getId(), false);
            dto.put("unreadMessageCount", unread);
            return dto;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // ── My items ──────────────────────────────────────────────────────────────

    @GetMapping("/items/my")
    public ResponseEntity<?> getMyItems(@RequestHeader("Authorization") String auth) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        List<MarketItem> items = itemRepo.findBySellerUserId(user.getId());
        items.sort(Comparator.comparing(MarketItem::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));

        List<Map<String, Object>> result = items.stream().map(item -> {
            Map<String, Object> dto = toDto(item);
            long unread = messageRepo.countByTypeAndMarketItemIdAndReceiverIdAndIsRead(
                "MARKET", item.getId(), user.getId(), false);
            dto.put("unreadMessageCount", unread);
            return dto;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping("/items")
    public ResponseEntity<?> createItem(@RequestHeader("Authorization") String auth,
                                        @RequestBody Map<String, Object> body) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        String name = (String) body.get("name");
        if (name == null || name.isBlank()) return ResponseEntity.badRequest().body("name required");

        MarketItem item = new MarketItem();
        item.setSellerUserId(user.getId());
        item.setName(name.trim());
        item.setDescription((String) body.get("description"));
        item.setCategory(body.get("category") instanceof String c ? c.toUpperCase() : "OTHER");
        item.setCondition(body.get("condition") instanceof String c ? c : "GOOD");
        if (body.get("price") instanceof Number n) item.setPrice(n.doubleValue());
        if (body.get("originalPrice") instanceof Number n) item.setOriginalPrice(n.doubleValue());
        item.setPhotoUrl((String) body.get("photoUrl"));
        item.setLocation((String) body.get("location"));
        if (body.get("latitude") instanceof Number n) item.setLatitude(n.doubleValue());
        if (body.get("longitude") instanceof Number n) item.setLongitude(n.doubleValue());
        item.setStatus("ACTIVE");
        item.setCreatedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());

        return ResponseEntity.ok(itemRepo.save(item));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<?> updateItem(@RequestHeader("Authorization") String auth,
                                        @PathVariable String id,
                                        @RequestBody Map<String, Object> body) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        MarketItem item = itemRepo.findById(id).orElse(null);
        if (item == null || !item.getSellerUserId().equals(user.getId()))
            return ResponseEntity.status(403).body("Forbidden");

        if (body.get("name") instanceof String s && !s.isBlank()) item.setName(s.trim());
        if (body.containsKey("description")) item.setDescription((String) body.get("description"));
        if (body.get("category") instanceof String c) item.setCategory(c.toUpperCase());
        if (body.get("condition") instanceof String c) item.setCondition(c);
        if (body.get("price") instanceof Number n) item.setPrice(n.doubleValue());
        if (body.get("originalPrice") instanceof Number n) item.setOriginalPrice(n.doubleValue());
        if (body.containsKey("photoUrl")) item.setPhotoUrl((String) body.get("photoUrl"));
        if (body.containsKey("location")) item.setLocation((String) body.get("location"));
        if (body.get("latitude") instanceof Number n) item.setLatitude(n.doubleValue());
        if (body.get("longitude") instanceof Number n) item.setLongitude(n.doubleValue());
        if (body.get("status") instanceof String s) item.setStatus(s);
        item.setUpdatedAt(LocalDateTime.now());

        return ResponseEntity.ok(itemRepo.save(item));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<?> deleteItem(@RequestHeader("Authorization") String auth,
                                        @PathVariable String id) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        MarketItem item = itemRepo.findById(id).orElse(null);
        if (item == null || !item.getSellerUserId().equals(user.getId()))
            return ResponseEntity.status(403).body("Forbidden");

        itemRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("deleted", id));
    }

    // ── Chats (conversations grouped per item + other user) ──────────────────

    @GetMapping("/chats")
    public ResponseEntity<?> getChats(@RequestHeader("Authorization") String auth) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        // All MARKET messages where the current user is sender or receiver
        List<Message> mine = new ArrayList<>();
        mine.addAll(messageRepo.findBySenderId(user.getId()));
        mine.addAll(messageRepo.findByReceiverId(user.getId()));

        // Group by (itemId, otherUserId), keep the latest message per conversation
        Map<String, Message> latest = new LinkedHashMap<>();
        for (Message m : mine) {
            if (!"MARKET".equals(m.getType()) || m.getMarketItemId() == null) continue;
            String other = m.getSenderId().equals(user.getId()) ? m.getReceiverId() : m.getSenderId();
            String key = m.getMarketItemId() + "|" + other;
            Message cur = latest.get(key);
            if (cur == null || (m.getCreatedAt() != null && cur.getCreatedAt() != null
                    && m.getCreatedAt().isAfter(cur.getCreatedAt()))) {
                latest.put(key, m);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, Message> e : latest.entrySet()) {
            Message m = e.getValue();
            String otherUserId = m.getSenderId().equals(user.getId()) ? m.getReceiverId() : m.getSenderId();

            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("itemId", m.getMarketItemId());
            dto.put("otherUserId", otherUserId);
            dto.put("lastMessage", m.getContent());
            dto.put("lastMessageAt", m.getCreatedAt());
            dto.put("lastMessageIsOwn", m.getSenderId().equals(user.getId()));

            userRepo.findById(otherUserId).ifPresent(other -> {
                dto.put("otherUserName", other.getName());
                dto.put("otherUserAvatarUrl", other.getAvatarUrl());
            });

            itemRepo.findById(m.getMarketItemId()).ifPresent(item -> {
                dto.put("itemName", item.getName());
                dto.put("itemPhotoUrl", item.getPhotoUrl());
                dto.put("itemPrice", item.getPrice());
                dto.put("itemStatus", item.getStatus());
                dto.put("isSeller", item.getSellerUserId().equals(user.getId()));
            });

            // Unread from this specific conversation
            long unread = messageRepo.findByMarketItemIdOrderByCreatedAtAsc(m.getMarketItemId()).stream()
                .filter(msg -> msg.getReceiverId().equals(user.getId())
                        && msg.getSenderId().equals(otherUserId)
                        && !Boolean.TRUE.equals(msg.getIsRead()))
                .count();
            dto.put("unreadCount", unread);

            result.add(dto);
        }

        result.sort(Comparator.comparing(
            dto -> (LocalDateTime) dto.get("lastMessageAt"),
            Comparator.nullsLast(Comparator.reverseOrder())
        ));

        return ResponseEntity.ok(result);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> toDto(MarketItem item) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", item.getId());
        dto.put("sellerUserId", item.getSellerUserId());
        dto.put("name", item.getName());
        dto.put("description", item.getDescription());
        dto.put("category", item.getCategory());
        dto.put("price", item.getPrice());
        dto.put("originalPrice", item.getOriginalPrice());
        dto.put("condition", item.getCondition());
        dto.put("photoUrl", item.getPhotoUrl());
        dto.put("location", item.getLocation());
        dto.put("status", item.getStatus());
        dto.put("createdAt", item.getCreatedAt());
        return dto;
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.substring(7);
        if (!jwtUtil.isValid(token)) return null;
        String email = jwtUtil.extractEmail(token);
        return userRepo.findByEmail(email).orElse(null);
    }
}
