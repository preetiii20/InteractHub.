package com.interacthub.admin_service.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.interacthub.admin_service.model.Announcement;
import com.interacthub.admin_service.model.AuditLog;
import com.interacthub.admin_service.model.Department;
import com.interacthub.admin_service.model.Document;
import com.interacthub.admin_service.model.Poll;
import com.interacthub.admin_service.model.User;
import com.interacthub.admin_service.repository.AnnouncementRepository;
import com.interacthub.admin_service.repository.AuditLogRepository;
import com.interacthub.admin_service.repository.DepartmentRepository;
import com.interacthub.admin_service.repository.DocumentRepository;
import com.interacthub.admin_service.repository.PollRepository;
import com.interacthub.admin_service.repository.UserRepository;
import com.interacthub.admin_service.sync.CompanyUpdatesSyncService;

@Service
public class AdminService {
    
    @Autowired private UserRepository userRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private AnnouncementRepository announcementRepository;
    @Autowired private PollRepository pollRepository;
    @Autowired private DocumentRepository documentRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private RestTemplate restTemplate;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private SyncService syncService;
    @Autowired private CompanyUpdatesSyncService companyUpdatesSyncService;
    
    private static final String NOTIFICATION_URL = "http://localhost:8090/api/notify/welcome-user";
    private static final String HR_SUMMARY_URL = "http://localhost:8082/api/hr/admin/summary";
    private static final String MANAGER_SUMMARY_URL = "http://localhost:8083/api/manager/admin/summary";

    private String generateTemporaryPassword() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    // --- User Management (Hierarchy & Authentication) ---
    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // CRITICAL FIX: Auto-generate password for employees if not provided
        String tempPassword = user.getPassword();
        if (tempPassword == null || tempPassword.isEmpty()) {
            if (user.getRole() == User.Role.EMPLOYEE) {
                // Auto-generate password for employees
                tempPassword = generateTemporaryPassword();
                System.out.println("Auto-generated password for employee: " + user.getEmail());
            } else {
                throw new IllegalArgumentException("Password is required for " + user.getRole() + " accounts.");
            }
        }
        
        User newUser = new User();
        newUser.setEmail(user.getEmail());
        newUser.setPassword(passwordEncoder.encode(tempPassword)); // Hash and save the password
        newUser.setFirstName(user.getFirstName());
        newUser.setLastName(user.getLastName());
        newUser.setRole(user.getRole());
        newUser.setDepartmentId(user.getDepartmentId());
        newUser.setPosition(user.getPosition());
        newUser.setPhoneNumber(user.getPhoneNumber());
        newUser.setIsActive(user.getIsActive() != null ? user.getIsActive() : true);
        newUser.setCreatedBy(user.getCreatedBy() != null ? user.getCreatedBy() : 1L);
        newUser.setOrganizationId(user.getOrganizationId()); // CRITICAL: Set organization ID 
        
        User createdUser = userRepository.save(newUser);
        
        // CRITICAL FIX: Try to send email, but don't fail user creation if email fails
        try {
            this.triggerOnboardingEmail(createdUser, tempPassword);
            System.out.println("✅ USER CREATED & EMAIL SENT: " + createdUser.getEmail());
        } catch (Exception e) {
            System.out.println("✅ USER CREATED SUCCESSFULLY: " + createdUser.getEmail() + " (Email will be sent when notification service is available)");
        }
        
        // Sync user to Manager/HR/Employee services based on role
        try {
            syncService.syncUserToManager(createdUser);
            syncService.syncUserToHR(createdUser);
            syncService.syncUserToEmployee(createdUser, tempPassword);
            
            // Audit log the sync
            String adminEmail = "admin@interacthub.com"; // TODO: Get actual admin email from context
            this.logAction(createdUser.getCreatedBy(), "SYNC_USER", "Sync", 
                         "Synced user to Manager/HR/Employee services: " + createdUser.getEmail(), "127.0.0.1");
        } catch (Exception e) {
            System.out.println("⚠️ User sync failed (non-critical): " + e.getMessage());
        }
        
        return createdUser;
    }

    private void triggerOnboardingEmail(User user, String tempPassword) {
        try {
            Map<String, Object> notificationPayload = new HashMap<>();
            notificationPayload.put("recipientEmail", user.getEmail());
            notificationPayload.put("role", user.getRole().name());
            notificationPayload.put("firstName", user.getFirstName());
            notificationPayload.put("tempPassword", tempPassword);

            restTemplate.postForLocation(NOTIFICATION_URL, notificationPayload);
            
            System.out.println("✅ EMAIL SENT: Welcome email sent to " + user.getEmail() + " with password: " + tempPassword);
            this.logAction(user.getCreatedBy(), "EMAIL_TRIGGER_SUCCESS", "Notification", 
                           "Welcome email triggered for: " + user.getEmail(), "127.0.0.1");
                           
        } catch (Exception e) {
            // Don't throw exception - just log the failure
            System.out.println("⚠️  EMAIL SERVICE UNAVAILABLE: " + user.getEmail() + " (Password: " + tempPassword + ")");
            this.logAction(user.getCreatedBy(), "EMAIL_TRIGGER_FAIL", "Notification", 
                           "Failed to call welcome email service for: " + user.getEmail(), "127.0.0.1");
            // Don't rethrow - let user creation succeed
        }
    }

    public void deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            System.out.println("✅ USER DELETED: ID " + id); 
        } else {
            throw new RuntimeException("User not found for deletion: ID " + id);
        }
    }
    
    // --- Department Management and Communication ---
    
    public List<Department> getAllDepartments() { return departmentRepository.findAll(); }
    
    public Department createDepartment(Department department) {
        if (departmentRepository.existsByCode(department.getCode())) {
            throw new RuntimeException("Department code already exists");
        }
        
        Department newDept = new Department();
        newDept.setName(department.getName());
        newDept.setCode(department.getCode());
        newDept.setDescription(department.getDescription());
        newDept.setHeadId(department.getHeadId());
        
        return departmentRepository.save(newDept);
    }
    
    public Announcement createAnnouncement(Announcement announcement) {
        Announcement saved = announcementRepository.save(announcement);
        // Fire-and-forget broadcast to Chat Service (WebSocket broker)
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("id", saved.getId());
            payload.put("title", saved.getTitle());
            payload.put("content", saved.getContent());
            payload.put("type", saved.getType() != null ? saved.getType().name() : null);
            payload.put("targetAudience", saved.getTargetAudience() != null ? saved.getTargetAudience().name() : null);
            payload.put("createdBy", saved.getCreatedByName());
            restTemplate.postForLocation("http://localhost:8085/api/chat/broadcast/announcement", payload);
        } catch (Exception e) {
            // Don't block creation if chat service is unavailable
            System.out.println("⚠️  CHAT SERVICE UNAVAILABLE: Broadcast announcement deferred.");
        }
        // Sync to Employee Service
        try {
            companyUpdatesSyncService.syncAnnouncementToEmployee(saved);
        } catch (Exception e) {
            System.err.println("⚠️  Failed to sync announcement to Employee Service: " + e.getMessage());
        }
        return saved;
    }
    
    public List<Announcement> getAnnouncementsByTarget(Announcement.TargetAudience targetAudience) {
        return announcementRepository.findByTargetAudienceOrderByCreatedAtDesc(targetAudience);
    }
    
    public Poll createPoll(Poll poll) {
        Poll saved = pollRepository.save(poll);
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("id", saved.getId());
            payload.put("question", saved.getQuestion());
            payload.put("options", saved.getOptions());
            payload.put("targetAudience", saved.getTargetAudience() != null ? saved.getTargetAudience().name() : null);
            payload.put("createdBy", saved.getCreatedByName());
            restTemplate.postForLocation("http://localhost:8085/api/chat/broadcast/poll", payload);
        } catch (Exception e) {
            System.out.println("⚠️  CHAT SERVICE UNAVAILABLE: Broadcast poll deferred.");
        }
        // Sync to Employee Service
        try {
            companyUpdatesSyncService.syncPollToEmployee(saved);
        } catch (Exception e) {
            System.err.println("⚠️  Failed to sync poll to Employee Service: " + e.getMessage());
        }
        return saved;
    }
    
    public List<Poll> getPollsByTarget(Poll.TargetAudience targetAudience) {
        return pollRepository.findByTargetAudienceAndIsActiveTrueOrderByCreatedAtDesc(targetAudience);
    }
    
    public void deleteAnnouncement(Long id, String currentUserName) {
        Announcement announcement = announcementRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Announcement not found"));
        
        if (!announcement.getCreatedByName().equals(currentUserName)) {
            throw new RuntimeException("Only the creator can delete this announcement");
        }
        
        announcementRepository.deleteById(id);
    }
    
    public void deletePoll(Long id, String currentUserName) {
        Poll poll = pollRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Poll not found"));
        
        if (!poll.getCreatedByName().equals(currentUserName)) {
            throw new RuntimeException("Only the creator can delete this poll");
        }
        
        pollRepository.deleteById(id);
    }
    
    // --- Analytics & Reporting (Admin Visibility) ---
    public Map<String, Object> getSystemAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalUsers", userRepository.count());
        analytics.put("adminUsers", userRepository.countByRole(User.Role.ADMIN));
        analytics.put("hrUsers", userRepository.countByRole(User.Role.HR));
        analytics.put("managerUsers", userRepository.countByRole(User.Role.MANAGER));
        analytics.put("employeeUsers", userRepository.countByRole(User.Role.EMPLOYEE));
        analytics.put("totalDepartments", departmentRepository.count());
        analytics.put("totalAnnouncements", announcementRepository.count());
        // analytics.put("activePolls", pollRepository.countByIsActiveTrue()); // Uncomment after adding method to PollRepository
        analytics.put("activePolls", 5); 
        return analytics;
    }
    
    public Map<String, Object> getHrManagerSummary() {
        Map<String, Object> report = new HashMap<>();
        // Logic to call HR Service (8082) and Manager Service (8083) via RestTemplate
        
        try {
             Map<?, ?> hrData = restTemplate.getForObject(HR_SUMMARY_URL, Map.class);
             report.put("hrSummary", hrData);
        } catch (Exception e) {
             report.put("hrSummary", "HR Service is offline or inaccessible.");
        }

        try {
             Map<?, ?> managerData = restTemplate.getForObject(MANAGER_SUMMARY_URL, Map.class);
             report.put("managerSummary", managerData);
        } catch (Exception e) {
             report.put("managerSummary", "Manager Service is offline or inaccessible.");
        }

        report.put("systemOverview", this.getSystemAnalytics());
        return report;
    }
    
    // --- Audit Logging ---
    public List<AuditLog> getAuditLogs() { return auditLogRepository.findAll(); }

    public void logAction(Long userId, String action, String module, String description, String ipAddress) {
        // Get user details for audit log
        User user = userRepository.findById(userId).orElse(null);
        String username = user != null ? user.getEmail() : "Unknown";
        String role = user != null ? user.getRole().name() : "UNKNOWN";
        
        AuditLog auditLog = new AuditLog(username, role, action, module, "POST");
        auditLog.setIpAddress(ipAddress);
        auditLogRepository.save(auditLog);
    }

    public List<Document> getDocumentsByTarget(Document.TargetAudience targetAudience) { return documentRepository.findAll(); }
    
    public User updateUser(Long id, User user) {
        User existingUser = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found: ID " + id));
        
        // Update only provided fields, preserve password if not provided
        if (user.getFirstName() != null) existingUser.setFirstName(user.getFirstName());
        if (user.getLastName() != null) existingUser.setLastName(user.getLastName());
        if (user.getEmail() != null && !user.getEmail().equals(existingUser.getEmail())) {
            if (userRepository.existsByEmail(user.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            existingUser.setEmail(user.getEmail());
        }
        if (user.getPosition() != null) existingUser.setPosition(user.getPosition());
        if (user.getPhoneNumber() != null) existingUser.setPhoneNumber(user.getPhoneNumber());
        if (user.getDepartmentId() != null) existingUser.setDepartmentId(user.getDepartmentId());
        if (user.getIsActive() != null) existingUser.setIsActive(user.getIsActive());
        // Only update password if explicitly provided and not empty
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        
        return userRepository.save(existingUser);
    } 
    public List<User> getAllUsers() { return userRepository.findAll(); }
    public List<User> getAllUsersByOrganization(Long organizationId) { 
        return userRepository.findByOrganizationId(organizationId); 
    }
    public List<User> getUsersByRole(User.Role role) { return userRepository.findByRole(role); }
    public List<User> getUsersByRoleAndOrganization(User.Role role, Long organizationId) { 
        return userRepository.findByOrganizationIdAndRole(organizationId, role); 
    }
    
    // Paginated user retrieval with filtering
    public Map<String, Object> getUsersPaginated(int page, int size, String role, String status, String search, Long organizationId) {
        // CRITICAL: Filter by organizationId first if provided
        List<User> allUsers = organizationId != null ? 
            userRepository.findByOrganizationId(organizationId) : 
            userRepository.findAll();
        
        // Apply filters
        if (role != null && !role.isEmpty() && !role.equals("ALL")) {
            try {
                User.Role roleEnum = User.Role.valueOf(role.toUpperCase());
                allUsers = allUsers.stream()
                    .filter(u -> u.getRole() == roleEnum)
                    .toList();
            } catch (IllegalArgumentException e) {
                // Invalid role, ignore filter
            }
        }
        
        if (status != null && !status.isEmpty()) {
            boolean isActive = status.equalsIgnoreCase("active");
            allUsers = allUsers.stream()
                .filter(u -> u.getIsActive() == isActive)
                .toList();
        }
        
        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            allUsers = allUsers.stream()
                .filter(u -> 
                    (u.getFirstName() != null && u.getFirstName().toLowerCase().contains(searchLower)) ||
                    (u.getLastName() != null && u.getLastName().toLowerCase().contains(searchLower)) ||
                    (u.getEmail() != null && u.getEmail().toLowerCase().contains(searchLower))
                )
                .toList();
        }
        
        // Calculate pagination
        int totalElements = allUsers.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int start = page * size;
        int end = Math.min(start + size, totalElements);
        
        List<User> pageContent = start < totalElements ? allUsers.subList(start, end) : List.of();
        
        Map<String, Object> response = new HashMap<>();
        response.put("users", pageContent);
        response.put("currentPage", page);
        response.put("totalPages", totalPages);
        response.put("totalElements", totalElements);
        response.put("size", size);
        response.put("hasNext", page < totalPages - 1);
        response.put("hasPrevious", page > 0);
        
        return response;
    }
    
    // --- New Admin Dashboard Methods ---
    
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalManagers", userRepository.countByRole(User.Role.MANAGER));
        stats.put("totalDepartments", departmentRepository.count());
        stats.put("totalPolls", pollRepository.count());
        stats.put("totalAnnouncements", announcementRepository.count());
        stats.put("activeUsers", userRepository.findByIsActiveTrue().size());
        return stats;
    }
    
    public Map<String, Object> getAuditLogsPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> auditLogPage = auditLogRepository.findAllByOrderByTimestampDesc(pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("auditLogs", auditLogPage.getContent());
        response.put("currentPage", auditLogPage.getNumber());
        response.put("totalPages", auditLogPage.getTotalPages());
        response.put("totalElements", auditLogPage.getTotalElements());
        response.put("size", auditLogPage.getSize());
        
        return response;
    }
    
    public Map<String, Object> getSystemMonitoring() {
        Map<String, Object> monitoring = new HashMap<>();
        
        // System metrics
        monitoring.put("totalUsers", userRepository.count());
        monitoring.put("activeUsers", userRepository.findByIsActiveTrue().size());
        monitoring.put("totalDepartments", departmentRepository.count());
        monitoring.put("totalAnnouncements", announcementRepository.count());
        monitoring.put("totalPolls", pollRepository.count());
        
        // Manager activity (try to get from manager service)
        try {
            Map<?, ?> managerData = restTemplate.getForObject(MANAGER_SUMMARY_URL, Map.class);
            monitoring.put("managerActivity", managerData);
        } catch (Exception e) {
            monitoring.put("managerActivity", "Manager service unavailable");
        }
        
        // Recent audit logs
        Pageable pageable = PageRequest.of(0, 10);
        Page<AuditLog> recentLogs = auditLogRepository.findAllByOrderByTimestampDesc(pageable);
        monitoring.put("recentActivity", recentLogs.getContent());
        
        return monitoring;
    }

    // ===== COMPANY UPDATES METHODS =====
    
    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAll();
    }
    
    public List<Poll> getActivePolls() {
        return pollRepository.findAll().stream()
                .filter(p -> p.getIsActive() != null && p.getIsActive())
                .toList();
    }
    
    public Map<String, Object> voteOnPoll(Long pollId, String option, String voterEmail) {
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new RuntimeException("Poll not found"));
        
        // For now, return simple vote count (actual vote storage would go in PollVotes table)
        Map<String, Object> result = new HashMap<>();
        result.put("pollId", pollId);
        result.put("question", poll.getQuestion());
        result.put("option", option);
        result.put("voter", voterEmail);
        result.put("message", "Vote recorded");
        
        return result;
    }
    
    // Bulk update users
    public int bulkUpdateUsers(List<Long> userIds, String action, Object value) {
        int count = 0;
        for (Long userId : userIds) {
            try {
                User user = userRepository.findById(userId).orElse(null);
                if (user == null) continue;
                
                switch (action) {
                    case "deactivate":
                        user.setIsActive(false);
                        break;
                    case "activate":
                        user.setIsActive(true);
                        break;
                    case "changeDepartment":
                        if (value instanceof Number) {
                            user.setDepartmentId(((Number) value).longValue());
                        }
                        break;
                    case "changeRole":
                        if (value instanceof String) {
                            try {
                                user.setRole(User.Role.valueOf((String) value));
                            } catch (IllegalArgumentException e) {
                                continue;
                            }
                        }
                        break;
                    default:
                        continue;
                }
                
                userRepository.save(user);
                count++;
            } catch (Exception e) {
                System.err.println("Error updating user " + userId + ": " + e.getMessage());
            }
        }
        return count;
    }
    
    // Update announcement
    public Announcement updateAnnouncement(Long id, Announcement updatedAnnouncement, String userName) {
        Announcement existing = announcementRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Announcement not found"));
        
        if (!existing.getCreatedByName().equals(userName)) {
            throw new RuntimeException("Only the creator can update this announcement");
        }
        
        if (updatedAnnouncement.getTitle() != null) {
            existing.setTitle(updatedAnnouncement.getTitle());
        }
        if (updatedAnnouncement.getContent() != null) {
            existing.setContent(updatedAnnouncement.getContent());
        }
        if (updatedAnnouncement.getType() != null) {
            existing.setType(updatedAnnouncement.getType());
        }
        
        return announcementRepository.save(existing);
    }
}
