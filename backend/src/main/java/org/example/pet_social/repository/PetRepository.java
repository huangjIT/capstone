package org.example.pet_social.repository;

import org.example.pet_social.entity.Pet;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PetRepository extends MongoRepository<Pet, String> {
    List<Pet> findByOwnerId(String ownerId);
    List<Pet> findBySpecies(String species);
    List<Pet> findByIsAvailableForPlaydate(Boolean isAvailable);
    List<Pet> findByOwnerIdAndSpecies(String ownerId, String species);
    long countByOwnerId(String ownerId);
}
