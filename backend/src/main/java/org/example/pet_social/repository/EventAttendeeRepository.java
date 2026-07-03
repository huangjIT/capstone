package org.example.pet_social.repository;

import org.example.pet_social.entity.EventAttendee;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventAttendeeRepository extends MongoRepository<EventAttendee, String> {
    List<EventAttendee> findByEventId(String eventId);
    List<EventAttendee> findByEventIdAndRsvpStatus(String eventId, String rsvpStatus);
    List<EventAttendee> findByUserId(String userId);
    Optional<EventAttendee> findByEventIdAndUserId(String eventId, String userId);
    Long countByEventIdAndRsvpStatus(String eventId, String rsvpStatus);
}
