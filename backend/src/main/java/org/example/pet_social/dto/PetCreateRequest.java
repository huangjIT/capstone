package org.example.pet_social.dto;

import java.time.LocalDate;
import java.util.List;

public record PetCreateRequest(
        Long ownerId,
        String name,
        String species,
        String breed,
        String gender,
        LocalDate dateOfBirth,
        String bio,
        String avatarEmoji,
        List<String> personalityTags,
        Boolean vaccinated,
        Boolean neutered,
        Boolean availableForPlaydate,
        String preferredWalkTime
) {}
