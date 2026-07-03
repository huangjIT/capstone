package org.example.pet_social.service;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.data.geo.Circle;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.GeoResult;
import org.springframework.data.geo.GeoResults;
import org.springframework.data.geo.Metrics;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.GeoOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;

/**
 * Walking-partner matching engine (compile-safe first pass).
 * Responsibilities:
 * - search candidates in Redis by radius
 * - load per-user metadata
 * - filter by availability and matching-preferences bitmask
 * - return the nearest valid user
 * We intentionally keep this version simple and readable first.
 * We can optimize metadata batching after the build is green.
 */
@Service
public class MatchingService {

    private static final String GEO_KEY = "users:geo";
    private static final String META_PREFIX = "users:meta:";
    private static final int MAX_CANDIDATES_PER_RADIUS = 100;

    // SLA expansion radii in meters.
    private final List<Double> radiiMeters = List.of(2000.0, 5000.0, 10000.0);

    private final StringRedisTemplate redis;
    private final GeoOperations<String, String> geoOps;
    private final DashboardService dashboardService;
    private final Timer matchingTimer;

    @Autowired
    public MatchingService(StringRedisTemplate redis, DashboardService dashboardService, MeterRegistry meterRegistry) {
        this.redis = redis;
        this.geoOps = redis.opsForGeo();
        this.dashboardService = dashboardService;
        this.matchingTimer = Timer.builder("matching.duration")
                .description("Time to resolve a walking-partner match request")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry);
    }

    public Optional<Long> findNearestMatch(double latitude, double longitude, long requiredPreferencesMask) {
        return matchingTimer.record(() -> findNearestMatchInternal(latitude, longitude, requiredPreferencesMask));
    }

    private Optional<Long> findNearestMatchInternal(double latitude, double longitude, long requiredPreferencesMask) {
        Point point = new Point(longitude, latitude);

        // Sorted nearest-first so the first candidate that passes the filters really is the
        // nearest match, and capped so one request never walks an unbounded geo result set.
        RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs
                .newGeoRadiusArgs().sortAscending().limit(MAX_CANDIDATES_PER_RADIUS);

        for (double radiusMeters : radiiMeters) {
            // Redis geo radius search in kilometers.
            Circle radius = new Circle(point, new Distance(radiusMeters / 1000.0, Metrics.KILOMETERS));

            GeoResults<RedisGeoCommands.GeoLocation<String>> results = geoOps.radius(GEO_KEY, radius, args);

            if (results == null || results.getContent().isEmpty()) {
                continue;
            }

            for (GeoResult<RedisGeoCommands.GeoLocation<String>> geoResult : results.getContent()) {
                String userId = geoResult.getContent().getName();

                // Load runtime metadata for this user from Redis.
                Map<Object, Object> meta = redis.opsForHash().entries(META_PREFIX + userId);
                if (meta == null || meta.isEmpty()) {
                    continue;
                }

                boolean active = Boolean.parseBoolean(String.valueOf(meta.getOrDefault("active", "false")));
                long candidatePreferencesMask = parseLong(meta.get("preferences"));

                // Candidate must be active and satisfy all required preference bits.
                if (active && (candidatePreferencesMask & requiredPreferencesMask) == requiredPreferencesMask) {
                    // Successful match - increment dashboard metric
                    try {
                        dashboardService.incrementMatchSuccess();
                    } catch (Exception ignored) {
                    }
                    return Optional.of(Long.parseLong(userId));
                }
            }
        }

        // No match found across all radii
        try {
            dashboardService.incrementMatchFailed();
        } catch (Exception ignored) {
        }

        return Optional.empty();
    }

    /**
     * Parse a long safely.
     * If the value is missing or malformed, treat it as zero.
     */
    private long parseLong(Object value) {
        if (value == null) {
            return 0L;
        }

        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }
}
