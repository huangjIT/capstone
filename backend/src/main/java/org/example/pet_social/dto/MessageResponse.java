package org.example.pet_social.dto;

import org.example.pet_social.entity.Message;

/** One chat bubble. `mine` is oriented to the requesting (authenticated) user. */
public record MessageResponse(
        String id,
        Long senderId,
        Long receiverId,
        boolean mine,
        String content,
        String contextType,
        Long contextId,
        boolean read,
        String time
) {
    public static MessageResponse from(Message m, Long viewerUserId) {
        return new MessageResponse(
                String.valueOf(m.getId()),
                m.getSenderId(),
                m.getReceiverId(),
                m.getSenderId().equals(viewerUserId),
                m.getContent(),
                m.getContextType() == null ? null : m.getContextType().toLowerCase(),
                m.getContextId(),
                Boolean.TRUE.equals(m.getIsRead()),
                UiFormat.relativeTime(m.getCreatedAt())
        );
    }
}
