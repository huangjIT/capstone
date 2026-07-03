package org.example.pet_social.service;

import org.example.pet_social.entity.User;
import org.springframework.stereotype.Service;

@Service
public class UserRegistryService {

    private final UserService userService;

    public UserRegistryService(UserService userService) {
        this.userService = userService;
    }

    public User registerUser(User user) {
        return userService.registerUser(user);
    }
}
