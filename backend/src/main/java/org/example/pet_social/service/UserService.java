package org.example.pet_social.service;

import org.example.pet_social.entity.User;
import org.example.pet_social.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    // Constructor Injection (Best practice for Spring Boot)
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User registerDriver(User user) {
        // Here is where we would add logic later, like validating the vehicle type
        return userRepository.save(user);
    }
}

