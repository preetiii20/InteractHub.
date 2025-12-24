package com.interacthub.admin_service.util;

import org.springframework.stereotype.Component;
import com.interacthub.admin_service.model.User;
import com.interacthub.admin_service.repository.UserRepository;
import java.util.Optional;

@Component
public class OrganizationValidator {
    
    private final UserRepository userRepository;
    
    public OrganizationValidator(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * Get organization ID from user email
     * Returns null if user not found (for backward compatibility)
     */
    public Long getOrganizationIdFromEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        Optional<User> user = userRepository.findByEmail(email);
        return user.map(User::getOrganizationId).orElse(null);
    }
    
    /**
     * Validate that user belongs to organization
     * Returns true if valid, false otherwise
     */
    public boolean validateUserBelongsToOrganization(String userEmail, Long organizationId) {
        if (userEmail == null || organizationId == null) {
            return false;
        }
        Long userOrgId = getOrganizationIdFromEmail(userEmail);
        return userOrgId != null && userOrgId.equals(organizationId);
    }
    
    /**
     * Validate that user can access resource in organization
     * Returns true if valid, false otherwise
     */
    public boolean validateAccess(String userEmail, Long resourceOrgId) {
        if (userEmail == null || resourceOrgId == null) {
            return false;
        }
        Long userOrgId = getOrganizationIdFromEmail(userEmail);
        return userOrgId != null && userOrgId.equals(resourceOrgId);
    }
}
