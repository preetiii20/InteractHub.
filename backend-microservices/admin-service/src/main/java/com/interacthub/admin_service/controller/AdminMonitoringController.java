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
import com.interacthub.admin_service.util.OrganizationValidator;
import java.util.stream.Collectors;

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
    
    @Autowired
    private OrganizationValidator organizationValidator;

    @Value("${manager.service.url:http://localhost:8083/api/manager}")
    private String managerServiceUrl;
    
    // Get all announcements (for admin to see everything)
    @GetMapping("/announcements")
    public ResponseEntity<?> getAllAnnouncements() {
        try {
            List<Announcement> announcements = announcementRepository.findAll();
            
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }
    
    // Get all polls (for admin to see everything)
    @GetMapping("/polls")
    public ResponseEntity<?> getAllPolls() {
        try {
            List<Poll> polls = pollRepository.findAll();
            
            return ResponseEntity.ok(polls);
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }
    
    // Get all audit logs
    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAllAuditLogs() {
        try {
            List<AuditLog> logs = auditLogRepository.findAll();
            
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }
    
    // Get system-wide statistics (all data)
    @GetMapping("/statistics")
    public ResponseEntity<?> getSystemStatistics() {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // User statistics (all users - no filtering)
            List<User> orgUsers = userRepository.findAll();
            
            stats.put("totalUsers", orgUsers.size());
            stats.put("activeUsers", orgUsers.stream().filter(User::getIsActive).count());
            stats.put("totalAdmins", orgUsers.stream().filter(u -> u.getRole() == User.Role.ADMIN).count());
            stats.put("totalManagers", orgUsers.stream().filter(u -> u.getRole() == User.Role.MANAGER).count());
            stats.put("totalHR", orgUsers.stream().filter(u -> u.getRole() == User.Role.HR).count());
            stats.put("totalEmployees", orgUsers.stream().filter(u -> u.getRole() == User.Role.EMPLOYEE).count());
            
            // Communication statistics (all data - no filtering)
            List<Announcement> orgAnnouncements = announcementRepository.findAll();
            
            List<Poll> orgPolls = pollRepository.findAll();
            
            stats.put("totalAnnouncements", orgAnnouncements.size());
            stats.put("totalPolls", orgPolls.size());
            stats.put("activePolls", orgPolls.stream().filter(Poll::getIsActive).count());
            
            // Audit statistics (all data - no filtering)
            List<AuditLog> orgLogs = auditLogRepository.findAll();
            
            stats.put("totalAuditLogs", orgLogs.size());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }

    // Get all manager activities across the organization
    @GetMapping("/managers/activities")
    public ResponseEntity<?> getAllManagerActivities() {
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
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }

    // Get specific manager's detailed activities
    @GetMapping("/managers/{managerId}/activities")
    public ResponseEntity<?> getManagerActivities(
            @PathVariable Long managerId) {
        try {
            String url = managerServiceUrl + "/admin/activities/" + managerId;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.ok(response.getBody());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }

    // Get organization-wide summary
    @GetMapping("/summary")
    public ResponseEntity<?> getOrganizationSummary() {
        try {
            Map<String, Object> summary = new HashMap<>();
            
            // Get data from admin service directly (all data - no filtering)
            List<User> orgUsers = userRepository.findAll();
            
            summary.put("totalManagers", orgUsers.stream().filter(u -> u.getRole() == User.Role.MANAGER).count());
            summary.put("totalHR", orgUsers.stream().filter(u -> u.getRole() == User.Role.HR).count());
            summary.put("totalEmployees", orgUsers.stream().filter(u -> u.getRole() == User.Role.EMPLOYEE).count());
            
            List<Announcement> orgAnnouncements = announcementRepository.findAll();
            
            List<Poll> orgPolls = pollRepository.findAll();
            
            summary.put("totalAnnouncements", orgAnnouncements.size());
            summary.put("totalPolls", orgPolls.size());
            
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
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }

    // Get real-time system interactions (announcements, polls, live activity)
    @GetMapping("/interactions/live")
    public ResponseEntity<?> getLiveInteractions() {
        try {
            List<Map<String, Object>> liveInteractions = new ArrayList<>();
            
            // Get recent announcements (all data - no filtering)
            List<Announcement> recentAnnouncements = announcementRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(10)
                .collect(Collectors.toList());
            
            for (Announcement announcement : recentAnnouncements) {
                Map<String, Object> interaction = new HashMap<>();
                interaction.put("type", "announcement_created");
                interaction.put("icon", "📢");
                interaction.put("title", announcement.getTitle());
                interaction.put("announcementType", announcement.getType() != null ? announcement.getType().toString() : "GENERAL");
                interaction.put("createdBy", announcement.getCreatedByName() != null ? announcement.getCreatedByName() : "Admin");
                interaction.put("timestamp", announcement.getCreatedAt().toString());
                interaction.put("likesCount", 0);
                liveInteractions.add(interaction);
            }
            
            // Get recent polls (all data - no filtering)
            List<Poll> recentPolls = pollRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(5)
                .collect(Collectors.toList());
            
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
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }
    
    // Get system health status
    @GetMapping("/health")
    public ResponseEntity<?> getSystemHealth() {
        try {
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
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }
}
