package org.example.pet_social.service;

import org.example.pet_social.dto.NearbyPetResponse;
import org.example.pet_social.dto.WalkingPartnerResponse;
import org.example.pet_social.entity.Pet;
import org.example.pet_social.entity.User;
import org.example.pet_social.repository.PetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.geo.Circle;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.GeoResult;
import org.springframework.data.geo.GeoResults;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.GeoOperations;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PetQueryServiceTest {

    private PetRepository petRepository;
    private StringRedisTemplate redis;
    private GeoOperations<String, String> geoOps;
    private PetQueryService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        petRepository = mock(PetRepository.class);
        redis = mock(StringRedisTemplate.class);
        geoOps = mock(GeoOperations.class);
        when(redis.opsForGeo()).thenReturn(geoOps);
        service = new PetQueryService(petRepository, redis);
    }

    private static User user(long id, String name) {
        User u = new User(name, name.toLowerCase() + "@x.com", "PET_OWNER", true);
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    private static Pet pet(long id, User owner, String name, String species) {
        Pet p = new Pet(owner, name, species, "Mixed");
        ReflectionTestUtils.setField(p, "id", id);
        return p;
    }

    private static GeoResults<RedisGeoCommands.GeoLocation<String>> geoResults(Object[]... rows) {
        List<GeoResult<RedisGeoCommands.GeoLocation<String>>> results = Arrays.stream(rows)
                .map(r -> new GeoResult<>(
                        new RedisGeoCommands.GeoLocation<>((String) r[0], (Point) r[1]),
                        new Distance(0)))
                .toList();
        return new GeoResults<>(results);
    }

    @Test
    void findNearbyPetsLoadsAllOwnersPetsInOneQuery() {
        when(geoOps.radius(eq("users:geo"), any(Circle.class), any(RedisGeoCommands.GeoRadiusCommandArgs.class)))
                .thenReturn(geoResults(
                        new Object[]{"1", new Point(13.40, 52.52)},
                        new Object[]{"2", new Point(13.41, 52.53)},
                        new Object[]{"not-a-number", new Point(1, 1)}));

        User alice = user(1, "Alice");
        User bob = user(2, "Bob");
        when(petRepository.findWithOwnerByOwnerIdIn(anyCollection())).thenReturn(List.of(
                pet(10, alice, "Rex", "DOG"),
                pet(11, alice, "Tom", "CAT"),
                pet(20, bob, "Coco", "BIRD")));

        List<NearbyPetResponse> out = service.findNearbyPets(52.52, 13.40, 5, 50);

        assertThat(out).hasSize(3);
        assertThat(out.get(0).owner()).isEqualTo("Alice");
        // Redis points are (lon, lat); the DTO carries (lat, lon)
        assertThat(out.get(0).latitude()).isEqualTo(52.52);
        assertThat(out.get(0).longitude()).isEqualTo(13.40);
        // The whole viewport resolves with a single Postgres round trip
        verify(petRepository, times(1)).findWithOwnerByOwnerIdIn(anyCollection());
        verify(petRepository, times(0)).findWithOwnerByOwnerId(anyLong());
    }

    @Test
    void findNearbyPetsReturnsEmptyWhenGeoIndexHasNoHits() {
        when(geoOps.radius(eq("users:geo"), any(Circle.class), any(RedisGeoCommands.GeoRadiusCommandArgs.class)))
                .thenReturn(geoResults());

        assertThat(service.findNearbyPets(52.52, 13.40, 5, 50)).isEmpty();
        verify(petRepository, times(0)).findWithOwnerByOwnerIdIn(anyCollection());
    }

    @Test
    @SuppressWarnings("unchecked")
    void findWalkingPartnersBatchesPositionAndOnlineLookups() {
        User alice = user(1, "Alice");
        User bob = user(2, "Bob");
        when(petRepository.findPlaydateCandidates(9L)).thenReturn(List.of(
                pet(10, alice, "Rex", "DOG"),
                pet(11, alice, "Fido", "DOG"),
                pet(20, bob, "Coco", "CAT")));
        // One GEOPOS for both owners: Alice at ~1.1km east, Bob unknown
        when(geoOps.position(eq("users:geo"), any(String[].class)))
                .thenReturn(Arrays.asList(new Point(13.4212, 52.52), null));
        // One pipelined HGET batch: Alice online, Bob offline
        when(redis.executePipelined(any(RedisCallback.class)))
                .thenReturn(List.<Object>of("true", "false"));

        List<WalkingPartnerResponse> out = service.findWalkingPartners(9L, 52.52, 13.4050, null);

        assertThat(out).hasSize(3);
        assertThat(out.get(0).distance()).isEqualTo("1.1 km");
        assertThat(out.get(0).online()).isTrue();
        assertThat(out.get(2).distance()).isEmpty();
        assertThat(out.get(2).online()).isFalse();
        // Two owners, three pets — still exactly one GEOPOS and one pipeline
        verify(geoOps, times(1)).position(eq("users:geo"), any(String[].class));
        verify(redis, times(1)).executePipelined(any(RedisCallback.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void findWalkingPartnersSkipsGeoLookupWithoutRequesterLocation() {
        User alice = user(1, "Alice");
        when(petRepository.findPlaydateCandidates(-1L)).thenReturn(List.of(pet(10, alice, "Rex", "DOG")));
        when(redis.executePipelined(any(RedisCallback.class))).thenReturn(List.<Object>of("false"));

        List<WalkingPartnerResponse> out = service.findWalkingPartners(null, null, null, null);

        assertThat(out).hasSize(1);
        assertThat(out.get(0).distance()).isEmpty();
        verify(geoOps, times(0)).position(eq("users:geo"), any(String[].class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void speciesFilterNarrowsCandidates() {
        User alice = user(1, "Alice");
        when(petRepository.findPlaydateCandidates(-1L)).thenReturn(List.of(
                pet(10, alice, "Rex", "DOG"),
                pet(11, alice, "Tom", "CAT")));
        when(redis.executePipelined(any(RedisCallback.class))).thenReturn(List.<Object>of("false"));

        List<WalkingPartnerResponse> dogs = service.findWalkingPartners(null, null, null, "dog");
        assertThat(dogs).hasSize(1);
        assertThat(dogs.get(0).name()).isEqualTo("Rex");
    }
}
