package org.example.pet_social.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MessageSendRequest(
        @NotNull(message = "receiverId is required") Long receiverId,
        @NotBlank(message = "content is required")
        @Size(max = 2000, message = "content must be at most 2000 characters")
        String content,
        @Pattern(regexp = "(?i)MATCH|LISTING", message = "contextType must be MATCH or LISTING (omit for a general DM)")
        String contextType,
        Long contextId
) {}
