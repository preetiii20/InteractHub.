package com.interacthub.manager.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.manager.model.ProjectGroup;
import com.interacthub.manager.service.ProjectGroupService;

@RestController
@RequestMapping("/api/manager/projects/{projectId}/groups")
@CrossOrigin(origins = "http://localhost:3000")
public class ManagerGroupController {
    
    @Autowired
    private ProjectGroupService projectGroupService;
    
    @PostMapping
    public ResponseEntity<?> createProjectGroup(@PathVariable Long projectId,
                                               @RequestBody ProjectGroupCreateRequest request,
                                               @RequestHeader("X-User-Name") String username,
                                               @RequestHeader("X-User-Role") String role,
                                               @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            ProjectGroup group = projectGroupService.createProjectGroup(
                projectId,
                request.getName(),
                request.getDescription(),
                managerId,
                username,
                role,
                request.getEmployeeIds()
            );
            
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<?> getProjectGroups(@PathVariable Long projectId,
                                             @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            List<ProjectGroup> groups = projectGroupService.getProjectGroups(projectId, managerId);
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{groupId}")
    public ResponseEntity<?> getProjectGroup(@PathVariable Long projectId,
                                           @PathVariable Long groupId,
                                           @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            ProjectGroup group = projectGroupService.getProjectGroupById(groupId, projectId, managerId);
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/{groupId}")
    public ResponseEntity<?> updateProjectGroup(@PathVariable Long projectId,
                                               @PathVariable Long groupId,
                                               @RequestBody ProjectGroupUpdateRequest request,
                                               @RequestHeader("X-User-Name") String username,
                                               @RequestHeader("X-User-Role") String role,
                                               @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            ProjectGroup group = projectGroupService.updateProjectGroup(
                groupId,
                projectId,
                request.getName(),
                request.getDescription(),
                managerId,
                username,
                role
            );
            
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteProjectGroup(@PathVariable Long projectId,
                                               @PathVariable Long groupId,
                                               @RequestHeader("X-User-Name") String username,
                                               @RequestHeader("X-User-Role") String role,
                                               @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            projectGroupService.deleteProjectGroup(groupId, projectId, managerId, username, role);
            return ResponseEntity.ok(Map.of("message", "Project group deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getProjectGroupStats(@PathVariable Long projectId,
                                                                   @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            Map<String, Object> stats = Map.of(
                "totalGroups", projectGroupService.getProjectGroupCount(projectId)
            );
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Request DTOs
    public static class ProjectGroupCreateRequest {
        private String name;
        private String description;
        private java.util.List<Long> employeeIds;
        
        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public java.util.List<Long> getEmployeeIds() { return employeeIds; }
        public void setEmployeeIds(java.util.List<Long> employeeIds) { this.employeeIds = employeeIds; }
    }
    
    public static class ProjectGroupUpdateRequest {
        private String name;
        private String description;
        
        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}
