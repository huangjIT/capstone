package org.example.pet_social.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.example.pet_social.entity.UserLocation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.core.GeoOperations;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class TelemetryConsumerService {

    private static final Logger log = LoggerFactory.getLogger(TelemetryConsumerService.class);

    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;
    private final GeoOperations<String, String> geoOps;
    private final DashboardService dashboardService;
    private final Timer processingTimer;
    private final Timer deserializeTimer;
    private final Timer redisPipelineTimer;
    private final AtomicInteger pipelineInFlight = new AtomicInteger(0);
    // Tracks distinct @KafkaListener thread names actually seen processing a message -
    // proves how much real parallelism the consumer side achieves, independent of the
    // configured `concurrency` value (which only requests threads; partitions cap how many get used).
    private final Set<String> consumerThreadsSeen = ConcurrentHashMap.newKeySet();

    private static final String GEO_KEY = "users:geo";
    private static final String META_PREFIX = "users:meta:";

    public TelemetryConsumerService(ObjectMapper objectMapper, StringRedisTemplate redisTemplate, DashboardService dashboardService, MeterRegistry meterRegistry) {
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;
        this.geoOps = redisTemplate.opsForGeo();
        this.dashboardService = dashboardService;
        this.processingTimer = Timer.builder("telemetry.processing.duration")
                .description("Time to write a telemetry record into the Redis geo index + metadata")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry);
        this.deserializeTimer = Timer.builder("telemetry.deserialize.duration")
                .description("Time to parse the Kafka message JSON into a UserLocation")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry);
        this.redisPipelineTimer = Timer.builder("telemetry.redis.pipeline.duration")
                .description("Time spent inside executePipelined() for one Kafka batch (one or more telemetry records)")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry);
        Gauge.builder("telemetry.redis.pipeline.inflight", pipelineInFlight, AtomicInteger::get)
                .description("Number of threads currently blocked inside the Redis pipeline call - pegged near concurrency means connection contention")
                .register(meterRegistry);
        Gauge.builder("telemetry.kafka.consumer.distinct.threads", consumerThreadsSeen, Set::size)
                .description("Distinct @KafkaListener thread names that have processed at least one message - the real achieved parallelism, vs the requested 'concurrency' value")
                .register(meterRegistry);
    }

    // Batch listener. Concurrency must not exceed the topic's partition count (extra threads
    // sit idle — proven in the 2026-06-16 session when the topic had 1 auto-created partition).
    // KafkaTopicConfig now declares user-telemetry with app.kafka.telemetry-partitions (default 3),
    // so the same property drives both sides and they can't drift apart.
    @KafkaListener(topics = "user-telemetry", groupId = "user-group",
            concurrency = "${app.kafka.telemetry-partitions:3}")
    public void consumeTelemetryBatch(List<String> messages) {
        consumerThreadsSeen.add(Thread.currentThread().getName());

        List<UserLocation> locations = new ArrayList<>(messages.size());
        for (String message : messages) {
            try {
                UserLocation loc = deserializeTimer.record(() -> {
                    try {
                        return objectMapper.readValue(message, UserLocation.class);
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                });
                if (loc == null || loc.userId() == null) {
                    log.warn("Received invalid telemetry - message={}", message);
                    continue;
                }
                locations.add(loc);
            } catch (Exception e) {
                log.error("Failed to parse telemetry message: {}", message, e);
            }
        }

        if (locations.isEmpty()) {
            return;
        }

        processingTimer.record(() -> processBatchInternal(locations));
    }

    // Public method to process telemetry directly (bypass Kafka) - useful for PoC/testing
    public void processTelemetry(UserLocation loc) {
        if (loc == null || loc.userId() == null) {
            log.warn("processTelemetry called with invalid loc={}", loc);
            return;
        }

        processingTimer.record(() -> processTelemetryInternal(loc));
    }

    private void processTelemetryInternal(UserLocation loc) {
        try {
            String member = String.valueOf(loc.userId());
            Point point = new Point(loc.longitude(), loc.latitude()); // Point(x=lon,y=lat)

            String metaKey = META_PREFIX + member;
            Map<String, String> meta = new HashMap<>();
            meta.put("lastSeen", String.valueOf(Instant.now().toEpochMilli()));
            meta.put("available", "true");

            // Batch GEOADD + HSET + EXPIRE + INCR into a single round-trip instead of 4 separate ones.
            pipelineInFlight.incrementAndGet();
            try {
                redisPipelineTimer.record(() -> redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
                    geoOps.add(GEO_KEY, point, member);
                    redisTemplate.opsForHash().putAll(metaKey, meta);
                    redisTemplate.expire(metaKey, Duration.ofHours(6));
                    redisTemplate.opsForValue().increment(DashboardService.TELEMETRY_COUNT_KEY);
                    return null;
                }));
            } finally {
                pipelineInFlight.decrementAndGet();
            }

            log.debug("Processed telemetry (direct) userId={} lat={} lon={}", loc.userId(), loc.latitude(), loc.longitude());

            dashboardService.recordTelemetryProcessed();
        } catch (Exception e) {
            log.error("Failed to process telemetry loc: {}", loc, e);
        }
    }

    // One Redis pipeline for the whole Kafka batch instead of one per record - amortizes the
    // round-trip cost across the batch, since a single partition caps us to one consumer thread anyway.
    private void processBatchInternal(List<UserLocation> locations) {
        try {
            pipelineInFlight.incrementAndGet();
            try {
                redisPipelineTimer.record(() -> redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
                    for (UserLocation loc : locations) {
                        String member = String.valueOf(loc.userId());
                        Point point = new Point(loc.longitude(), loc.latitude()); // Point(x=lon,y=lat)
                        geoOps.add(GEO_KEY, point, member);

                        String metaKey = META_PREFIX + member;
                        Map<String, String> meta = new HashMap<>();
                        meta.put("lastSeen", String.valueOf(Instant.now().toEpochMilli()));
                        meta.put("available", "true");
                        redisTemplate.opsForHash().putAll(metaKey, meta);
                        redisTemplate.expire(metaKey, Duration.ofHours(6));
                    }
                    redisTemplate.opsForValue().increment(DashboardService.TELEMETRY_COUNT_KEY, locations.size());
                    return null;
                }));
            } finally {
                pipelineInFlight.decrementAndGet();
            }

            log.debug("Processed telemetry batch of {} records", locations.size());

            for (int i = 0; i < locations.size(); i++) {
                dashboardService.recordTelemetryProcessed();
            }
        } catch (Exception e) {
            log.error("Failed to process telemetry batch of size {}", locations.size(), e);
        }
    }
}
