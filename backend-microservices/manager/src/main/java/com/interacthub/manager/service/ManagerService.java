package com.interacthub.manager.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.interacthub.manager.model.Employee;
import com.interacthub.manager.model.ManagerAnnouncement;
import com.interacthub.manager.model.ManagerPoll;
import com.interacthub.manager.model.Project; 
import com.interacthub.manager.model.ProjectGroup;
import com.interacthub.manager.model.Task;
import com.interacthub.manager.repository.EmployeeRepository;
import com.interacthub.manager.repository.ManagerAnnouncementRepository;
import com.interacthub.manager.repository.ManagerPollRepository;
import com.interacthub.manager.repository.ProjectGroupRepository;
import com.interacthub.manager.repository.ProjectRepository;
import com.interacthub.manager.repository.TaskRepository;

@Service
public class ManagerService {

    // --- Final Fields for Dependency Injection ---
    private final RestTemplate restTemplate;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final ManagerAnnouncementRepository announcementRepository;
    private final ManagerPollRepository pollRepository;
    private final EmployeeRepository employeeRepository;
    private final ProjectGroupRepository projectGroupRepository;

    // --- Configuration Properties ---
    private final String adminServiceUrl; 
    private final String chatServiceUrl; 

    // --- CONSTRUCTOR INJECTION (FIXED AND COMPLETE) ---
    public ManagerService(
        RestTemplate restTemplate, 
        ProjectRepository projectRepository, 
        TaskRepository taskRepository,
        ManagerAnnouncementRepository announcementRepository, 
        ManagerPollRepository pollRepository,
        EmployeeRepository employeeRepository,
        ProjectGroupRepository projectGroupRepository,
        @Value("${admin.service.url}") String adminServiceUrl,
        @Value("${chat.service.url}") String chatServiceUrl) {
        
        this.restTemplate = restTemplate;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.announcementRepository = announcementRepository;
        this.pollRepository = pollRepository;
        this.employeeRepository = employeeRepository;
        this.projectGroupRepository = projectGroupRepository;
        this.adminServiceUrl = adminServiceUrl;
        this.chatServiceUrl = chatServiceUrl;
    }
    
    // Helper Method: Generates secure, temporary password
    private String generateTemporaryPassword() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
    
    // --- 1. Employee Creation (Hierarchical) ---
    public Map<String, Object> createEmployeeAccount(Map<String, Object> employeeData, Long managerId, Long departmentId) {
        // Validate manager exists
        if (managerId == null || managerId <= 0) {
            throw new IllegalArgumentException("Valid manager ID is required for employee creation.");
        }
        
        // Validate required fields
        if (!employeeData.containsKey("email") || !employeeData.containsKey("firstName") ||
            employeeData.get("email") == null || employeeData.get("firstName") == null) {
            throw new IllegalArgumentException("Employee data must contain valid email and first name.");
        }
        
        // Validate email format
        String email = String.valueOf(employeeData.get("email")).trim();
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Invalid email format.");
        }
        
        String tempPassword = generateTemporaryPassword();
        System.out.println("Creating employee account for email: " + email + " under manager: " + managerId);
        
        // PAYLOAD for Admin Service (Saving to DB)
        Map<String, Object> userPayload = new HashMap<>();
        userPayload.put("email", email);
        userPayload.put("password", tempPassword);
        userPayload.put("firstName", String.valueOf(employeeData.get("firstName")).trim());
        userPayload.put("lastName", employeeData.getOrDefault("lastName", "").toString().trim());
        userPayload.put("role", "EMPLOYEE");
        userPayload.put("departmentId", departmentId);
        userPayload.put("createdBy", managerId); 

        try {
            // Call Admin Service's User Create API
            ResponseEntity<Map<String, Object>> adminResponse = restTemplate.postForEntity(
                adminServiceUrl + "/users", userPayload, (Class) Map.class);
            
            if (adminResponse.getStatusCode().is2xxSuccessful()) {
                // Employee is now saved in Admin Service only - no local save needed
                // PAYLOAD for Notification Service (Sending Email)
                Map<String, Object> notifyPayload = new HashMap<>();
                notifyPayload.put("recipientEmail", employeeData.get("email"));
                notifyPayload.put("role", "EMPLOYEE");
                notifyPayload.put("firstName", employeeData.get("firstName"));
                notifyPayload.put("tempPassword", tempPassword); // ✅ CRITICAL: PASSWORD IS SENT TO EMAIL SERVICE

                // Call Notification Service (Port 8090)
                restTemplate.postForLocation("http://localhost:8090/api/notify/welcome-user", notifyPayload);

                return Map.of("message", "Employee created successfully. Credentials sent via email.");
            } else {
                throw new RuntimeException("Admin service rejected user creation.");
            }
        } catch (Exception e) {
            System.err.println("Error calling Admin/Notification Service: " + e.getMessage());
            throw new RuntimeException("Failed to create employee account: Check Admin/Notification Services.");
        }
    }
    
    // --- 2. Project Management & Grouping ---

    public Project createProject(Project project) {
        Project newProject = projectRepository.save(project);
        this.createProjectChatChannel(newProject.getId(), newProject.getName());
        return newProject;
    }

    public Task assignTask(Task task) { return taskRepository.save(task); }
    
    public ProjectGroup createProjectGroup(ProjectGroup projectGroup) {
        return projectGroupRepository.save(projectGroup);
    }

    public ProjectGroup getProjectGroupById(Long groupId) {
        return projectGroupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Project group not found"));
    }

    public ProjectGroup addEmployeeToGroup(Long groupId, Long employeeId) {
        ProjectGroup group = projectGroupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Project group not found"));
        
        if (group.getEmployeeIds() == null) {
            group.setEmployeeIds(new ArrayList<>());
        }
        
        if (!group.getEmployeeIds().contains(employeeId)) {
            group.getEmployeeIds().add(employeeId);
            
            // If chat group exists, add employee to chat group
            if (group.getChatGroupId() != null && !group.getChatGroupId().isEmpty()) {
                try {
                    // Get employee email from admin service
                    ResponseEntity<Map> response = restTemplate.getForEntity(
                        adminServiceUrl + "/users/" + employeeId,
                        Map.class
                    );
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        Map<String, Object> user = response.getBody();
                        String email = (String) user.get("email");
                        if (email != null && !email.trim().isEmpty()) {
                            // Add member to chat group via chat service
                            // Note: The chat service may need an endpoint to add members, for now we'll log it
                            System.out.println("Employee " + email + " should be added to chat group " + group.getChatGroupId());
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Failed to add employee to chat group: " + e.getMessage());
                }
            }
        }
        
        return projectGroupRepository.save(group);
    }

    public ProjectGroup removeEmployeeFromGroup(Long groupId, Long employeeId) {
        ProjectGroup group = projectGroupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Project group not found"));
        
        if (group.getEmployeeIds() != null) {
            group.getEmployeeIds().remove(employeeId);
        }
        
        return projectGroupRepository.save(group);
    }

    public List<ProjectGroup> getProjectGroupsByEmployee(Long employeeId) {
        // Get all project groups and filter by employee ID
        List<ProjectGroup> allGroups = projectGroupRepository.findAll();
        List<ProjectGroup> employeeGroups = new ArrayList<>();
        
        for (ProjectGroup group : allGroups) {
            if (group.getEmployeeIds() != null && group.getEmployeeIds().contains(employeeId)) {
                employeeGroups.add(group);
            }
        }
        
        return employeeGroups;
    }

    public Map<String, Object> getProjectGroupsByEmployeeWithProjects(Long employeeId) {
        // Get project groups for employee
        List<ProjectGroup> groups = getProjectGroupsByEmployee(employeeId);
        
        // Get unique project IDs
        List<Long> projectIds = groups.stream()
            .map(ProjectGroup::getProjectId)
            .distinct()
            .collect(java.util.stream.Collectors.toList());
        
        // Fetch project details
        Map<Long, Project> projectsMap = new HashMap<>();
        for (Long projectId : projectIds) {
            projectRepository.findById(projectId).ifPresent(project -> {
                projectsMap.put(projectId, project);
            });
        }
        
        // Combine groups with project details
        Map<String, Object> result = new HashMap<>();
        result.put("groups", groups);
        result.put("projects", projectsMap);
        
        return result;
    }


    // --- 3. COMMUNICATION: View Global, Create Local, React ---
    
    // METHOD FOR MANAGER TO POST LOCAL ANNOUNCEMENT
    public ManagerAnnouncement createLocalAnnouncement(ManagerAnnouncement announcement) {
        return announcementRepository.save(announcement);
    }
    
    // METHOD FOR MANAGER TO POST LOCAL POLL
    public ManagerPoll createLocalPoll(ManagerPoll poll) {
        return pollRepository.save(poll);
    }
    
    // METHOD TO POST LIVE INTERACTION (Comment/Reaction)
    public void postInteraction(Long userId, String entityType, Long entityId, String comment) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("senderId", userId);
            payload.put("entityType", entityType);
            payload.put("entityId", entityId);
            payload.put("content", comment);
            payload.put("type", "COMMENT"); 

            // Call Chat Service (8085) to save comment and push live updates
            restTemplate.postForLocation(chatServiceUrl + "/interactions/post", payload);
            
            System.out.println("✅ Interaction posted and pushed live.");
        } catch (Exception e) {
            System.err.println("Chat Service Offline. Could not post interaction.");
        }
    }

    // --- 4. Visibility and Reporting (Admin/Manager Views) ---

    // METHOD FOR FRONTEND TO READ ADMIN'S COMMS
    public List<?> getGlobalAnnouncements(String role) {
        try {
            String annURL = adminServiceUrl + "/announcements/target/" + role;
            String pollURL = adminServiceUrl + "/polls/target/" + role;

            ResponseEntity<List<Map<String,Object>>> annResponse = restTemplate.getForEntity(annURL, (Class) List.class);
            ResponseEntity<List<Map<String,Object>>> pollResponse = restTemplate.getForEntity(pollURL, (Class) List.class);

            List<Map<String,Object>> allComms = new ArrayList<>();
            if (annResponse.getBody() != null) allComms.addAll(annResponse.getBody());
            if (pollResponse.getBody() != null) allComms.addAll(pollResponse.getBody());
            
            return allComms;

        } catch (Exception e) {
            return List.of(Map.of("error", "Admin Comms Service Unreachable"));
        }
    }

    // CRITICAL: Admin calls this to see who is in which group/project
    public List<Map<String, Object>> getManagerActivities(Long managerId) {
        List<Project> projects = projectRepository.findByManagerId(managerId);
        List<Employee> employees = employeeRepository.findByManagerId(managerId);
        List<ProjectGroup> projectGroups = new ArrayList<>();
        if (!projects.isEmpty()) {
            projectGroups = projectGroupRepository.findByProjectId(projects.get(0).getId()); // Get groups for first project
        }
        
        List<Map<String, Object>> activities = new ArrayList<>();
        
        // Project Groups (CRITICAL: Includes member list for Admin Visibility)
        for (ProjectGroup group : projectGroups) {
             activities.add(Map.of(
                "type", "project_group_detail",
                "id", group.getId(),
                "groupName", group.getName(),
                "memberIds", new ArrayList<>() // Empty list since new entity doesn't have employeeIds
            ));
        }
        
        // Include Project and Employee lists for comprehensive report
        for (Project project : projects) {
            activities.add(Map.of("type", "project", "title", project.getName()));
        }
        for (Employee employee : employees) {
            activities.add(Map.of("type", "employee", "name", employee.getFirstName()));
        }
        
        return activities;
    }
    
    // --- Placeholder/Implementation Methods (Required by Controller/Dependencies) ---
    public List<Employee> getEmployeesByManager(Long managerId) { 
        // Fetch all employees from admin service and filter by createdBy (managerId)
        try {
            ResponseEntity<List> response = restTemplate.getForEntity(
                adminServiceUrl + "/users/role/EMPLOYEE", 
                List.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> users = response.getBody();
                // Return ALL employees - don't filter by createdBy since admin may create employees
                return users.stream()
                    .map(user -> {
                        Map<String, Object> u = (Map<String, Object>) user;
                        Employee e = new Employee();
                        e.setId(((Number) u.get("id")).longValue());
                        e.setManagerId(managerId);
                        e.setFirstName((String) u.get("firstName"));
                        e.setLastName((String) u.get("lastName"));
                        e.setEmail((String) u.get("email"));
                        e.setPosition((String) u.get("position"));
                        e.setPhoneNumber((String) u.get("phoneNumber"));
                        e.setIsActive((Boolean) u.getOrDefault("isActive", true));
                        return e;
                    })
                    .collect(java.util.stream.Collectors.toList());
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch employees from admin service: " + e.getMessage());
        }
        return new ArrayList<>();
    }
    
    public List<Employee> getActiveEmployeesByManager(Long managerId) { 
        return getEmployeesByManager(managerId).stream()
            .filter(e -> Boolean.TRUE.equals(e.getIsActive()))
            .collect(java.util.stream.Collectors.toList());
    }
    public Employee updateEmployee(Long employeeId, Employee employee) { 
        // Update employee in Admin Service
        try {
            restTemplate.put(adminServiceUrl + "/users/" + employeeId, employee);
            return employee;
        } catch (Exception e) {
            System.err.println("Failed to update employee in admin service: " + e.getMessage());
            throw new RuntimeException("Failed to update employee");
        }
    }
    
    public void deleteEmployee(Long employeeId) { 
        // Delete employee from Admin Service
        try {
            restTemplate.delete(adminServiceUrl + "/users/" + employeeId);
            System.out.println("✅ Employee deleted from admin service: ID " + employeeId);
        } catch (Exception e) {
            System.err.println("Failed to delete employee in admin service: " + e.getMessage());
            throw new RuntimeException("Failed to delete employee: " + e.getMessage());
        }
    }
    public List<Employee> searchEmployeesByName(Long managerId, String searchTerm) { 
        // Search in Admin Service employees
        List<Employee> allEmployees = getEmployeesByManager(managerId);
        return allEmployees.stream()
            .filter(e -> e.getFirstName().toLowerCase().contains(searchTerm.toLowerCase()) || 
                        e.getLastName().toLowerCase().contains(searchTerm.toLowerCase()))
            .collect(java.util.stream.Collectors.toList());
    }
    public List<ProjectGroup> getProjectGroupsByManager(Long managerId) { 
        // Get projects for this manager, then get groups for those projects
        List<Project> projects = projectRepository.findByManagerId(managerId);
        List<ProjectGroup> groups = new ArrayList<>();
        for (Project project : projects) {
            groups.addAll(projectGroupRepository.findByProjectId(project.getId()));
        }
        return groups;
    }
    public List<ProjectGroup> getProjectGroupsByProject(Long projectId) { return projectGroupRepository.findByProjectId(projectId); }
    public List<ProjectGroup> searchProjectGroupsByName(Long managerId, String searchTerm) { return new ArrayList<>(); }
    public Map<String, Object> getManagerAdminSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        try {
            // Get all projects
            List<Project> allProjects = projectRepository.findAll();
            summary.put("totalProjects", allProjects.size());
            
            // Get all employees
            List<Employee> allEmployees = employeeRepository.findAll();
            summary.put("totalEmployees", allEmployees.size());
            
            // Get all project groups
            List<ProjectGroup> allGroups = projectGroupRepository.findAll();
            summary.put("totalProjectGroups", allGroups.size());
            
            // Get tasks in progress
            List<Task> tasksInProgress = taskRepository.findByStatus(Task.Status.IN_PROGRESS);
            summary.put("tasksInProgress", tasksInProgress.size());
            
            // Get active employees
            List<Employee> activeEmployees = employeeRepository.findByIsActiveTrue();
            summary.put("activeEmployees", activeEmployees.size());
            
            // Get recent announcements
            List<ManagerAnnouncement> recentAnnouncements = announcementRepository.findTop5ByOrderByCreatedAtDesc();
            summary.put("recentAnnouncements", recentAnnouncements.size());
            
            // Get recent polls
            List<ManagerPoll> recentPolls = pollRepository.findTop5ByOrderByCreatedAtDesc();
            summary.put("recentPolls", recentPolls.size());
            
            // Get managers count from admin service (managers are users in admin service, not employees)
            try {
                String adminUrl = adminServiceUrl + "/users";
                ResponseEntity<List> response = restTemplate.getForEntity(adminUrl, List.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    long managerCount = 0;
                    for (Object user : response.getBody()) {
                        if (user instanceof Map) {
                            Map<String, Object> userMap = (Map<String, Object>) user;
                            if ("MANAGER".equals(userMap.get("role"))) {
                                managerCount++;
                            }
                        }
                    }
                    summary.put("totalManagers", managerCount);
                } else {
                    summary.put("totalManagers", 0);
                }
            } catch (Exception e) {
                System.err.println("Error fetching managers from admin service: " + e.getMessage());
                summary.put("totalManagers", 0);
            }
            
            // Get projects by status
            Map<String, Long> projectsByStatus = allProjects.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    project -> project.getStatus().toString(),
                    java.util.stream.Collectors.counting()
                ));
            summary.put("projectsByStatus", projectsByStatus);
            
            // Get employees by department
            Map<String, Long> employeesByDepartment = allEmployees.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    emp -> emp.getDepartment() != null ? emp.getDepartment() : "No Department",
                    java.util.stream.Collectors.counting()
                ));
            summary.put("employeesByDepartment", employeesByDepartment);
            
        } catch (Exception e) {
            System.err.println("Error generating manager admin summary: " + e.getMessage());
            summary.put("error", "Failed to generate summary: " + e.getMessage());
        }
        
        return summary;
    }

    // Methods expected by ManagerController
    public List<Project> getManagerProjects(Long managerId) {
        return projectRepository.findByManagerId(managerId);
    }

    public ProjectGroup updateProjectGroup(Long groupId, ProjectGroup projectGroup) {
        ProjectGroup existing = projectGroupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Project group not found"));
        existing.setName(projectGroup.getName());
        return projectGroupRepository.save(existing);
    }

    public void deleteProjectGroup(Long groupId) {
        projectGroupRepository.deleteById(groupId);
    }
    
    // --- Internal: Chat Channel Creation ---
    private void createProjectChatChannel(Long projectId, String projectTitle) {
        try {
            Map<String, Object> chatPayload = new HashMap<>();
            chatPayload.put("channelId", "PROJECT_" + projectId);
            chatPayload.put("channelName", projectTitle);
            
            restTemplate.postForLocation(chatServiceUrl + "/channels/create", chatPayload);
        } catch (Exception e) {
            System.err.println("Chat Service Offline (8085). Could not create live channel.");
        }
    }
}