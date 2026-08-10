package org.example.pet_social.service;

import org.example.pet_social.dto.BlindDatePetResponse;
import org.example.pet_social.dto.NearbyPetResponse;
import org.example.pet_social.dto.UiFormat;
import org.example.pet_social.dto.WalkingPartnerResponse;
import org.example.pet_social.entity.Pet;
import org.example.pet_social.repository.PetRepository;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Read-side queries that power the mobile app's discovery screens.
 * Locations live in Redis (users:geo, written by the telemetry pipeline);
 * pet/owner profiles live in Postgres. This service joins the two and
 * returns DTOs shaped exactly like the frontend interfaces.
 */
@Service
public class PetQueryService {

    private static final String GEO_KEY = "users:geo";
    private static final String PRESENCE_PREFIX = "users:presence:";

    private final PetRepository petRepository;
    private final StringRedisTemplate redis;
    private final GeoOperations<String, String> geoOps;

    public PetQueryService(PetRepository petRepository, StringRedisTemplate redis) {
        this.petRepository = petRepository;
        this.redis = redis;
        this.geoOps = redis.opsForGeo();
    }

    /** Pets around a map viewport — one pin per pet of each user found in the geo index. */
    public List<NearbyPetResponse> findNearbyPets(double latitude, double longitude, double radiusKm, int limit) {
        Circle circle = new Circle(new Point(longitude, latitude), new Distance(radiusKm, Metrics.KILOMETERS));
        RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs
                .newGeoRadiusArgs().includeCoordinates().limit(limit);

        GeoResults<RedisGeoCommands.GeoLocation<String>> results = geoOps.radius(GEO_KEY, circle, args);
        if (results == null) {
            return List.of();
        }

        List<NearbyPetResponse> out = new ArrayList<>();
        for (GeoResult<RedisGeoCommands.GeoLocation<String>> result : results) {
            Long userId = parseLong(result.getContent().getName());
            Point point = result.getContent().getPoint();
            if (userId == null || point == null) {
                continue;
            }
            for (Pet pet : petRepository.findWithOwnerByOwnerId(userId)) {
                out.add(new NearbyPetResponse(
                        String.valueOf(pet.getId()),
                        pet.getName(),
                        UiFormat.petEmoji(pet),
                        pet.getBreed(),
                        point.getY(),   // Redis points are (lon, lat)
                        point.getX(),
                        pet.getOwner().getName()
                ));
            }
        }
        return out;
    }

    /** Walking-partner cards: playdate-available pets of other active users, nearest first when location is known. */
    public List<WalkingPartnerResponse> findWalkingPartners(Long requestingUserId, Double latitude, Double longitude, String species) {
        List<WalkingPartnerResponse> out = new ArrayList<>();
        for (Pet pet : candidates(requestingUserId, species)) {
            Double distanceKm = ownerDistanceKm(pet.getOwnerId(), latitude, longitude);
            out.add(new WalkingPartnerResponse(
                    String.valueOf(pet.getId()),
                    pet.getName(),
                    UiFormat.petEmoji(pet),
                    pet.getBreed(),
                    UiFormat.age(pet.getDateOfBirth()),
                    UiFormat.distanceKm(distanceKm),
                    pet.getPreferredWalkTime() == null ? "" : pet.getPreferredWalkTime(),
                    UiFormat.tags(pet),
                    pet.getRating() == null ? 0.0 : pet.getRating(),
                    UiFormat.speciesLabel(pet.getSpecies()),
                    pet.getOwner().getName(),
                    isOwnerOnline(pet.getOwnerId())
            ));
        }
        return out;
    }

    /** Blind-date swipe deck: same candidate pool, different card shape. */
    public List<BlindDatePetResponse> findBlindDatePets(Long requestingUserId, Double latitude, Double longitude, String species) {
        List<BlindDatePetResponse> out = new ArrayList<>();
        for (Pet pet : candidates(requestingUserId, species)) {
            Double distanceKm = ownerDistanceKm(pet.getOwnerId(), latitude, longitude);
            out.add(new BlindDatePetResponse(
                    String.valueOf(pet.getId()),
                    pet.getName(),
                    UiFormat.petEmoji(pet),
                    pet.getBreed(),
                    UiFormat.age(pet.getDateOfBirth()),
                    UiFormat.capitalize(pet.getGender()),
                    UiFormat.distanceKm(distanceKm),
                    UiFormat.tags(pet),
                    UiFormat.speciesLabel(pet.getSpecies()),
                    Boolean.TRUE.equals(pet.getIsVaccinated())
            ));
        }
        return out;
    }

    private List<Pet> candidates(Long requestingUserId, String species) {
        long exclude = requestingUserId == null ? -1L : requestingUserId;
        List<Pet> pets = petRepository.findPlaydateCandidates(exclude);
        if (species == null || species.isBlank() || "ALL".equalsIgnoreCase(species)) {
            return pets;
        }
        String wanted = species.toUpperCase(Locale.ROOT);
        return pets.stream().filter(p -> wanted.equalsIgnoreCase(p.getSpecies())).toList();
    }

    /** Distance from the requester to a pet owner's last known Redis position; null when either side is unknown. */
    private Double ownerDistanceKm(Long ownerId, Double latitude, Double longitude) {
        if (latitude == null || longitude == null || ownerId == null) {
            return null;
        }
        List<Point> positions = geoOps.position(GEO_KEY, String.valueOf(ownerId));
        if (positions == null || positions.isEmpty() || positions.get(0) == null) {
            return null;
        }
        Point p = positions.get(0);
        return UiFormat.haversineKm(latitude, longitude, p.getY(), p.getX());
    }

    /** Online means "pinged recently" — the presence key expires when telemetry stops.
     *  The profile's `active` flag is a durable setting and never expires, so it can't
     *  answer this question. */
    private boolean isOwnerOnline(Long ownerId) {
        if (ownerId == null) {
            return false;
        }
        return Boolean.TRUE.equals(redis.hasKey(PRESENCE_PREFIX + ownerId));
    }

    private Long parseLong(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
