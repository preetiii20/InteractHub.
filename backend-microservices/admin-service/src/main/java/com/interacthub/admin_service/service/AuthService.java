package com.interacthub.admin_service.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.interacthub.admin_service.model.Organization;
import com.interacthub.admin_service.model.PasswordResetToken;
import com.interacthub.admin_service.model.User;
import com.interacthub.admin_service.repository.OrganizationRepository;
import com.interacthub.admin_service.repository.PasswordResetTokenRepository;
import com.interacthub.admin_service.repository.UserRepository;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private OrganizationRepository organizationRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Transactional
    public User register(User user) {
        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // Create organization if this is an admin registration
        Long organizationId = null;
        if (user.getRole() == User.Role.ADMIN) {
            // Validate organization name is provided
            String organizationName = user.getPosition(); // Using position field temporarily for org name
            if (organizationName == null || organizationName.trim().isEmpty()) {
                throw new RuntimeException("Organization name is required");
            }
            
            // Check if organization with this admin email already exists
            Optional<Organization> existingOrg = organizationRepository.findByAdminEmail(user.getEmail());
            if (existingOrg.isPresent()) {
                throw new RuntimeException("An organization with this admin email already exists");
            }
            
            // Create new organization with unique data
            Organization organization = new Organization();
            organization.setName(organizationName.trim());
            organization.setAdminEmail(user.getEmail());
            organization.setIsActive(true);
            organization = organizationRepository.save(organization);
            organizationId = organization.getId();
            
            System.out.println("✅ Created new organization: '" + organization.getName() + "' (ID: " + organizationId + ") for admin: " + user.getEmail());
        } else {
            // For non-admin users, assign to default organization if not specified
            organizationId = user.getOrganizationId();
            
            if (organizationId == null) {
                // Assign to default organization (ID: 1)
                organizationId = 1L;
                System.out.println("⚠️ Non-admin user registered without organization, assigning to default organization (ID: 1)");
            }
        }
        
        // Manual field setting uses the fixed getters/setters
        User newUser = new User();
        newUser.setEmail(user.getEmail());
        newUser.setPassword(passwordEncoder.encode(user.getPassword())); // Hash the password
        newUser.setFirstName(user.getFirstName() != null ? user.getFirstName() : "Default");
        newUser.setLastName(user.getLastName() != null ? user.getLastName() : "User");
        newUser.setRole(user.getRole() != null ? user.getRole() : User.Role.EMPLOYEE);
        newUser.setOrganizationId(organizationId); // Correctly assigns the newly created organization ID
        newUser.setIsActive(true);
        newUser.setCreatedBy(user.getCreatedBy());
        
        User savedUser = userRepository.save(newUser);
        System.out.println("✅ Created user: " + savedUser.getEmail() + 
                         " (ID: " + savedUser.getId() + 
                         ") in organization ID: " + savedUser.getOrganizationId() +
                         " with role: " + savedUser.getRole());
        
        return savedUser;
    }
    
    public Map<String, Object> login(String email, String password) {
        try {
            // Simple admin login - create user if doesn't exist
            Optional<User> userOptional = userRepository.findByEmail(email);
            User user;
            
            if (userOptional.isPresent()) {
                user = userOptional.get();
                
                // CRITICAL: Check if user account is active
                if (user.getIsActive() == null || !user.getIsActive()) {
                    throw new RuntimeException("Account has been deactivated. Please contact your administrator.");
                }
                
                // Check password - try both plain text and hashed
                boolean passwordMatch = user.getPassword().equals(password) || 
                                      passwordEncoder.matches(password, user.getPassword());
                if (!passwordMatch) {
                    throw new RuntimeException("Invalid credentials");
                }
            } else {
                // Create admin user automatically
                if ("admin@interacthub.com".equals(email) && "admin123".equals(password)) {
                    user = new User();
                    user.setEmail(email);
                    user.setPassword(password);
                    user.setFirstName("Admin");
                    user.setLastName("User");
                    user.setRole(User.Role.ADMIN);
                    user.setIsActive(true);
                    user.setCreatedBy(1L);
                    user = userRepository.save(user);
                } else {
                    throw new RuntimeException("Invalid credentials");
                }
            }
            
            // Generate simple token (not JWT for now to avoid library conflicts)
            String token = "token-" + System.currentTimeMillis() + "-" + email;
            
            Map<String, Object> response = new HashMap<>();
            response.put("user", user);
            response.put("token", token);
            response.put("message", "Login successful");
            response.put("role", user.getRole().name());
            response.put("organizationId", user.getOrganizationId()); // Include organization ID
            
            System.out.println("✅ Login successful for: " + user.getEmail() + 
                             " (Organization ID: " + user.getOrganizationId() + ")");
            
            return response;
        } catch (Exception e) {
            System.err.println("❌ Login error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Invalid credentials: " + e.getMessage());
        }
    }
    
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    /**
     * Initiate password reset process
     */
    @Transactional
    public void initiatePasswordReset(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (!userOptional.isPresent()) {
            // Don't reveal if email exists or not for security
            System.out.println("⚠️ Password reset requested for non-existent email: " + email);
            return;
        }
        
        // Delete any existing tokens for this email
        passwordResetTokenRepository.deleteByEmail(email);
        
        // Generate new token
        String token = UUID.randomUUID().toString();
        
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setEmail(email);
        resetToken.setToken(token);
        passwordResetTokenRepository.save(resetToken);
        
        // Send email
        emailService.sendPasswordResetEmail(email, token);
        
        System.out.println("✅ Password reset token generated for: " + email);
    }
    
    /**
     * Verify reset token
     */
    public boolean verifyResetToken(String token) {
        Optional<PasswordResetToken> resetTokenOptional = passwordResetTokenRepository.findByToken(token);
        if (!resetTokenOptional.isPresent()) {
            return false;
        }
        
        PasswordResetToken resetToken = resetTokenOptional.get();
        return !resetToken.getUsed() && !resetToken.isExpired();
    }
    
    /**
     * Reset password using token
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        Optional<PasswordResetToken> resetTokenOptional = passwordResetTokenRepository.findByToken(token);
        if (!resetTokenOptional.isPresent()) {
            throw new RuntimeException("Invalid reset token");
        }
        
        PasswordResetToken resetToken = resetTokenOptional.get();
        
        if (resetToken.getUsed()) {
            throw new RuntimeException("Reset token has already been used");
        }
        
        if (resetToken.isExpired()) {
            throw new RuntimeException("Reset token has expired");
        }
        
        // Find user and update password
        Optional<User> userOptional = userRepository.findByEmail(resetToken.getEmail());
        if (!userOptional.isPresent()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOptional.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
        
        // Send confirmation email
        emailService.sendPasswordChangedEmail(user.getEmail());
        
        System.out.println("✅ Password reset successful for: " + user.getEmail());
    }
    
    /**
     * Change password (when user is logged in)
     */
    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (!userOptional.isPresent()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOptional.get();
        
        // Verify current password
        boolean passwordMatch = user.getPassword().equals(currentPassword) || 
                              passwordEncoder.matches(currentPassword, user.getPassword());
        if (!passwordMatch) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // Send confirmation email
        emailService.sendPasswordChangedEmail(user.getEmail());
        
        System.out.println("✅ Password changed successfully for: " + user.getEmail());
    }
}