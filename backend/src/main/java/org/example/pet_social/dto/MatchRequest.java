package org.example.pet_social.dto;

/**
 * Request payload for dispatch matching.
 * Use delivery coordinates explicitly so the frontend team can wire the
 * "where should this order go?" flow without guessing field names.
 */
public record MatchRequest(
        double deliveryLatitude,
        double deliveryLongitude,
        long capabilitiesMask
) {}

