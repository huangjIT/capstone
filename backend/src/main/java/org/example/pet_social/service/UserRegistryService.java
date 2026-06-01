package org.example.pet_social.service;

import org.example.pet_social.entity.User;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserRegistryService {

    private final UserService userService; // DB persistence (existing)
    private final StringRedisTemplate redisTemplate;

    private static final String META_PREFIX = "users:meta:";

    public UserRegistryService(UserService userService, StringRedisTemplate redisTemplate) {
        this.userService = userService;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Persist user in DB and write initial metadata to Redis.
     */
    public User registerDriver(User user) {
        User saved = userService.registerDriver(user);

        String metaKey = META_PREFIX + saved.getId();
        long capabilityMask = saved.getCapabilityMask() == null ? 0L : saved.getCapabilityMask();
        Map<String, String> meta = new HashMap<>();
        meta.put("available", String.valueOf(saved.isAvailable()));
        meta.put("capability", String.valueOf(capabilityMask));
        meta.put("lastSeen", String.valueOf(System.currentTimeMillis()));

        redisTemplate.opsForHash().putAll(metaKey, meta);
        redisTemplate.expire(metaKey, Duration.ofHours(6));

        return saved;
    }

    public void updateAvailability(Long userId, boolean available) {
        String metaKey = META_PREFIX + userId;
        redisTemplate.opsForHash().put(metaKey, "available", String.valueOf(available));
    }

    public void updateCapability(Long userId, long capabilityMask) {
        String metaKey = META_PREFIX + userId;
        redisTemplate.opsForHash().put(metaKey, "capability", String.valueOf(capabilityMask));
    }

    public void removeDriverMeta(Long userId) {
        String metaKey = META_PREFIX + userId;
        redisTemplate.delete(metaKey);
    }
}
