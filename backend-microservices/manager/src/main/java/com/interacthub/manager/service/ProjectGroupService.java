package com.interacthub.manager.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.interacthub.manager.model.Project;
import com.interacthub.manager.model.ProjectGroup;
import com.interacthub.manager.repository.ProjectGroupRepository;
import com.interacthub.manager.repository.ProjectRepository;

@Service
@Transactional
public class ProjectGroupService {
    
    @Autowired
    private ProjectGroupRepository projectGroupRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Value("${admin.service.url}")
    private String adminServiceUrl;
    
    @Value("${chat.service.url}")
    private String chatServiceUrl;
    
    public ProjectGroup createProjectGroup(Long projectId, String name, String description, 
                                         Long managerId, String username, String role, List<Long> employeeIds) {
        
        // Validate that project exists and is owned by manager
        Optional<Project> projectOpt = projectRepository.findByIdAndManagerId(projectId, managerId);
        if (projectOpt.isEmpty()) {
            throw new RuntimeException("Project not found or access denied");
        }
        
        ProjectGroup projectGroup = new ProjectGroup(projectId, name, description);
        // Set employee IDs if provided
        if (employeeIds != null && !employeeIds.isEmpty()) {
            projectGroup.setEmployeeIds(employeeIds);
            System.out.println("✅ Setting " + employeeIds.size() + " employee IDs on project group: " + employeeIds);
        } else {
            System.out.println("⚠️ No employee IDs provided for project group");
        }
        ProjectGroup savedGroup = projectGroupRepository.save(projectGroup);
        System.out.println("💾 Saved project group ID: " + savedGroup.getId() + " with " + 
                          (savedGroup.getEmployeeIds() != null ? savedGroup.getEmployeeIds().size() : 0) + " employees");
        
        // Preserve employeeIds before chat group creation
        List<Long> preservedEmployeeIds = savedGroup.getEmployeeIds() != null ? 
            new ArrayList<>(savedGroup.getEmployeeIds()) : new ArrayList<>();
        
        // Create chat group for this project group
        try {
            String chatGroupId = createChatGroupForProjectGroup(savedGroup, managerId, username);
            savedGroup.setChatGroupId(chatGroupId);
            // Ensure employeeIds are preserved when saving again
            savedGroup.setEmployeeIds(preservedEmployeeIds);
            savedGroup = projectGroupRepository.save(savedGroup);
            System.out.println("💾 Saved project group again after chat group creation. Employee count: " + 
                              (savedGroup.getEmployeeIds() != null ? savedGroup.getEmployeeIds().size() : 0));
        } catch (Exception e) {
            System.err.println("Failed to create chat group for project group: " + e.getMessage());
            // Continue without chat group - don't fail the project group creation
        }
        
        // Log the action
        auditLogService.logGroupAction(username, role, "GROUP_CREATE", projectId, savedGroup.getId());
        
        System.out.println("✅ Returning project group ID: " + savedGroup.getId() + " with " + 
                          (savedGroup.getEmployeeIds() != null ? savedGroup.getEmployeeIds().size() : 0) + " employees");
        
        return savedGroup;
    }
    
    private String createChatGroupForProjectGroup(ProjectGroup projectGroup, Long managerId, String managerUsername) {
        try {
            // Get manager email
            String managerEmail = managerUsername; // username is typically the email
            
            // Get employee emails from the project group
            List<String> memberEmails = new ArrayList<>();
            memberEmails.add(managerEmail); // Add manager as a member
            
            // Get employee emails
            if (projectGroup.getEmployeeIds() != null && !projectGroup.getEmployeeIds().isEmpty()) {
                for (Long employeeId : projectGroup.getEmployeeIds()) {
                    try {
                        // Try to get employee email from admin service
                        @SuppressWarnings("unchecked")
                        ResponseEntity<Map<String, Object>> response = restTemplate.getForEntity(
                            adminServiceUrl + "/users/" + employeeId,
                            (Class<Map<String, Object>>) (Class<?>) Map.class
                        );
                        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                            Map<String, Object> user = response.getBody();
                            Object emailObj = user.get("email");
                            if (emailObj != null) {
                                String email = String.valueOf(emailObj);
                                if (!email.trim().isEmpty()) {
                                    memberEmails.add(email.trim().toLowerCase());
                                }
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Failed to get email for employee " + employeeId + ": " + e.getMessage());
                    }
                }
            }
            
            // Create chat group
            Map<String, Object> chatGroupRequest = new HashMap<>();
            chatGroupRequest.put("name", projectGroup.getName());
            chatGroupRequest.put("createdByName", managerEmail);
            chatGroupRequest.put("members", memberEmails);
            
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                chatServiceUrl.replace("/chat", "/group/create"),
                chatGroupRequest,
                (Class<Map<String, Object>>) (Class<?>) Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> chatGroup = response.getBody();
                Object groupIdObj = chatGroup.get("groupId");
                if (groupIdObj != null) {
                    return String.valueOf(groupIdObj);
                }
            }
        } catch (Exception e) {
            System.err.println("Error creating chat group: " + e.getMessage());
            throw e;
        }
        return null;
    }
    
    public ProjectGroup createChatGroupForExistingProjectGroup(ProjectGroup projectGroup, Long managerId, String managerUsername) {
        try {
            // Only create if chat group doesn't exist
            if (projectGroup.getChatGroupId() != null && !projectGroup.getChatGroupId().isEmpty()) {
                return projectGroup;
            }
            
            // Create chat group
            String chatGroupId = createChatGroupForProjectGroup(projectGroup, managerId, managerUsername);
            
            if (chatGroupId != null && !chatGroupId.isEmpty()) {
                projectGroup.setChatGroupId(chatGroupId);
                return projectGroupRepository.save(projectGroup);
            }
        } catch (Exception e) {
            System.err.println("Error creating chat group for existing project group: " + e.getMessage());
            throw e;
        }
        return projectGroup;
    }
    
    public List<ProjectGroup> getProjectGroups(Long projectId, Long managerId) {
        // Validate that project exists and is owned by manager
        Optional<Project> projectOpt = projectRepository.findByIdAndManagerId(projectId, managerId);
        if (projectOpt.isEmpty()) {
            throw new RuntimeException("Project not found or access denied");
        }
        
        return projectGroupRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }
    
    public ProjectGroup getProjectGroupById(Long groupId, Long projectId, Long managerId) {
        // Validate that project exists and is owned by manager
        Optional<Project> projectOpt = projectRepository.findByIdAndManagerId(projectId, managerId);
        if (projectOpt.isEmpty()) {
            throw new RuntimeException("Project not found or access denied");
        }
        
        return projectGroupRepository.findById(groupId)
                .filter(group -> group.getProjectId().equals(projectId))
                .orElseThrow(() -> new RuntimeException("Project group not found"));
    }
    
    public ProjectGroup updateProjectGroup(Long groupId, Long projectId, String name, String description,
                                         Long managerId, String username, String role) {
        
        ProjectGroup group = getProjectGroupById(groupId, projectId, managerId);
        group.setName(name);
        group.setDescription(description);
        
        ProjectGroup savedGroup = projectGroupRepository.save(group);
        
        // Log the action
        auditLogService.logGroupAction(username, role, "GROUP_UPDATE", projectId, savedGroup.getId());
        
        return savedGroup;
    }
    
    public void deleteProjectGroup(Long groupId, Long projectId, Long managerId, String username, String role) {
        ProjectGroup group = getProjectGroupById(groupId, projectId, managerId);
        projectGroupRepository.deleteById(groupId);
        
        // Log the action
        auditLogService.logGroupAction(username, role, "GROUP_DELETE", projectId, groupId);
    }
    
    public long getProjectGroupCount(Long projectId) {
        return projectGroupRepository.countByProjectId(projectId);
    }
    
    public boolean isProjectGroupValid(Long groupId, Long projectId, Long managerId) {
        // Validate that project exists and is owned by manager
        Optional<Project> projectOpt = projectRepository.findByIdAndManagerId(projectId, managerId);
        if (projectOpt.isEmpty()) {
            return false;
        }
        
        return projectGroupRepository.findById(groupId)
                .map(group -> group.getProjectId().equals(projectId))
                .orElse(false);
    }
}
