package com.interacthub.manager.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.manager.model.Employee;
import com.interacthub.manager.model.ManagerAnnouncement;
import com.interacthub.manager.model.ManagerPoll;
import com.interacthub.manager.model.Project;
import com.interacthub.manager.model.ProjectGroup;
import com.interacthub.manager.model.Task;
import com.interacthub.manager.repository.ProjectGroupRepository;
import com.interacthub.manager.service.ManagerService;
import com.interacthub.manager.service.ProjectGroupService;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/manager")
public class ManagerController {

    private final ManagerService managerService;
    private final ProjectGroupService projectGroupService;
    private final ProjectGroupRepository projectGroupRepository;

    public ManagerController(ManagerService managerService, ProjectGroupService projectGroupService, ProjectGroupRepository projectGroupRepository) { 
        this.managerService = managerService;
        this.projectGroupService = projectGroupService;
        this.projectGroupRepository = projectGroupRepository;
    }

    // 1) Employee Creation
    @PostMapping("/employee/onboard")
    public ResponseEntity<?> onboardEmployee(@RequestBody Map<String, Object> payload) {
        // Validate required fields
        if (!payload.containsKey("managerId") || payload.get("managerId") == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Manager ID is required",
                "code", "MANAGER_ID_MISSING"
            ));
        }

        if (!payload.containsKey("firstName") || payload.get("firstName") == null || 
            !payload.containsKey("email") || payload.get("email") == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "First name and email are required fields",
                "code", "REQUIRED_FIELDS_MISSING"
            ));
        }

        try {
            Long managerId = payload.get("managerId") instanceof Number ? 
                ((Number) payload.get("managerId")).longValue() : 
                Long.parseLong(String.valueOf(payload.get("managerId")));

            Long departmentId = payload.get("departmentId") instanceof Number ? 
                ((Number) payload.get("departmentId")).longValue() : 1L;

            System.out.println("Processing employee creation - Manager ID: " + managerId + 
                             ", Department ID: " + departmentId);

            Map<String, Object> response = managerService.createEmployeeAccount(payload, managerId, departmentId);
            return ResponseEntity.ok(response);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Invalid manager ID format",
                "code", "INVALID_MANAGER_ID"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage(),
                "code", "CREATION_FAILED"
            ));
        }
    }

    // 2) Project Management
    @GetMapping("/projects/my/{managerId}")
    public List<Project> getMyProjects(@PathVariable Long managerId) {
        return managerService.getManagerProjects(managerId);
    }

    @PostMapping("/tasks/assign")
    public ResponseEntity<Task> assignTask(@RequestBody Task task) {
        return ResponseEntity.ok(managerService.assignTask(task));
    }

    // 3) Manager Local Communication
    @PostMapping("/announcements/local")
    public ResponseEntity<ManagerAnnouncement> createLocalAnnouncement(@RequestBody ManagerAnnouncement announcement) {
        return ResponseEntity.ok(managerService.createLocalAnnouncement(announcement));
    }

    @PostMapping("/polls/local")
    public ResponseEntity<ManagerPoll> createLocalPoll(@RequestBody ManagerPoll poll) {
        return ResponseEntity.ok(managerService.createLocalPoll(poll));
    }

    @GetMapping("/comms/global")
    public List<?> getGlobalComms() {
        return managerService.getGlobalAnnouncements("MANAGER");
    }

    // 4) Interaction (forward to chat-service)
    @PostMapping("/interaction/comment")
    public ResponseEntity<?> postComment(@RequestBody Map<String, Object> payload) {
        Long userId = payload.get("userId") instanceof Number ? ((Number) payload.get("userId")).longValue() : 2L;
        String entityType = String.valueOf(payload.get("entityType"));
        Long entityId = payload.get("entityId") instanceof Number ? ((Number) payload.get("entityId")).longValue() : null;
        String comment = String.valueOf(payload.get("comment"));
        managerService.postInteraction(userId, entityType, entityId, comment);
        return ResponseEntity.ok(Map.of("message", "Interaction posted successfully."));
    }

    // 5) Employee Management
    
    // More specific routes first to avoid conflicts
    @GetMapping("/employees/{employeeId}/project-groups")
    public ResponseEntity<?> getProjectGroupsByEmployee(@PathVariable Long employeeId) {
        try {
            System.out.println("🔍 Getting project groups for employee ID: " + employeeId);
            Map<String, Object> result = managerService.getProjectGroupsByEmployeeWithProjects(employeeId);
            System.out.println("✅ Found " + ((List<?>) result.get("groups")).size() + " project groups for employee " + employeeId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("❌ Error getting project groups for employee " + employeeId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/employees/{managerId}/active")
    public List<Employee> getMyActiveEmployees(@PathVariable Long managerId) {
        return managerService.getActiveEmployeesByManager(managerId);
    }

    @GetMapping("/employees/{managerId}")
    public List<Employee> getMyEmployees(@PathVariable Long managerId) {
        return managerService.getEmployeesByManager(managerId);
    }
    
    @GetMapping("/teams/manager/{managerId}")
    public ResponseEntity<List<Employee>> getTeamByManager(@PathVariable Long managerId) {
        // Admin endpoint to get team members for a specific manager
        List<Employee> team = managerService.getEmployeesByManager(managerId);
        return ResponseEntity.ok(team);
    }

    @PutMapping("/employees/{employeeId}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable Long employeeId, @RequestBody Employee employee) {
        return ResponseEntity.ok(managerService.updateEmployee(employeeId, employee));
    }

    @DeleteMapping("/employees/{employeeId}")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long employeeId) {
        managerService.deleteEmployee(employeeId);
        return ResponseEntity.ok(Map.of("message", "Employee deleted successfully"));
    }

    @GetMapping("/employees/search/{managerId}")
    public List<Employee> searchEmployees(@PathVariable Long managerId, @RequestParam String searchTerm) {
        return managerService.searchEmployeesByName(managerId, searchTerm);
    }

    // 6) Project Group Management
    @PostMapping("/project-groups")
    public ResponseEntity<ProjectGroup> createProjectGroup(
            @RequestBody ProjectGroup projectGroup,
            @RequestHeader(value = "X-User-Name", required = false, defaultValue = "manager") String username,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "MANAGER") String role,
            @RequestHeader(value = "X-Manager-Id", required = false) Long managerId) {
        try {
            // Use ProjectGroupService which creates chat group automatically
            // We need managerId and projectId - managerId from header, projectId from projectGroup
            Long finalManagerId = managerId != null ? managerId : 
                (projectGroup.getProjectId() != null ? projectGroup.getProjectId() : 1L); // fallback
            
            ProjectGroup created = projectGroupService.createProjectGroup(
                projectGroup.getProjectId(),
                projectGroup.getName(),
                projectGroup.getDescription(),
                finalManagerId,
                username,
                role,
                projectGroup.getEmployeeIds()
            );
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            // Fallback to simple create if ProjectGroupService fails
            System.err.println("Error creating project group with chat: " + e.getMessage());
            return ResponseEntity.ok(managerService.createProjectGroup(projectGroup));
        }
    }

    @GetMapping("/project-groups/project/{projectId}")
    public List<ProjectGroup> getProjectGroupsByProject(@PathVariable Long projectId) {
        return managerService.getProjectGroupsByProject(projectId);
    }

    // Put more specific routes first to avoid path matching conflicts
    @GetMapping("/project-groups/{groupId}/chat-id")
    public ResponseEntity<Map<String, String>> getChatGroupId(
            @PathVariable Long groupId,
            @RequestHeader(value = "X-User-Name", required = false, defaultValue = "manager") String username,
            @RequestHeader(value = "X-Manager-Id", required = false) Long managerId) {
        System.out.println("📞 getChatGroupId called for groupId: " + groupId + ", managerId: " + managerId + ", username: " + username);
        
        // Log all project groups to debug
        try {
            List<ProjectGroup> allGroups = projectGroupRepository.findAll();
            System.out.println("📋 Total project groups in DB: " + allGroups.size());
            for (ProjectGroup g : allGroups) {
                System.out.println("  - Group ID: " + g.getId() + ", Name: " + g.getName() + ", ProjectId: " + g.getProjectId());
            }
        } catch (Exception e) {
            System.err.println("Error listing groups: " + e.getMessage());
        }
        
        try {
            ProjectGroup group;
            try {
                group = managerService.getProjectGroupById(groupId);
                System.out.println("✅ Found project group: " + group.getId() + ", name: " + group.getName());
            } catch (RuntimeException e) {
                // Project group not found
                System.err.println("❌ Project group not found: " + groupId + " - " + e.getMessage());
                System.err.println("   Looking for groupId: " + groupId);
                return ResponseEntity.status(404).body(Map.of("error", "Project group not found", "groupId", String.valueOf(groupId)));
            }
            
            if (group == null) {
                System.err.println("❌ Project group is null for groupId: " + groupId);
                return ResponseEntity.status(404).body(Map.of("error", "Project group is null", "groupId", String.valueOf(groupId)));
            }
            String chatGroupId = group.getChatGroupId();
            
            // If chat group doesn't exist, create it on-demand
            if (chatGroupId == null || chatGroupId.isEmpty()) {
                try {
                    Long finalManagerId = managerId != null ? managerId : group.getProjectId();
                    
                    // Create chat group using ProjectGroupService
                    ProjectGroup updatedGroup = projectGroupService.createChatGroupForExistingProjectGroup(
                        group, 
                        finalManagerId, 
                        username
                    );
                    chatGroupId = updatedGroup.getChatGroupId();
                    
                    if (chatGroupId != null && !chatGroupId.isEmpty()) {
                        return ResponseEntity.ok(Map.of("chatGroupId", chatGroupId, "message", "Chat group created"));
                    }
                } catch (Exception e) {
                    System.err.println("Error creating chat group on-demand: " + e.getMessage());
                    e.printStackTrace();
                    return ResponseEntity.ok(Map.of("chatGroupId", "", "message", "Failed to create chat group: " + e.getMessage()));
                }
                return ResponseEntity.ok(Map.of("chatGroupId", "", "message", "Failed to create chat group. Please try again later."));
            }
            System.out.println("✅ Returning chatGroupId: " + chatGroupId);
            return ResponseEntity.ok(Map.of("chatGroupId", chatGroupId));
        } catch (Exception e) {
            System.err.println("❌ Exception in getChatGroupId: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage(), "detail", e.getClass().getSimpleName()));
        }
    }

    @GetMapping("/project-groups/{managerId}")
    public List<ProjectGroup> getMyProjectGroups(@PathVariable Long managerId) {
        return managerService.getProjectGroupsByManager(managerId);
    }

    @PutMapping("/project-groups/{groupId}/add-employee/{employeeId}")
    public ResponseEntity<ProjectGroup> addEmployeeToGroup(@PathVariable Long groupId, @PathVariable Long employeeId) {
        return ResponseEntity.ok(managerService.addEmployeeToGroup(groupId, employeeId));
    }

    @PutMapping("/project-groups/{groupId}/remove-employee/{employeeId}")
    public ResponseEntity<ProjectGroup> removeEmployeeFromGroup(@PathVariable Long groupId, @PathVariable Long employeeId) {
        return ResponseEntity.ok(managerService.removeEmployeeFromGroup(groupId, employeeId));
    }

    @PutMapping("/project-groups/{groupId}")
    public ResponseEntity<ProjectGroup> updateProjectGroup(@PathVariable Long groupId, @RequestBody ProjectGroup projectGroup) {
        return ResponseEntity.ok(managerService.updateProjectGroup(groupId, projectGroup));
    }

    @DeleteMapping("/project-groups/{groupId}")
    public ResponseEntity<?> deleteProjectGroup(@PathVariable Long groupId) {
        managerService.deleteProjectGroup(groupId);
        return ResponseEntity.ok(Map.of("message", "Project group deleted successfully"));
    }

    @GetMapping("/project-groups/search/{managerId}")
    public List<ProjectGroup> searchProjectGroups(@PathVariable Long managerId, @RequestParam String searchTerm) {
        return managerService.searchProjectGroupsByName(managerId, searchTerm);
    }

    // 7) Admin Visibility
    @GetMapping("/admin/summary")
    public ResponseEntity<Map<String, Object>> getAdminSummary() {
        try {
            return ResponseEntity.ok(managerService.getManagerAdminSummary());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/admin/activities/{managerId}")
    public ResponseEntity<List<Map<String, Object>>> getManagerActivities(@PathVariable Long managerId) {
        try {
            return ResponseEntity.ok(managerService.getManagerActivities(managerId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(List.of(Map.of("error", e.getMessage())));
        }
    }
}
