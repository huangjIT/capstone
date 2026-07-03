package org.example.pet_social.service;

import org.example.pet_social.entity.User;
import org.example.pet_social.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;

    // Constructor Injection (Best practice for Spring Boot)
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User registerUser(User user) {
        // Here is where we would add logic later, like validating email format and role
        return userRepository.save(user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public Map<Long, User> getUsersByIds(Collection<Long> ids) {
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }
}

