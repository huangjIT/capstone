package org.example.pet_social.repository;

import org.example.pet_social.entity.PetMatch;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PetMatchRepository extends MongoRepository<PetMatch, String> {
    @Query("{ $or: [{ 'petId1': ?0 }, { 'petId2': ?0 }] }")
    List<PetMatch> findMatchesForPet(String petId);

    @Query("{ $or: [{ 'petId1': ?0 }, { 'petId2': ?0 }], 'matchStatus': ?1 }")
    List<PetMatch> findMatchesForPetByStatus(String petId, String status);

    @Query("{ $or: [{ 'petId1': ?0, 'petId2': ?1 }, { 'petId1': ?1, 'petId2': ?0 }] }")
    Optional<PetMatch> findMatchBetweenPets(String petId1, String petId2);

    List<PetMatch> findByInitiatedByUserIdAndMatchStatus(String initiatedByUserId, String matchStatus);
    List<PetMatch> findByMatchType(String matchType);
}
