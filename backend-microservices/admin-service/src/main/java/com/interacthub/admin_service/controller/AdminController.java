package com.interacthub.admin_service.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.admin_service.model.Announcement;
import com.interacthub.admin_service.model.AuditLog;
import com.interacthub.admin_service.model.Department;
import com.interacthub.admin_service.model.Poll;
import com.interacthub.admin_service.model.User;
import com.interacthub.admin_service.service.AdminService;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/admin")
public class AdminController {
    
    @Autowired
    private AdminService adminService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    // --- 1. User Management (CRUD) ---
    
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long organizationId) {
        try {
            Map<String, Object> result = adminService.getUsersPaginated(page, size, role, status, search, organizationId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            // Fallback to old behavior for backward compatibility
            return ResponseEntity.ok(adminService.getAllUsers());
        }
    }
    
    @GetMapping("/users/all")
    public List<User> getAllUsersNoPagination(@RequestParam(required = false) Long organizationId) {
        if (organizationId != null) {
            return adminService.getAllUsersByOrganization(organizationId);
        }
        return adminService.getAllUsers();
    }
    
    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        // This endpoint handles both initial Admin account creation and creating Manager/HR accounts.
        return ResponseEntity.ok(adminService.createUser(user));
    }
    
    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            return ResponseEntity.ok(adminService.updateUser(id, user));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).build();
        }
    }
    
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            adminService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "User ID " + id + " deleted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/users/role/{role}")
    public List<User> getUsersByRole(@PathVariable User.Role role) {
        return adminService.getUsersByRole(role);
    }
    
    @PostMapping("/users/bulk-update")
    public ResponseEntity<?> bulkUpdateUsers(@RequestBody Map<String, Object> bulkUpdate) {
        try {
            // Convert userIds to List<Long> safely
            List<Long> userIds = ((List<?>) bulkUpdate.get("userIds")).stream()
                .map(id -> {
                    if (id instanceof Number) {
                        return ((Number) id).longValue();
                    } else if (id instanceof String) {
                        return Long.parseLong((String) id);
                    }
                    throw new IllegalArgumentException("Invalid user ID format: " + id);
                })
                .toList();
            
            String action = (String) bulkUpdate.get("action");
            Object value = bulkUpdate.get("value");
            
            if (userIds == null || userIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No user IDs provided"));
            }
            
            if (action == null || action.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No action specified"));
            }
            
            int updated = adminService.bulkUpdateUsers(userIds, action, value);
            return ResponseEntity.ok(Map.of(
                "message", "Successfully updated " + updated + " users",
                "count", updated
            ));
        } catch (ClassCastException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid data format: " + e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // --- 2. Department Management ---
    
    @GetMapping("/departments")
    public List<Department> getAllDepartments() {
        return adminService.getAllDepartments();
    }
    
    @PostMapping("/departments")
    public ResponseEntity<?> createDepartment(@RequestBody Department department) {
        try {
            return ResponseEntity.ok(adminService.createDepartment(department));
        } catch (RuntimeException e) {
             return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // --- 3. Global Communication Management (Announcements/Polls) ---
    
    @PostMapping("/announcements")
    public ResponseEntity<?> createAnnouncement(@RequestBody Announcement announcement) {
        try {
            Announcement created = adminService.createAnnouncement(announcement);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            System.err.println("Error creating announcement: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/announcements")
    public List<Announcement> getAllAnnouncements() {
        return adminService.getAllAnnouncements();
    }
    
    @GetMapping("/announcements/target/{targetAudience}")
    public ResponseEntity<?> getAnnouncementsByTarget(@PathVariable String targetAudience) {
        try {
            Announcement.TargetAudience audience = Announcement.TargetAudience.valueOf(targetAudience.toUpperCase());
            return ResponseEntity.ok(adminService.getAnnouncementsByTarget(audience));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid target audience: " + targetAudience));
        }
    }
    
    @PostMapping("/polls")
    public ResponseEntity<?> createPoll(@RequestBody Poll poll) {
        try {
            Poll created = adminService.createPoll(poll);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            System.err.println("Error creating poll: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/polls")
    public List<Poll> getAllPolls() {
        return adminService.getActivePolls();
    }
    
    @GetMapping("/polls/target/{targetAudience}")
    public ResponseEntity<?> getPollsByTarget(@PathVariable String targetAudience) {
        try {
            Poll.TargetAudience audience = Poll.TargetAudience.valueOf(targetAudience.toUpperCase());
            return ResponseEntity.ok(adminService.getPollsByTarget(audience));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid target audience: " + targetAudience));
        }
    }
    
    @PutMapping("/announcements/{id}")
    public ResponseEntity<?> updateAnnouncement(@PathVariable Long id, @RequestBody Announcement announcement, @RequestHeader(value = "X-User-Name", required = false) String userName) {
        try {
            if (userName == null || userName.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "User name is required"));
            }
            Announcement updated = adminService.updateAnnouncement(id, announcement, userName.trim());
            
            // Broadcast update to all connected clients
            messagingTemplate.convertAndSend("/topic/announcements.updated", Map.of(
                "id", id,
                "type", "ANNOUNCEMENT",
                "updatedBy", userName.trim()
            ));
            
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id, @RequestHeader(value = "X-User-Name", required = false) String userName) {
        try {
            if (userName == null || userName.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "User name is required"));
            }
            adminService.deleteAnnouncement(id, userName.trim());
            
            // Broadcast deletion to all connected clients
            messagingTemplate.convertAndSend("/topic/announcements.deleted", Map.of(
                "id", id,
                "type", "ANNOUNCEMENT",
                "deletedBy", userName.trim()
            ));
            
            return ResponseEntity.ok(Map.of("message", "Announcement deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/polls/{id}")
    public ResponseEntity<?> deletePoll(@PathVariable Long id, @RequestHeader(value = "X-User-Name", required = false) String userName) {
        try {
            if (userName == null || userName.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "User name is required"));
            }
            adminService.deletePoll(id, userName.trim());
            
            // Broadcast deletion to all connected clients
            messagingTemplate.convertAndSend("/topic/polls.deleted", Map.of(
                "id", id,
                "type", "POLL",
                "deletedBy", userName.trim()
            ));
            
            return ResponseEntity.ok(Map.of("message", "Poll deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
    
    // --- 4. Analytics & Reporting (Cross-Service Visibility) ---

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        return ResponseEntity.ok(adminService.getSystemAnalytics());
    }

    @GetMapping("/dashboard/full-report")
    public ResponseEntity<Map<String, Object>> getFullAdminReport() {
        // This method calls the Manager (8083) and HR (8082) services for visibility data
        return ResponseEntity.ok(adminService.getHrManagerSummary());
    }

    @GetMapping("/audit-logs")
    public List<AuditLog> getAuditLogs() {
        return adminService.getAuditLogs();
    }
    
    // --- 5. New Admin Dashboard Endpoints ---
    
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }
    
    @GetMapping("/audit/logs")
    public ResponseEntity<Map<String, Object>> getAuditLogsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAuditLogsPaginated(page, size));
    }
    
    @GetMapping("/monitoring")
    public ResponseEntity<Map<String, Object>> getSystemMonitoring() {
        return ResponseEntity.ok(adminService.getSystemMonitoring());
    }
}