package org.example.pet_social.repository;

import org.example.pet_social.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends MongoRepository<Event, String> {
    List<Event> findByOrganizerId(String organizerId);
    Page<Event> findByStatus(String status, Pageable pageable);
    List<Event> findByEventType(String eventType);
    List<Event> findByPetSpecies(String petSpecies);
    @Query("{ 'eventDateTime': { $gt: ?0 }, 'status': 'UPCOMING' }")
    List<Event> findUpcomingEvents(LocalDateTime now);
    @Query("{ 'latitude': { $gte: ?0, $lte: ?1 }, 'longitude': { $gte: ?2, $lte: ?3 }, 'status': 'UPCOMING' }")
    List<Event> findNearbyEvents(Double minLat, Double maxLat, Double minLon, Double maxLon);
}
