package org.example.pet_social.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.example.pet_social.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final Counter matchSuccessCounter;
    private final Counter matchFailedCounter;

    public DashboardService(UserRepository userRepository, MeterRegistry meterRegistry) {
        this.userRepository = userRepository;

        this.matchSuccessCounter = Counter.builder("matching.match.success")
                .description("Number of successful matches")
                .register(meterRegistry);

        this.matchFailedCounter = Counter.builder("matching.match.failed")
                .description("Number of failed matches")
                .register(meterRegistry);

        Gauge.builder("matching.users.total", userRepository, UserRepository::count)
                .description("Total number of users in MongoDB")
                .register(meterRegistry);

        Gauge.builder("matching.users.available", userRepository, r -> r.findByIsActiveTrue().size())
                .description("Number of active users")
                .register(meterRegistry);
    }

    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.findByIsActiveTrue().size();

        metrics.put("users", Map.of("total", totalUsers, "active", activeUsers));
        metrics.put("summary", Map.of("status", "RUNNING", "timestamp", System.currentTimeMillis()));
        return metrics;
    }

    public void incrementMatchSuccess() {
        try { matchSuccessCounter.increment(); } catch (Exception ignored) {}
    }

    public void incrementMatchFailed() {
        try { matchFailedCounter.increment(); } catch (Exception ignored) {}
    }

    public void resetMetrics() {
        // Micrometer counters are not resettable; no-op for demo purposes
    }
}
