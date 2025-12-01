package com.interacthub.admin_service.controller;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import com.interacthub.admin_service.model.*;
import com.interacthub.admin_service.repository.*;
import com.interacthub.admin_service.service.AdminService;

@RestController
@RequestMapping("/api/admin/monitoring")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminMonitoringController {
    
    @Autowired
    private AdminService adminService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AnnouncementRepository announcementRepository;
    
    @Autowired
    private PollRepository pollRepository;
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private RestTemplate restTemplate;

    @Value("${manager.service.url:http://localhost:8083/api/manager}")
    private String managerServiceUrl;
    
    // Get all announcements (for admin to see everything)
    @GetMapping("/announcements")
    public ResponseEntity<List<Announcement>> getAllAnnouncements() {
        return ResponseEntity.ok(announcementRepository.findAll());
    }
    
    // Get all polls (for admin to see everything)
    @GetMapping("/polls")
    public ResponseEntity<List<Poll>> getAllPolls() {
        return ResponseEntity.ok(pollRepository.findAll());
    }
    
    // Get all audit logs
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAll());
    }
    
    // Get system-wide statistics
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getSystemStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // User statistics
        stats.put("totalUsers", userRepository.count());
        stats.put("activeUsers", userRepository.findByIsActiveTrue().size());
        stats.put("totalAdmins", userRepository.countByRole(User.Role.ADMIN));
        stats.put("totalManagers", userRepository.countByRole(User.Role.MANAGER));
        stats.put("totalHR", userRepository.countByRole(User.Role.HR));
        stats.put("totalEmployees", userRepository.countByRole(User.Role.EMPLOYEE));
        
        // Communication statistics
        stats.put("totalAnnouncements", announcementRepository.count());
        stats.put("totalPolls", pollRepository.count());
        stats.put("activePolls", pollRepository.findAll().stream().filter(p -> p.getIsActive()).count());
        
        // Audit statistics
        stats.put("totalAuditLogs", auditLogRepository.count());
        
        return ResponseEntity.ok(stats);
    }

    // Get all manager activities across the organization
    @GetMapping("/managers/activities")
    public ResponseEntity<List<Map<String, Object>>> getAllManagerActivities() {
        try {
            String url = managerServiceUrl + "/admin/activities";
            ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return ResponseEntity.ok(response.getBody());
            } else {
                return ResponseEntity.ok(new ArrayList<>());
            }
        } catch (Exception e) {
            System.err.println("⚠️ Manager service unavailable: " + e.getMessage());
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    // Get specific manager's detailed activities
    @GetMapping("/managers/{managerId}/activities")
    public ResponseEntity<Map<String, Object>> getManagerActivities(@PathVariable Long managerId) {
        try {
            String url = managerServiceUrl + "/admin/activities/" + managerId;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.ok(response.getBody());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Manager service unavailable"));
        }
    }

    // Get organization-wide summary
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getOrganizationSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        // Get data from admin service directly
        summary.put("totalManagers", userRepository.countByRole(User.Role.MANAGER));
        summary.put("totalHR", userRepository.countByRole(User.Role.HR));
        summary.put("totalEmployees", userRepository.countByRole(User.Role.EMPLOYEE));
        summary.put("totalAnnouncements", announcementRepository.count());
        summary.put("totalPolls", pollRepository.count());
        
        // Try to get manager service data
        try {
            ResponseEntity<Map> managerStats = restTemplate.getForEntity(
                managerServiceUrl + "/stats/overview", Map.class);
            if (managerStats.getStatusCode().is2xxSuccessful()) {
                summary.put("managerServiceData", managerStats.getBody());
            }
        } catch (Exception e) {
            summary.put("managerServiceData", Map.of("status", "unavailable"));
        }
        
        return ResponseEntity.ok(summary);
    }

    // Get real-time system interactions (announcements, polls, live activity)
    @GetMapping("/interactions/live")
    public ResponseEntity<List<Map<String, Object>>> getLiveInteractions() {
        List<Map<String, Object>> liveInteractions = new ArrayList<>();
        
        // Get recent announcements
        List<Announcement> recentAnnouncements = announcementRepository.findAll().stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .limit(10)
            .collect(java.util.stream.Collectors.toList());
        
        for (Announcement announcement : recentAnnouncements) {
            Map<String, Object> interaction = new HashMap<>();
            interaction.put("type", "announcement_created");
            interaction.put("icon", "📢");
            interaction.put("title", announcement.getTitle());
            interaction.put("announcementType", announcement.getType() != null ? announcement.getType().toString() : "GENERAL");
            interaction.put("createdBy", announcement.getCreatedByName() != null ? announcement.getCreatedByName() : "Admin");
            interaction.put("timestamp", announcement.getCreatedAt().toString());
            interaction.put("likesCount", 0); // Likes not tracked in Announcement model
            liveInteractions.add(interaction);
        }
        
        // Get recent polls
        List<Poll> recentPolls = pollRepository.findAll().stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .limit(5)
            .collect(java.util.stream.Collectors.toList());
        
        for (Poll poll : recentPolls) {
            Map<String, Object> interaction = new HashMap<>();
            interaction.put("type", "poll_created");
            interaction.put("icon", "📊");
            interaction.put("question", poll.getQuestion());
            interaction.put("createdBy", poll.getCreatedByName() != null ? poll.getCreatedByName() : "Admin");
            interaction.put("timestamp", poll.getCreatedAt().toString());
            interaction.put("isActive", poll.getIsActive());
            liveInteractions.add(interaction);
        }
        
        // Sort all interactions by timestamp
        liveInteractions.sort((a, b) -> {
            String timeA = (String) a.get("timestamp");
            String timeB = (String) b.get("timestamp");
            return timeB.compareTo(timeA);
        });
        
        // Limit to 20 most recent
        if (liveInteractions.size() > 20) {
            liveInteractions = liveInteractions.subList(0, 20);
        }
        
        return ResponseEntity.ok(liveInteractions);
    }
    
    // Get system health status
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        
        // Check database connectivity
        try {
            long userCount = userRepository.count();
            health.put("database", Map.of(
                "status", "UP",
                "responseTime", "< 100ms",
                "connections", userCount > 0 ? "Active" : "Idle"
            ));
        } catch (Exception e) {
            health.put("database", Map.of(
                "status", "DOWN",
                "error", e.getMessage()
            ));
        }
        
        // Check services
        health.put("adminService", Map.of("status", "UP", "port", 8081));
        
        // Try manager service
        try {
            restTemplate.getForEntity(managerServiceUrl + "/health", String.class);
            health.put("managerService", Map.of("status", "UP", "port", 8083));
        } catch (Exception e) {
            health.put("managerService", Map.of("status", "DOWN", "port", 8083));
        }
        
        // System metrics
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        
        health.put("system", Map.of(
            "memoryUsed", usedMemory / (1024 * 1024) + " MB",
            "memoryTotal", totalMemory / (1024 * 1024) + " MB",
            "memoryFree", freeMemory / (1024 * 1024) + " MB",
            "processors", runtime.availableProcessors()
        ));
        
        return ResponseEntity.ok(health);
    }
}
