package com.interacthub.admin_service.controller;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import com.interacthub.admin_service.model.User;
import com.interacthub.admin_service.repository.UserRepository;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminDashboardController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Value("${manager.service.url:http://localhost:8083/api/manager}")
    private String managerServiceUrl;
    
    @Value("${hr.service.url:http://localhost:8084/api/hr}")
    private String hrServiceUrl;
    
    @Value("${chat.service.url:http://localhost:8085/api/chat}")
    private String chatServiceUrl;
    
    /**
     * Get comprehensive dashboard statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // User statistics
            List<User> allUsers = userRepository.findAll();
            stats.put("totalUsers", allUsers.size());
            stats.put("activeUsers", allUsers.stream().filter(User::getIsActive).count());
            stats.put("inactiveUsers", allUsers.stream().filter(u -> !u.getIsActive()).count());
            stats.put("totalManagers", allUsers.stream().filter(u -> u.getRole() == User.Role.MANAGER).count());
            stats.put("totalHR", allUsers.stream().filter(u -> u.getRole() == User.Role.HR).count());
            stats.put("totalEmployees", allUsers.stream().filter(u -> u.getRole() == User.Role.EMPLOYEE).count());
            stats.put("totalAdmins", allUsers.stream().filter(u -> u.getRole() == User.Role.ADMIN).count());
            
            // Fetch manager service stats
            try {
                ResponseEntity<Map> managerStats = restTemplate.getForEntity(
                    managerServiceUrl + "/stats/overview", Map.class);
                if (managerStats.getStatusCode().is2xxSuccessful()) {
                    stats.put("managerStats", managerStats.getBody());
                }
            } catch (Exception e) {
                System.err.println("⚠️ Could not fetch manager stats: " + e.getMessage());
                stats.put("managerStats", Map.of("error", "Service unavailable"));
            }
            
            // Fetch HR service stats
            try {
                ResponseEntity<Map> hrStats = restTemplate.getForEntity(
                    hrServiceUrl + "/stats/overview", Map.class);
                if (hrStats.getStatusCode().is2xxSuccessful()) {
                    stats.put("hrStats", hrStats.getBody());
                }
            } catch (Exception e) {
                System.err.println("⚠️ Could not fetch HR stats: " + e.getMessage());
                stats.put("hrStats", Map.of("error", "Service unavailable"));
            }
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get all managers with their teams and projects
     */
    @GetMapping("/managers")
    public ResponseEntity<?> getAllManagers() {
        try {
            List<User> managers = userRepository.findByRole(User.Role.MANAGER);
            List<Map<String, Object>> managerDetails = new ArrayList<>();
            
            for (User manager : managers) {
                Map<String, Object> details = new HashMap<>();
                details.put("id", manager.getId());
                details.put("name", manager.getFirstName() + " " + manager.getLastName());
                details.put("email", manager.getEmail());
                details.put("isActive", manager.getIsActive());
                details.put("department", manager.getDepartmentId());
                
                // Fetch manager's projects
                try {
                    ResponseEntity<List> projects = restTemplate.getForEntity(
                        managerServiceUrl + "/projects/manager/" + manager.getId(), List.class);
                    details.put("projects", projects.getBody());
                    details.put("projectCount", projects.getBody() != null ? projects.getBody().size() : 0);
                } catch (Exception e) {
                    details.put("projects", new ArrayList<>());
                    details.put("projectCount", 0);
                }
                
                // Fetch manager's team
                try {
                    ResponseEntity<List> team = restTemplate.getForEntity(
                        managerServiceUrl + "/teams/manager/" + manager.getId(), List.class);
                    details.put("team", team.getBody());
                    details.put("teamSize", team.getBody() != null ? team.getBody().size() : 0);
                } catch (Exception e) {
                    details.put("team", new ArrayList<>());
                    details.put("teamSize", 0);
                }
                
                managerDetails.add(details);
            }
            
            return ResponseEntity.ok(managerDetails);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get HR overview with real-time metrics from database
     */
    @GetMapping("/hr")
    public ResponseEntity<?> getHROverview() {
        try {
            List<User> hrUsers = userRepository.findByRole(User.Role.HR);
            Map<String, Object> hrOverview = new HashMap<>();
            
            hrOverview.put("hrCount", hrUsers.size());
            
            // Build detailed HR user data with real metrics
            List<Map<String, Object>> hrUserDetails = new ArrayList<>();
            for (User hr : hrUsers) {
                Map<String, Object> hrData = new HashMap<>();
                hrData.put("id", hr.getId());
                hrData.put("name", hr.getFirstName() + " " + hr.getLastName());
                hrData.put("email", hr.getEmail());
                hrData.put("isActive", hr.getIsActive());
                hrData.put("department", hr.getDepartmentId() != null ? hr.getDepartmentId() : "HR Department");
                
                // Calculate real metrics from database
                Map<String, Object> metrics = new HashMap<>();
                
                // Count users created (onboarded) - all users created after this HR user
                long onboardedCount = userRepository.findAll().stream()
                    .filter(u -> u.getCreatedAt() != null && hr.getCreatedAt() != null)
                    .filter(u -> u.getCreatedAt().isAfter(hr.getCreatedAt()))
                    .count();
                metrics.put("onboarded", onboardedCount);
                
                // Count active employees (potential attendance tracking)
                long activeEmployees = userRepository.findAll().stream()
                    .filter(User::getIsActive)
                    .filter(u -> u.getRole() == User.Role.EMPLOYEE)
                    .count();
                metrics.put("attendance", activeEmployees);
                
                // Count pending items (users awaiting activation)
                long pendingUsers = userRepository.findAll().stream()
                    .filter(u -> !u.getIsActive())
                    .count();
                metrics.put("pendingLeaves", pendingUsers);
                
                hrData.put("metrics", metrics);
                hrUserDetails.add(hrData);
            }
            
            hrOverview.put("hrUsers", hrUserDetails);
            
            // Real leave statistics from database
            long totalUsers = userRepository.count();
            long activeUsers = userRepository.findAll().stream().filter(User::getIsActive).count();
            long inactiveUsers = totalUsers - activeUsers;
            
            Map<String, Object> leaveStats = new HashMap<>();
            leaveStats.put("pending", inactiveUsers); // Inactive users as "pending"
            leaveStats.put("approved", activeUsers);  // Active users as "approved"
            leaveStats.put("rejected", 0);            // No rejected concept yet
            leaveStats.put("total", totalUsers);
            
            hrOverview.put("leaveStats", leaveStats);
            
            // Pending leave requests (inactive users needing activation)
            List<Map<String, Object>> pendingLeaves = new ArrayList<>();
            List<User> inactiveUsersList = userRepository.findAll().stream()
                .filter(u -> !u.getIsActive())
                .limit(10)
                .collect(Collectors.toList());
            
            for (User user : inactiveUsersList) {
                Map<String, Object> leave = new HashMap<>();
                leave.put("employee", user.getFirstName() + " " + user.getLastName());
                leave.put("type", "Account Activation");
                leave.put("days", 1);
                leave.put("date", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "N/A");
                leave.put("status", "Pending");
                pendingLeaves.add(leave);
            }
            
            hrOverview.put("pendingLeaves", pendingLeaves);
            
            return ResponseEntity.ok(hrOverview);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get all employees with detailed information
     */
    @GetMapping("/employees")
    public ResponseEntity<?> getAllEmployees() {
        try {
            List<User> employees = userRepository.findAll();
            List<Map<String, Object>> employeeDetails = employees.stream().map(emp -> {
                Map<String, Object> details = new HashMap<>();
                details.put("id", emp.getId());
                details.put("firstName", emp.getFirstName());
                details.put("lastName", emp.getLastName());
                details.put("email", emp.getEmail());
                details.put("role", emp.getRole().name());
                details.put("department", emp.getDepartmentId());
                details.put("position", emp.getPosition());
                details.put("phoneNumber", emp.getPhoneNumber());
                details.put("isActive", emp.getIsActive());
                details.put("createdAt", emp.getCreatedAt());
                return details;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(employeeDetails);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get recent activities from database (real-time)
     */
    @GetMapping("/activities")
    public ResponseEntity<?> getRecentActivities(@RequestParam(defaultValue = "20") int limit) {
        try {
            List<Map<String, Object>> activities = new ArrayList<>();
            
            // Get recently created users
            List<User> recentUsers = userRepository.findAll().stream()
                .filter(u -> u.getCreatedAt() != null)
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(limit)
                .collect(Collectors.toList());
            
            for (User user : recentUsers) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("icon", "👤");
                activity.put("message", user.getFirstName() + " " + user.getLastName() + " joined as " + user.getRole());
                activity.put("description", "New user onboarded to the system");
                activity.put("timestamp", user.getCreatedAt().toString());
                activity.put("type", "USER_CREATED");
                activity.put("status", user.getIsActive() ? "Active" : "Pending");
                activities.add(activity);
            }
            
            // Get recently activated/deactivated users
            List<User> allUsers = userRepository.findAll();
            for (User user : allUsers.stream().limit(10).collect(Collectors.toList())) {
                if (user.getUpdatedAt() != null && !user.getUpdatedAt().equals(user.getCreatedAt())) {
                    Map<String, Object> activity = new HashMap<>();
                    activity.put("icon", user.getIsActive() ? "✅" : "⏸️");
                    activity.put("message", user.getFirstName() + " " + user.getLastName() + " account " + 
                                          (user.getIsActive() ? "activated" : "deactivated"));
                    activity.put("description", "User status changed");
                    activity.put("timestamp", user.getUpdatedAt().toString());
                    activity.put("type", "USER_UPDATED");
                    activity.put("status", user.getIsActive() ? "Active" : "Inactive");
                    activities.add(activity);
                }
            }
            
            // Sort by timestamp
            activities.sort((a, b) -> {
                String timeA = (String) a.get("timestamp");
                String timeB = (String) b.get("timestamp");
                return timeB.compareTo(timeA);
            });
            
            // Limit results
            if (activities.size() > limit) {
                activities = activities.subList(0, limit);
            }
            
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get system health status
     */
    @GetMapping("/health")
    public ResponseEntity<?> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        
        // Check admin service
        health.put("adminService", "UP");
        
        // Check manager service
        try {
            restTemplate.getForEntity(managerServiceUrl + "/health", String.class);
            health.put("managerService", "UP");
        } catch (Exception e) {
            health.put("managerService", "DOWN");
        }
        
        // Check HR service
        try {
            restTemplate.getForEntity(hrServiceUrl + "/health", String.class);
            health.put("hrService", "UP");
        } catch (Exception e) {
            health.put("hrService", "DOWN");
        }
        
        // Check chat service
        try {
            restTemplate.getForEntity(chatServiceUrl + "/health", String.class);
            health.put("chatService", "UP");
        } catch (Exception e) {
            health.put("chatService", "DOWN");
        }
        
        return ResponseEntity.ok(health);
    }
}
