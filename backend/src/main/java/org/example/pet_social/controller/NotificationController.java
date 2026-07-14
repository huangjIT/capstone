package org.example.pet_social.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.example.pet_social.dto.NotificationCreateRequest;
import org.example.pet_social.dto.NotificationResponse;
import org.example.pet_social.dto.UiFormat;
import org.example.pet_social.entity.Notification;
import org.example.pet_social.entity.User;
import org.example.pet_social.repository.NotificationRepository;
import org.example.pet_social.service.UserService;
import org.example.pet_social.web.JwtAuthFilter;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserService userService;

    public NotificationController(NotificationRepository notificationRepository, UserService userService) {
        this.notificationRepository = notificationRepository;
        this.userService = userService;
    }

    /** NotificationsScreen feed, newest first. Scoped to the authenticated user. */
    @GetMapping
    public List<NotificationResponse> list(HttpServletRequest request) {
        return notificationRepository.findByRecipient_IdOrderByCreatedAtDesc(authUserId(request)).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Badge count on the tab bar. */
    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(HttpServletRequest request) {
        return Map.of("count", notificationRepository.countByRecipient_IdAndIsReadFalse(authUserId(request)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id, HttpServletRequest request) {
        Long userId = authUserId(request);
        return notificationRepository.findById(id).map(n -> {
            // Only the recipient may mark their own notification read.
            if (!userId.equals(n.getRecipientId())) {
                return ResponseEntity.status(403).<Void>build();
            }
            n.setIsRead(true);
            notificationRepository.save(n);
            return ResponseEntity.noContent().<Void>build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/read-all")
    @Transactional
    public Map<String, Integer> markAllRead(HttpServletRequest request) {
        return Map.of("updated", notificationRepository.markAllRead(authUserId(request)));
    }

    /** Used by other flows (blind-date requests, marketplace interest) to push feed items.
     *  The sender is always the authenticated caller — a client cannot spoof senderId. */
    @PostMapping
    public ResponseEntity<NotificationResponse> create(@Valid @RequestBody NotificationCreateRequest req,
                                                       HttpServletRequest request) {
        User recipient = userService.getUserById(req.recipientId());
        if (recipient == null) {
            return ResponseEntity.badRequest().build();
        }
        Notification n = new Notification(recipient, req.category().toUpperCase(), req.preview());
        User sender = userService.getUserById(authUserId(request));
        if (sender != null) {
            n.setSender(sender);
            n.setSenderName(sender.getName());
        }
        n.setPetName(req.petName());
        n.setPetEmoji(req.petEmoji());
        if (req.relatedType() != null) {
            n.setRelated(req.relatedType().toUpperCase(), req.relatedId());
        }
        return ResponseEntity.ok(toResponse(notificationRepository.save(n)));
    }

    private Long authUserId(HttpServletRequest request) {
        Object attr = request.getAttribute(JwtAuthFilter.AUTH_USER_ID);
        if (attr == null) {
            throw new IllegalStateException("JwtAuthFilter did not run for this request");
        }
        return (Long) attr;
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                String.valueOf(n.getId()),
                UiFormat.notifCategory(n.getCategory()),
                UiFormat.notifEmoji(n.getCategory()),
                n.getSenderName() == null ? "" : n.getSenderName(),
                n.getPetName() == null ? "" : n.getPetName(),
                n.getPetEmoji() == null ? "" : n.getPetEmoji(),
                UiFormat.relativeTime(n.getCreatedAt()),
                n.getPreview(),
                !Boolean.TRUE.equals(n.getIsRead()),
                UiFormat.notifLabel(n.getCategory()),
                n.getRelatedType() == null ? null : n.getRelatedType().toLowerCase(),
                n.getRelatedId(),
                n.getSenderId()
        );
    }
}
