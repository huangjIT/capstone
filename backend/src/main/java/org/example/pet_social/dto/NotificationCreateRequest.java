package org.example.pet_social.dto;

public record NotificationCreateRequest(
        Long recipientId,
        Long senderId,
        String category,
        String petName,
        String petEmoji,
        String preview
) {}
