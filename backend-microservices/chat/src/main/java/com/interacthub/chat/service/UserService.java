package com.interacthub.chat.service;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

/**
 * Service to fetch user details from admin service
 * Used to get firstName and lastName for notifications
 */
@Service
public class UserService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    private static final String ADMIN_SERVICE_URL = "http://localhost:8081";
    
    /**
     * Fetch user details by email from admin service
     * @param email User email
     * @return Map containing user details (firstName, lastName, etc.)
     */
    public Map<String, Object> getUserByEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        
        try {
            String url = ADMIN_SERVICE_URL + "/api/admin/users/by-email?email=" + email;
            System.out.println("🔍 Fetching user details from: " + url);
            
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null) {
                System.out.println("✅ User found: " + email);
                System.out.println("   firstName: " + response.get("firstName"));
                System.out.println("   lastName: " + response.get("lastName"));
            } else {
                System.out.println("⚠️ User not found: " + email);
            }
            
            return response;
        } catch (RestClientException e) {
            System.err.println("❌ Error fetching user details for " + email + ": " + e.getMessage());
            return null;
        } catch (Exception e) {
            System.err.println("❌ Unexpected error fetching user details: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Get full name from user details
     * @param email User email
     * @return Full name (firstName lastName) or null if not found
     */
    public String getFullName(String email) {
        Map<String, Object> user = getUserByEmail(email);
        if (user != null) {
            String firstName = (String) user.get("firstName");
            String lastName = (String) user.get("lastName");
            
            if (firstName != null && lastName != null) {
                return firstName + " " + lastName;
            }
        }
        return null;
    }
}
