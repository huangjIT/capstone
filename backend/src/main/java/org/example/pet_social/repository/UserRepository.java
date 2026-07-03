package org.example.pet_social.repository;

import org.example.pet_social.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    List<User> findByIsActiveTrue();
    Optional<User> findByEmail(String email);
    List<User> findByRole(String role);
}
