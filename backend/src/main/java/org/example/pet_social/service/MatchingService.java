package org.example.pet_social.service;

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
 * Matching engine (compile-safe first pass).
 * Responsibilities:
 * - search candidates in Redis by radius
 * - load per-user metadata
 * - filter by availability and capability bitmask
 * - return the nearest valid user
 * We intentionally keep this version simple and readable first.
 * We can optimize metadata batching after the build is green.
 */
@Service
public class MatchingService {

    private static final String GEO_KEY = "users:geo";
    private static final String META_PREFIX = "users:meta:";

    // SLA expansion radii in meters.
    private final List<Double> radiiMeters = List.of(2000.0, 5000.0, 10000.0);

    private final StringRedisTemplate redis;
    private final GeoOperations<String, String> geoOps;
    private final DashboardService dashboardService;

    @Autowired
    public MatchingService(StringRedisTemplate redis, DashboardService dashboardService) {
        this.redis = redis;
        this.geoOps = redis.opsForGeo();
        this.dashboardService = dashboardService;
    }

    public Optional<Long> findNearestMatch(double latitude, double longitude, long requiredCapabilityMask) {
        Point point = new Point(longitude, latitude);

        for (double radiusMeters : radiiMeters) {
            // Redis geo radius search in kilometers.
            Circle radius = new Circle(point, new Distance(radiusMeters / 1000.0, Metrics.KILOMETERS));

            GeoResults<RedisGeoCommands.GeoLocation<String>> results = geoOps.radius(GEO_KEY, radius);

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

                boolean available = Boolean.parseBoolean(String.valueOf(meta.getOrDefault("available", "false")));
                long capabilityMask = parseLong(meta.get("capability"));

                // Candidate must be available and satisfy all required capability bits.
                if (available && (capabilityMask & requiredCapabilityMask) == requiredCapabilityMask) {
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
