package com.interacthub.manager.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.interacthub.manager.model.Project;
import com.interacthub.manager.repository.ProjectRepository;

@Service
@Transactional
public class ProjectService {
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private AuditLogService auditLogService;
    
    public Project createProject(String name, String description, Long managerId, 
                                LocalDate startDate, LocalDate endDate, String username, String role) {
        
        Project project = new Project(name, description, managerId);
        project.setStartDate(startDate);
        project.setEndDate(endDate);
        
        Project savedProject = projectRepository.save(project);
        
        // Log the action
        auditLogService.logProjectAction(username, role, "PROJECT_CREATE", savedProject.getId());
        
        return savedProject;
    }
    
    public Project updateProject(Long projectId, String name, String description, 
                               LocalDate startDate, LocalDate endDate, Project.Status status,
                               Long managerId, String username, String role) {
        
        Optional<Project> projectOpt = projectRepository.findByIdAndManagerId(projectId, managerId);
        if (projectOpt.isEmpty()) {
            throw new RuntimeException("Project not found or access denied");
        }
        
        Project project = projectOpt.get();
        project.setName(name);
        project.setDescription(description);
        project.setStartDate(startDate);
        project.setEndDate(endDate);
        project.setStatus(status);
        
        Project savedProject = projectRepository.save(project);
        
        // Log the action
        auditLogService.logProjectAction(username, role, "PROJECT_UPDATE", savedProject.getId());
        
        return savedProject;
    }
    
    public List<Project> getProjectsByManager(Long managerId) {
        return projectRepository.findByManagerId(managerId);
    }
    
    public List<Project> getProjectsByManagerAndStatus(Long managerId, Project.Status status) {
        return projectRepository.findByManagerIdAndStatus(managerId, status);
    }
    
    public Optional<Project> getProjectByIdAndManager(Long projectId, Long managerId) {
        return projectRepository.findByIdAndManagerId(projectId, managerId);
    }
    
    public Project getProjectById(Long projectId, Long managerId) {
        return projectRepository.findByIdAndManagerId(projectId, managerId)
                .orElseThrow(() -> new RuntimeException("Project not found or access denied"));
    }
    
    public void deleteProject(Long projectId, Long managerId, String username, String role) {
        Optional<Project> projectOpt = projectRepository.findByIdAndManagerId(projectId, managerId);
        if (projectOpt.isEmpty()) {
            throw new RuntimeException("Project not found or access denied");
        }
        
        projectRepository.deleteById(projectId);
        
        // Log the action
        auditLogService.logProjectAction(username, role, "PROJECT_DELETE", projectId);
    }
    
    public long getProjectCountByManager(Long managerId) {
        return projectRepository.countByManagerId(managerId);
    }
    
    public long getProjectCountByManagerAndStatus(Long managerId, Project.Status status) {
        return projectRepository.countByManagerIdAndStatus(managerId, status);
    }
    
    public boolean isProjectOwnedByManager(Long projectId, Long managerId) {
        return projectRepository.findByIdAndManagerId(projectId, managerId).isPresent();
    }
    
    public List<Project> getAllProjects() {
        // Admin method to get all projects
        return projectRepository.findAll();
    }
}
