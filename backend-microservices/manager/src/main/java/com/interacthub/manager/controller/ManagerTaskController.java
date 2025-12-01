package com.interacthub.manager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.manager.model.Task;
import com.interacthub.manager.service.TaskService;

@RestController
@RequestMapping("/api/manager")
@CrossOrigin(origins = "http://localhost:3000")
public class ManagerTaskController {
    
    @Autowired
    private TaskService taskService;
    
    @PostMapping("/projects/{projectId}/groups/{groupId}/tasks")
    public ResponseEntity<?> createTask(@PathVariable Long projectId,
                                      @PathVariable Long groupId,
                                      @RequestBody TaskCreateRequest request,
                                      @RequestHeader("X-User-Name") String username,
                                      @RequestHeader("X-User-Role") String role,
                                      @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            Task task = taskService.createTask(
                groupId,
                request.getTitle(),
                request.getDescription(),
                request.getAssigneeId(),
                request.getPriority(),
                request.getDueDate(),
                managerId,
                username,
                role
            );
            
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<?> updateTask(@PathVariable Long taskId,
                                      @RequestBody TaskUpdateRequest request,
                                      @RequestHeader("X-User-Name") String username,
                                      @RequestHeader("X-User-Role") String role,
                                      @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            Task task = taskService.updateTask(
                taskId,
                request.getTitle(),
                request.getDescription(),
                request.getStatus(),
                request.getPriority(),
                request.getDueDate(),
                managerId,
                username,
                role
            );
            
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/tasks/{taskId}/assign")
    public ResponseEntity<?> assignTask(@PathVariable Long taskId,
                                      @RequestBody TaskAssignRequest request,
                                      @RequestHeader("X-User-Name") String username,
                                      @RequestHeader("X-User-Role") String role,
                                      @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            Task task = taskService.assignTask(
                taskId,
                request.getAssigneeId(),
                managerId,
                username,
                role
            );
            
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/tasks")
    public ResponseEntity<List<Task>> getTasks(@RequestHeader("X-Manager-Id") Long managerId,
                                              @RequestParam(required = false) String status,
                                              @RequestParam(required = false) Long assigneeId) {
        List<Task> tasks;
        
        if (assigneeId != null) {
            tasks = taskService.getTasksByAssignee(assigneeId);
        } else if (status != null) {
            try {
                Task.Status taskStatus = Task.Status.valueOf(status.toUpperCase());
                tasks = taskService.getTasksByStatus(taskStatus);
            } catch (IllegalArgumentException e) {
                tasks = taskService.getTasksByManager(managerId);
            }
        } else {
            tasks = taskService.getTasksByManager(managerId);
        }
        
        return ResponseEntity.ok(tasks);
    }
    
    @GetMapping("/projects/{projectId}/groups/{groupId}/tasks")
    public ResponseEntity<?> getTasksByProjectGroup(@PathVariable Long projectId,
                                                   @PathVariable Long groupId,
                                                   @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            List<Task> tasks = taskService.getTasksByProjectGroup(groupId, managerId);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/tasks/stats")
    public ResponseEntity<Map<String, Object>> getTaskStats(@RequestHeader("X-Manager-Id") Long managerId) {
        Map<String, Object> stats = Map.of(
            "totalTasks", taskService.getTaskCountByStatus(Task.Status.TODO) + 
                         taskService.getTaskCountByStatus(Task.Status.IN_PROGRESS) +
                         taskService.getTaskCountByStatus(Task.Status.DONE),
            "todoTasks", taskService.getTaskCountByStatus(Task.Status.TODO),
            "inProgressTasks", taskService.getTaskCountByStatus(Task.Status.IN_PROGRESS),
            "doneTasks", taskService.getTaskCountByStatus(Task.Status.DONE),
            "blockedTasks", taskService.getTaskCountByStatus(Task.Status.BLOCKED)
        );
        
        return ResponseEntity.ok(stats);
    }
    
    // Request DTOs
    public static class TaskCreateRequest {
        private String title;
        private String description;
        private Long assigneeId;
        private Task.Priority priority = Task.Priority.MEDIUM;
        private LocalDate dueDate;
        
        // Getters and Setters
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public Long getAssigneeId() { return assigneeId; }
        public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
        
        public Task.Priority getPriority() { return priority; }
        public void setPriority(Task.Priority priority) { this.priority = priority; }
        
        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    }
    
    public static class TaskUpdateRequest {
        private String title;
        private String description;
        private Task.Status status;
        private Task.Priority priority;
        private LocalDate dueDate;
        
        // Getters and Setters
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public Task.Status getStatus() { return status; }
        public void setStatus(Task.Status status) { this.status = status; }
        
        public Task.Priority getPriority() { return priority; }
        public void setPriority(Task.Priority priority) { this.priority = priority; }
        
        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    }
    
    public static class TaskAssignRequest {
        private Long assigneeId;
        
        // Getters and Setters
        public Long getAssigneeId() { return assigneeId; }
        public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
    }
}
