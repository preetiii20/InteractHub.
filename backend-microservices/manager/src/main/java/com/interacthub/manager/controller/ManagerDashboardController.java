package com.interacthub.manager.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.manager.model.OnboardRequest;
import com.interacthub.manager.model.Project;
import com.interacthub.manager.model.Task;
import com.interacthub.manager.service.OnboardService;
import com.interacthub.manager.service.ProjectService;
import com.interacthub.manager.service.TaskService;

@RestController
@RequestMapping("/api/manager/dashboard")
@CrossOrigin(origins = "http://localhost:3000")
public class ManagerDashboardController {
    
    @Autowired
    private ProjectService projectService;
    
    @Autowired
    private TaskService taskService;
    
    @Autowired
    private OnboardService onboardService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard(@RequestHeader("X-Manager-Id") Long managerId) {
        Map<String, Object> dashboard = new HashMap<>();
        
        // Project Statistics
        Map<String, Object> projectStats = new HashMap<>();
        projectStats.put("totalProjects", projectService.getProjectCountByManager(managerId));
        projectStats.put("activeProjects", projectService.getProjectCountByManagerAndStatus(managerId, Project.Status.ACTIVE));
        projectStats.put("plannedProjects", projectService.getProjectCountByManagerAndStatus(managerId, Project.Status.PLANNED));
        projectStats.put("completedProjects", projectService.getProjectCountByManagerAndStatus(managerId, Project.Status.COMPLETED));
        dashboard.put("projects", projectStats);
        
        // Task Statistics
        Map<String, Object> taskStats = new HashMap<>();
        taskStats.put("totalTasks", taskService.getTaskCountByStatus(Task.Status.TODO) + 
                                  taskService.getTaskCountByStatus(Task.Status.IN_PROGRESS) +
                                  taskService.getTaskCountByStatus(Task.Status.DONE));
        taskStats.put("todoTasks", taskService.getTaskCountByStatus(Task.Status.TODO));
        taskStats.put("inProgressTasks", taskService.getTaskCountByStatus(Task.Status.IN_PROGRESS));
        taskStats.put("doneTasks", taskService.getTaskCountByStatus(Task.Status.DONE));
        taskStats.put("blockedTasks", taskService.getTaskCountByStatus(Task.Status.BLOCKED));
        dashboard.put("tasks", taskStats);
        
        // Onboard Request Statistics
        Map<String, Object> onboardStats = new HashMap<>();
        onboardStats.put("totalRequests", onboardService.getOnboardRequestCountByManager(managerId));
        onboardStats.put("pendingRequests", onboardService.getOnboardRequestCountByManagerAndStatus(managerId, OnboardRequest.Status.PENDING));
        onboardStats.put("approvedRequests", onboardService.getOnboardRequestCountByManagerAndStatus(managerId, OnboardRequest.Status.APPROVED));
        onboardStats.put("rejectedRequests", onboardService.getOnboardRequestCountByManagerAndStatus(managerId, OnboardRequest.Status.REJECTED));
        dashboard.put("onboardRequests", onboardStats);
        
        // Recent Activities
        List<Project> recentProjects = projectService.getProjectsByManager(managerId)
                .stream()
                .limit(5)
                .toList();
        dashboard.put("recentProjects", recentProjects);
        
        List<Task> recentTasks = taskService.getTasksByManager(managerId)
                .stream()
                .limit(10)
                .toList();
        dashboard.put("recentTasks", recentTasks);
        
        List<OnboardRequest> recentOnboardRequests = onboardService.getOnboardRequestsByManager(managerId)
                .stream()
                .limit(5)
                .toList();
        dashboard.put("recentOnboardRequests", recentOnboardRequests);
        
        return ResponseEntity.ok(dashboard);
    }
    
    @GetMapping("/quick-actions")
    public ResponseEntity<Map<String, Object>> getQuickActions(@RequestHeader("X-Manager-Id") Long managerId) {
        Map<String, Object> quickActions = new HashMap<>();
        
        // Check if manager has any projects to enable group creation
        boolean hasProjects = projectService.getProjectCountByManager(managerId) > 0;
        quickActions.put("canCreateGroup", hasProjects);
        
        // Check if manager has any pending onboard requests
        boolean hasPendingRequests = onboardService.getOnboardRequestCountByManagerAndStatus(managerId, OnboardRequest.Status.PENDING) > 0;
        quickActions.put("hasPendingRequests", hasPendingRequests);
        
        // Get project list for quick project selection
        List<Project> projects = projectService.getProjectsByManager(managerId);
        quickActions.put("availableProjects", projects);
        
        return ResponseEntity.ok(quickActions);
    }
}
