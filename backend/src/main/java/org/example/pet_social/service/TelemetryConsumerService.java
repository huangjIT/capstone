package org.example.pet_social.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.pet_social.entity.UserLocation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.core.GeoOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class TelemetryConsumerService {

    private static final Logger log = LoggerFactory.getLogger(TelemetryConsumerService.class);

    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;
    private final GeoOperations<String, String> geoOps;
    private final DashboardService dashboardService;

    private static final String GEO_KEY = "users:geo";
    private static final String META_PREFIX = "users:meta:";

    public TelemetryConsumerService(ObjectMapper objectMapper, StringRedisTemplate redisTemplate, DashboardService dashboardService) {
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;
        this.geoOps = redisTemplate.opsForGeo();
        this.dashboardService = dashboardService;
    }

    @KafkaListener(topics = "user-telemetry", groupId = "user-group", concurrency = "3")
    public void consumeTelemetry(String message) {
        try {
            UserLocation loc = objectMapper.readValue(message, UserLocation.class);
            if (loc == null || loc.userId() == null) {
                log.warn("Received invalid telemetry - message={}", message);
                return;
            }

            String member = String.valueOf(loc.userId());
            Point point = new Point(loc.longitude(), loc.latitude()); // Point(x=lon,y=lat)
            geoOps.add(GEO_KEY, point, member);

            processTelemetry(loc);
        } catch (Exception e) {
            log.error("Failed to process telemetry message: {}", message, e);
        }
    }

    // Public method to process telemetry directly (bypass Kafka) - useful for PoC/testing
    public void processTelemetry(UserLocation loc) {
        if (loc == null || loc.userId() == null) {
            log.warn("processTelemetry called with invalid loc={}", loc);
            return;
        }

        try {
            String member = String.valueOf(loc.userId());
            Point point = new Point(loc.longitude(), loc.latitude()); // Point(x=lon,y=lat)
            geoOps.add(GEO_KEY, point, member);

            String metaKey = META_PREFIX + member;
            Map<String, String> meta = new HashMap<>();
            meta.put("lastSeen", String.valueOf(Instant.now().toEpochMilli()));
            meta.put("available", "true");
            redisTemplate.opsForHash().putAll(metaKey, meta);

            // TTL to allow automatic cleanup (optional)
            redisTemplate.expire(metaKey, Duration.ofHours(6));

            log.debug("Processed telemetry (direct) userId={} lat={} lon={}", loc.userId(), loc.latitude(), loc.longitude());

            // Update dashboard telemetry counter
            try {
                dashboardService.incrementTelemetryCount();
            } catch (Exception ignored) {
            }
        } catch (Exception e) {
            log.error("Failed to process telemetry loc: {}", loc, e);
        }
    }
}
