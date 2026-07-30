package org.example.pet_social.controller;

import org.example.pet_social.dto.MatchRequest;
import org.example.pet_social.service.MatchingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * HTTP endpoint for dispatch matching.
 * Keep this controller thin: parse the request body, delegate the decision to
 * MatchingService, and return a stable JSON response shape.
 */
@RestController
@RequestMapping("/api/match")
public class MatchingController {

    private final MatchingService matchingService;

    public MatchingController(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @PostMapping
    public ResponseEntity<Object> findMatch(@RequestBody MatchRequest body) {
        return matchingService.findNearestMatch(body.searchLatitude(), body.searchLongitude(), body.preferencesMask())
                .map(userId -> ResponseEntity.ok(matchedBody(userId)))
                .orElseGet(() -> ResponseEntity.status(404).body(noMatchBody()));
    }

    private Object matchedBody(Long userId) {
        return Map.of("userId", userId);
    }

    private Object noMatchBody() {
        return Map.of("message", "no-match");
    }
}
