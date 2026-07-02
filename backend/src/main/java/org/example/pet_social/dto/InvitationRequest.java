package org.example.pet_social.dto;

import java.time.LocalDateTime;

/** Create/update body for a walk invitation (stored as a WALK-type Event). */
public record InvitationRequest(
        Long organizerId,
        String route,
        LocalDateTime dateTime,
        Integer totalSpots,
        String emoji,
        String description,
        Double latitude,
        Double longitude
) {}
