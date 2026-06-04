package org.example.pet_social.repository;

import org.example.pet_social.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring automatically generates the SQL for this just by reading the method name!
    List<User> findByIsAvailableTrue();
}