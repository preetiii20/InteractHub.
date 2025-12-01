package com.interacthub.admin_service.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.admin_service.model.User;
import com.interacthub.admin_service.repository.UserRepository;

@RestController
@RequestMapping("/api/admin/test")
@CrossOrigin(origins = "http://localhost:3000")
public class TestController {

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/encode")
    public Map<String, String> encodePassword(@RequestParam String password) {
        Map<String, String> result = new HashMap<>();
        result.put("original", password);
        result.put("encoded", passwordEncoder.encode(password));
        return result;
    }

    @GetMapping("/verify")
    public Map<String, Object> verifyPassword(@RequestParam String rawPassword, @RequestParam String encodedPassword) {
        Map<String, Object> result = new HashMap<>();
        result.put("matches", passwordEncoder.matches(rawPassword, encodedPassword));
        result.put("rawPassword", rawPassword);
        result.put("encodedPassword", encodedPassword);
        return result;
    }
    
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    @GetMapping("/admin-exists")
    public Map<String, Object> checkAdminExists() {
        Map<String, Object> result = new HashMap<>();
        boolean exists = userRepository.existsByEmail("admin@interacthub.com");
        result.put("adminExists", exists);
        if (exists) {
            User admin = userRepository.findByEmail("admin@interacthub.com").orElse(null);
            result.put("adminUser", admin);
        }
        return result;
    }
    
    @PostMapping("/fix-admin-password")
    public Map<String, Object> fixAdminPassword() {
        Map<String, Object> result = new HashMap<>();
        try {
            User admin = userRepository.findByEmail("admin@interacthub.com").orElse(null);
            if (admin != null) {
                admin.setPassword(passwordEncoder.encode("admin123"));
                userRepository.save(admin);
                result.put("success", true);
                result.put("message", "Admin password updated successfully");
            } else {
                result.put("success", false);
                result.put("message", "Admin user not found");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Error: " + e.getMessage());
        }
        return result;
    }
    
    @PostMapping("/debug-login")
    public Map<String, Object> debugLogin(@RequestParam String email, @RequestParam String password) {
        Map<String, Object> result = new HashMap<>();
        try {
            Optional<User> userOptional = userRepository.findByEmail(email);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                boolean passwordMatch = user.getPassword().equals(password);
                result.put("userExists", true);
                result.put("passwordMatch", passwordMatch);
                result.put("storedPassword", user.getPassword());
                result.put("providedPassword", password);
                result.put("user", user);
                result.put("passwordLength", user.getPassword().length());
                result.put("providedLength", password.length());
            } else {
                result.put("userExists", false);
                result.put("message", "User not found");
            }
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        return result;
    }
}
