package org.example.pet_social.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.example.pet_social.dto.ConversationResponse;
import org.example.pet_social.dto.MessageResponse;
import org.example.pet_social.dto.MessageSendRequest;
import org.example.pet_social.dto.UiFormat;
import org.example.pet_social.entity.Message;
import org.example.pet_social.entity.Notification;
import org.example.pet_social.entity.User;
import org.example.pet_social.repository.MessageRepository;
import org.example.pet_social.repository.NotificationRepository;
import org.example.pet_social.service.UserService;
import org.example.pet_social.web.JwtAuthFilter;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Chat threads (walk request, blind date, marketplace, general DM) over the
 * messages table. Requires a Bearer token; the sender is always the
 * authenticated user. Threads are scoped by (other user, contextType, contextId).
 */
@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageRepository messageRepository;
    private final NotificationRepository notificationRepository;
    private final UserService userService;

    public MessageController(MessageRepository messageRepository,
                             NotificationRepository notificationRepository,
                             UserService userService) {
        this.messageRepository = messageRepository;
        this.notificationRepository = notificationRepository;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<Object> send(@Valid @RequestBody MessageSendRequest req, HttpServletRequest request) {
        Long userId = authUserId(request);
        User sender = userService.getUserById(userId);
        User receiver = userService.getUserById(req.receiverId());
        if (receiver == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "receiver not found"));
        }
        if (receiver.getId().equals(userId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "cannot message yourself"));
        }
        Message message = new Message(sender, receiver, req.content());
        if (req.contextType() != null && !req.contextType().isBlank()) {
            message.setContextType(req.contextType().toUpperCase(Locale.ROOT));
            message.setContextId(req.contextId());
        }
        messageRepository.save(message);

        Notification n = new Notification(receiver, "MESSAGE", truncate(req.content(), 200));
        n.setSender(sender);
        n.setSenderName(sender.getName());
        n.setRelated("MESSAGE", message.getId());
        notificationRepository.save(n);

        return ResponseEntity.ok(MessageResponse.from(message, userId));
    }

    /** Full thread with one user (optionally scoped to a match/listing), oldest first. */
    @GetMapping("/thread")
    public List<MessageResponse> thread(@RequestParam Long otherUserId,
                                        @RequestParam(required = false) String contextType,
                                        @RequestParam(required = false) Long contextId,
                                        HttpServletRequest request) {
        Long userId = authUserId(request);
        String normalizedType = contextType == null || contextType.isBlank()
                ? null : contextType.toUpperCase(Locale.ROOT);
        return messageRepository.findThread(userId, otherUserId, normalizedType, contextId).stream()
                .map(m -> MessageResponse.from(m, userId))
                .toList();
    }

    /** Inbox: latest message per conversation partner. */
    @GetMapping("/conversations")
    public List<ConversationResponse> conversations(HttpServletRequest request) {
        Long userId = authUserId(request);
        return messageRepository.findRecentConversations(userId).stream()
                .map(m -> {
                    boolean mine = m.getSenderId().equals(userId);
                    User other = mine ? m.getReceiver() : m.getSender();
                    return new ConversationResponse(
                            other.getId(),
                            other.getName(),
                            m.getContent(),
                            UiFormat.relativeTime(m.getCreatedAt()),
                            mine,
                            !mine && !Boolean.TRUE.equals(m.getIsRead()),
                            m.getContextType() == null ? null : m.getContextType().toLowerCase(Locale.ROOT),
                            m.getContextId()
                    );
                })
                .toList();
    }

    @PutMapping("/read")
    @Transactional
    public Map<String, Integer> markThreadRead(@RequestParam Long otherUserId, HttpServletRequest request) {
        return Map.of("updated", messageRepository.markThreadRead(authUserId(request), otherUserId));
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(HttpServletRequest request) {
        return Map.of("count", messageRepository.countByReceiver_IdAndIsRead(authUserId(request), false));
    }

    private String truncate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max - 1) + "…";
    }

    private Long authUserId(HttpServletRequest request) {
        Object attr = request.getAttribute(JwtAuthFilter.AUTH_USER_ID);
        if (attr == null) {
            throw new IllegalStateException("JwtAuthFilter did not run for this request");
        }
        return (Long) attr;
    }
}
