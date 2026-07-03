package org.example.pet_social.service;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.geo.Circle;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.GeoResult;
import org.springframework.data.geo.GeoResults;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.GeoOperations;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MatchingServiceTest {

    private GeoOperations<String, String> geoOps;
    private HashOperations<String, Object, Object> hashOps;
    private DashboardService dashboardService;
    private MatchingService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        geoOps = mock(GeoOperations.class);
        hashOps = mock(HashOperations.class);
        when(redis.opsForGeo()).thenReturn(geoOps);
        when(redis.opsForHash()).thenReturn(hashOps);
        dashboardService = mock(DashboardService.class);
        service = new MatchingService(redis, dashboardService, new SimpleMeterRegistry());
    }

    private static GeoResults<RedisGeoCommands.GeoLocation<String>> candidates(String... userIds) {
        List<GeoResult<RedisGeoCommands.GeoLocation<String>>> results = Arrays.stream(userIds)
                .map(id -> new GeoResult<>(
                        new RedisGeoCommands.GeoLocation<>(id, new Point(0, 0)),
                        new Distance(0)))
                .toList();
        return new GeoResults<>(results);
    }

    @Test
    void returnsFirstActiveCandidateSatisfyingPreferenceMask() {
        when(geoOps.radius(eq("users:geo"), any(Circle.class), any(RedisGeoCommands.GeoRadiusCommandArgs.class)))
                .thenReturn(candidates("5", "7", "9"));
        // 5 is inactive, 7 lacks the required bit, 9 qualifies
        when(hashOps.entries("users:meta:5")).thenReturn(Map.of("active", "false", "preferences", "3"));
        when(hashOps.entries("users:meta:7")).thenReturn(Map.of("active", "true", "preferences", "1"));
        when(hashOps.entries("users:meta:9")).thenReturn(Map.of("active", "true", "preferences", "3"));

        assertThat(service.findNearestMatch(52.52, 13.40, 2L)).isEqualTo(Optional.of(9L));
        verify(dashboardService).incrementMatchSuccess();
    }

    @Test
    void skipsCandidatesWithoutMetadata() {
        when(geoOps.radius(eq("users:geo"), any(Circle.class), any(RedisGeoCommands.GeoRadiusCommandArgs.class)))
                .thenReturn(candidates("5"));
        when(hashOps.entries("users:meta:5")).thenReturn(Map.of());

        assertThat(service.findNearestMatch(52.52, 13.40, 0L)).isEmpty();
        verify(dashboardService).incrementMatchFailed();
    }

    @Test
    void reportsFailureWhenAllRadiiAreEmpty() {
        when(geoOps.radius(eq("users:geo"), any(Circle.class), any(RedisGeoCommands.GeoRadiusCommandArgs.class)))
                .thenReturn(candidates());

        assertThat(service.findNearestMatch(52.52, 13.40, 1L)).isEmpty();
        verify(dashboardService).incrementMatchFailed();
    }

    @Test
    void malformedPreferencesCountAsZeroMask() {
        when(geoOps.radius(eq("users:geo"), any(Circle.class), any(RedisGeoCommands.GeoRadiusCommandArgs.class)))
                .thenReturn(candidates("5"));
        when(hashOps.entries("users:meta:5")).thenReturn(Map.of("active", "true", "preferences", "garbage"));

        // Zero mask requirement is satisfied by anything, including a malformed value
        assertThat(service.findNearestMatch(52.52, 13.40, 0L)).isEqualTo(Optional.of(5L));
        // But a real requirement is not
        assertThat(service.findNearestMatch(52.52, 13.40, 1L)).isEmpty();
    }
}
