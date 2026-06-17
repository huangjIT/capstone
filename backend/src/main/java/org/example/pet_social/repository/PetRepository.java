package org.example.pet_social.repository;

import org.example.pet_social.entity.Pet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PetRepository extends JpaRepository<Pet, Long> {

    List<Pet> findByOwner_Id(Long ownerId);

    List<Pet> findBySpecies(String species);

    List<Pet> findByIsAvailableForPlaydate(Boolean isAvailable);

    List<Pet> findByOwner_IdAndSpecies(Long ownerId, String species);
}
