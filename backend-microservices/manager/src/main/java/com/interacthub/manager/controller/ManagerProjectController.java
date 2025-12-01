package com.interacthub.manager.controller;

import java.time.LocalDate;
import java.util.HashMap;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.manager.model.Project;
import com.interacthub.manager.service.ProjectService;

@RestController
@RequestMapping("/api/manager/projects")
@CrossOrigin(origins = "http://localhost:3000")
public class ManagerProjectController {
    
    @Autowired
    private ProjectService projectService;
    
    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody ProjectCreateRequest request,
                                         @RequestHeader("X-User-Name") String username,
                                         @RequestHeader("X-User-Role") String role,
                                         @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            Project project = projectService.createProject(
                request.getName(),
                request.getDescription(),
                managerId,
                request.getStartDate(),
                request.getEndDate(),
                username,
                role
            );
            
            return ResponseEntity.ok(project);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable Long id,
                                         @RequestBody ProjectUpdateRequest request,
                                         @RequestHeader("X-User-Name") String username,
                                         @RequestHeader("X-User-Role") String role,
                                         @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            Project project = projectService.updateProject(
                id,
                request.getName(),
                request.getDescription(),
                request.getStartDate(),
                request.getEndDate(),
                request.getStatus(),
                managerId,
                username,
                role
            );
            
            return ResponseEntity.ok(project);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<List<Project>> getProjects(@RequestHeader("X-Manager-Id") Long managerId,
                                                   @RequestParam(required = false) String status) {
        List<Project> projects;
        
        if (status != null) {
            try {
                Project.Status projectStatus = Project.Status.valueOf(status.toUpperCase());
                projects = projectService.getProjectsByManagerAndStatus(managerId, projectStatus);
            } catch (IllegalArgumentException e) {
                projects = projectService.getProjectsByManager(managerId);
            }
        } else {
            projects = projectService.getProjectsByManager(managerId);
        }
        
        return ResponseEntity.ok(projects);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getProject(@PathVariable Long id,
                                      @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            Project project = projectService.getProjectById(id, managerId);
            return ResponseEntity.ok(project);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id,
                                         @RequestHeader("X-User-Name") String username,
                                         @RequestHeader("X-User-Role") String role,
                                         @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            projectService.deleteProject(id, managerId, username, role);
            return ResponseEntity.ok(Map.of("message", "Project deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<Project>> getAllProjects() {
        // Admin endpoint to get all projects across all managers
        List<Project> projects = projectService.getAllProjects();
        return ResponseEntity.ok(projects);
    }
    
    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<Project>> getProjectsByManagerId(@PathVariable Long managerId) {
        // Admin endpoint to get projects for a specific manager
        List<Project> projects = projectService.getProjectsByManager(managerId);
        return ResponseEntity.ok(projects);
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getProjectStats(@RequestHeader("X-Manager-Id") Long managerId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProjects", projectService.getProjectCountByManager(managerId));
        stats.put("activeProjects", projectService.getProjectCountByManagerAndStatus(managerId, Project.Status.ACTIVE));
        stats.put("plannedProjects", projectService.getProjectCountByManagerAndStatus(managerId, Project.Status.PLANNED));
        stats.put("completedProjects", projectService.getProjectCountByManagerAndStatus(managerId, Project.Status.COMPLETED));
        
        return ResponseEntity.ok(stats);
    }
    
    // Request DTOs
    public static class ProjectCreateRequest {
        private String name;
        private String description;
        private LocalDate startDate;
        private LocalDate endDate;
        
        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    }
    
    public static class ProjectUpdateRequest {
        private String name;
        private String description;
        private LocalDate startDate;
        private LocalDate endDate;
        private Project.Status status;
        
        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        
        public Project.Status getStatus() { return status; }
        public void setStatus(Project.Status status) { this.status = status; }
    }
}
