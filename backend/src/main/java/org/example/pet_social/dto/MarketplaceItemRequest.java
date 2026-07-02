package org.example.pet_social.dto;

public record MarketplaceItemRequest(
        Long sellerId,
        String name,
        String emoji,
        Double price,
        Double originalPrice,
        String condition,
        String category,
        String description
) {}
