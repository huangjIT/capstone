package org.example.pet_social.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.pet_social.entity.UserLocation;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class TelemetryProducerService {

    private static final String TOPIC = "user-telemetry";
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    // Spring Boot automatically injects the KafkaTemplate and Jackson ObjectMapper
    public TelemetryProducerService(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void sendLocation(UserLocation location) {
        try {
            // Convert the Java Record into a JSON string
            String payload = objectMapper.writeValueAsString(location);

            // Send to Kafka.
            // IMPORTANT: We use the userId as the Kafka Key. This ensures all pings
            // from the same user go to the exact same Kafka partition, guaranteeing chronological order.
            kafkaTemplate.send(TOPIC, String.valueOf(location.userId()), payload);

        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize location data", e);
        }
    }
}