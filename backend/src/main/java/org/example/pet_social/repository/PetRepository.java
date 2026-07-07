package org.example.pet_social.repository;

import org.example.pet_social.entity.Pet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface PetRepository extends JpaRepository<Pet, Long> {

    List<Pet> findByOwner_Id(Long ownerId);

    // Fetch-join variants so DTO mapping can read owner.name without lazy-load surprises
    @Query("SELECT p FROM Pet p JOIN FETCH p.owner WHERE p.owner.id = :ownerId")
    List<Pet> findWithOwnerByOwnerId(@Param("ownerId") Long ownerId);

    @Query("SELECT p FROM Pet p JOIN FETCH p.owner WHERE p.owner.id IN :ownerIds")
    List<Pet> findWithOwnerByOwnerIdIn(@Param("ownerIds") Collection<Long> ownerIds);

    @Query("SELECT p FROM Pet p JOIN FETCH p.owner o " +
           "WHERE p.isAvailableForPlaydate = true AND o.isActive = true AND o.id <> :excludeOwnerId")
    List<Pet> findPlaydateCandidates(@Param("excludeOwnerId") Long excludeOwnerId);

    List<Pet> findBySpecies(String species);

    List<Pet> findByIsAvailableForPlaydate(Boolean isAvailable);

    List<Pet> findByOwner_IdAndSpecies(Long ownerId, String species);
}
