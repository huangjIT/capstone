package org.example.pet_social.controller;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;
import java.util.Map;

@RestController
@RequestMapping("/api/inspector")
public class InspectorController {

    private final StringRedisTemplate redisTemplate;

    public InspectorController(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @GetMapping("/inspect")
    public ResponseEntity<Map<String, Object>> inspect() {
        String telemetryCount = redisTemplate.opsForValue().get("metrics:telemetry:count");
        Long geoCount = 0L;
        try {
            geoCount = redisTemplate.opsForZSet().zCard("users:geo");
        } catch (Exception e) {
            // fallback
            geoCount = 0L;
        }

        long metaKeys = 0L;
        try {
            Set<String> keys = redisTemplate.keys("users:meta:*");
            metaKeys = keys != null ? keys.size() : 0L;
        } catch (Exception e) {
            metaKeys = 0L;
        }

        return ResponseEntity.ok(Map.of(
            "telemetryCount", telemetryCount != null ? Long.parseLong(telemetryCount) : 0L,
            "usersInGeo", geoCount,
            "userMetaKeys", metaKeys
        ));
    }
}

