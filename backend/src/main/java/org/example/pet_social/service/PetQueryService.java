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
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Read-side queries that power the mobile app's discovery screens.
 * Locations live in Redis (users:geo, written by the telemetry pipeline);
 * pet/owner profiles live in Postgres. This service joins the two and
 * returns DTOs shaped exactly like the frontend interfaces.
 *
 * Redis lookups (positions, online flags) and the Postgres pet fetch are
 * batched per request — one round trip each — instead of per pet/user.
 */
@Service
public class PetQueryService {

    private static final String GEO_KEY = "users:geo";
    private static final String META_PREFIX = "users:meta:";

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

        // Geo hits in result order; one IN-query loads every hit's pets instead of a query per user.
        Map<Long, Point> pointsByUser = new LinkedHashMap<>();
        for (GeoResult<RedisGeoCommands.GeoLocation<String>> result : results) {
            Long userId = parseLong(result.getContent().getName());
            Point point = result.getContent().getPoint();
            if (userId != null && point != null) {
                pointsByUser.putIfAbsent(userId, point);
            }
        }
        if (pointsByUser.isEmpty()) {
            return List.of();
        }

        Map<Long, List<Pet>> petsByOwner = petRepository.findWithOwnerByOwnerIdIn(pointsByUser.keySet())
                .stream().collect(Collectors.groupingBy(Pet::getOwnerId));

        List<NearbyPetResponse> out = new ArrayList<>();
        for (Map.Entry<Long, Point> entry : pointsByUser.entrySet()) {
            Point point = entry.getValue();
            for (Pet pet : petsByOwner.getOrDefault(entry.getKey(), List.of())) {
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
        List<Pet> pets = candidates(requestingUserId, species);
        Set<Long> ownerIds = ownerIds(pets);
        Map<Long, Point> positions = latitude == null || longitude == null
                ? Map.of() : ownerPositions(ownerIds);
        Set<Long> online = onlineOwners(ownerIds);

        List<WalkingPartnerResponse> out = new ArrayList<>();
        for (Pet pet : pets) {
            Double distanceKm = distanceKm(positions.get(pet.getOwnerId()), latitude, longitude);
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
                    online.contains(pet.getOwnerId())
            ));
        }
        return out;
    }

    /** Blind-date swipe deck: same candidate pool, different card shape. */
    public List<BlindDatePetResponse> findBlindDatePets(Long requestingUserId, Double latitude, Double longitude, String species) {
        List<Pet> pets = candidates(requestingUserId, species);
        Map<Long, Point> positions = latitude == null || longitude == null
                ? Map.of() : ownerPositions(ownerIds(pets));

        List<BlindDatePetResponse> out = new ArrayList<>();
        for (Pet pet : pets) {
            Double distanceKm = distanceKm(positions.get(pet.getOwnerId()), latitude, longitude);
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

    private Set<Long> ownerIds(List<Pet> pets) {
        Set<Long> ids = new LinkedHashSet<>();
        for (Pet pet : pets) {
            if (pet.getOwnerId() != null) {
                ids.add(pet.getOwnerId());
            }
        }
        return ids;
    }

    /** Last known Redis positions for a set of owners — one GEOPOS call for all of them. */
    private Map<Long, Point> ownerPositions(Collection<Long> ownerIds) {
        if (ownerIds.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = List.copyOf(ownerIds);
        String[] members = ids.stream().map(String::valueOf).toArray(String[]::new);
        List<Point> points = geoOps.position(GEO_KEY, members);
        if (points == null) {
            return Map.of();
        }
        Map<Long, Point> out = new HashMap<>();
        for (int i = 0; i < ids.size() && i < points.size(); i++) {
            if (points.get(i) != null) {
                out.put(ids.get(i), points.get(i));
            }
        }
        return out;
    }

    /** Owners whose meta hash says active=true — one pipelined HGET batch instead of a call per owner. */
    private Set<Long> onlineOwners(Collection<Long> ownerIds) {
        if (ownerIds.isEmpty()) {
            return Set.of();
        }
        List<Long> ids = List.copyOf(ownerIds);
        // Byte-level commands: the callback receives a plain RedisConnection proxy,
        // not a StringRedisConnection, so string convenience methods aren't available
        List<Object> values = redis.executePipelined((RedisCallback<Object>) connection -> {
            byte[] field = "active".getBytes(StandardCharsets.UTF_8);
            for (Long id : ids) {
                connection.hashCommands().hGet((META_PREFIX + id).getBytes(StandardCharsets.UTF_8), field);
            }
            return null;
        });
        Set<Long> online = new HashSet<>();
        for (int i = 0; i < ids.size() && i < values.size(); i++) {
            if (values.get(i) != null && Boolean.parseBoolean(String.valueOf(values.get(i)))) {
                online.add(ids.get(i));
            }
        }
        return online;
    }

    /** Distance from the requester to an owner's last known position; null when either side is unknown. */
    private Double distanceKm(Point ownerPosition, Double latitude, Double longitude) {
        if (ownerPosition == null || latitude == null || longitude == null) {
            return null;
        }
        return UiFormat.haversineKm(latitude, longitude, ownerPosition.getY(), ownerPosition.getX());
    }

    private Long parseLong(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
