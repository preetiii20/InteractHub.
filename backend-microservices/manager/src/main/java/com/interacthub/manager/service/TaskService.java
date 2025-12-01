package com.interacthub.manager.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.interacthub.manager.model.Task;
import com.interacthub.manager.repository.ProjectGroupRepository;
import com.interacthub.manager.repository.ProjectRepository;
import com.interacthub.manager.repository.TaskRepository;

@Service
@Transactional
public class TaskService {
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private ProjectGroupRepository projectGroupRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Autowired
    private RestTemplate restTemplate;
    
    private static final String ADMIN_SERVICE_URL = "http://localhost:8081/api/admin";
    private static final String NOTIFICATION_SERVICE_URL = "http://localhost:8090/api/notify";
    
    public Task createTask(Long projectGroupId, String title, String description, 
                          Long assigneeId, Task.Priority priority, LocalDate dueDate,
                          Long managerId, String username, String role) {
        
        // Validate that project group exists and project is owned by manager
        if (!isProjectGroupValidForManager(projectGroupId, managerId)) {
            throw new RuntimeException("Project group not found or access denied");
        }
        
        // Validate assignee exists (check with admin service)
        if (!isEmployeeValid(assigneeId)) {
            throw new RuntimeException("Assignee not found or invalid");
        }
        
        Task task = new Task(projectGroupId, title, description, assigneeId);
        task.setPriority(priority);
        task.setDueDate(dueDate);
        
        Task savedTask = taskRepository.save(task);
        
        // Log the action
        auditLogService.logTaskAction(username, role, "TASK_CREATE", savedTask.getId());
        
        // Notify assignee
        notifyTaskAssignment(savedTask, assigneeId);
        
        return savedTask;
    }
    
    public Task updateTask(Long taskId, String title, String description, 
                          Task.Status status, Task.Priority priority, LocalDate dueDate,
                          Long managerId, String username, String role) {
        
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isEmpty()) {
            throw new RuntimeException("Task not found");
        }
        
        Task task = taskOpt.get();
        
        // Validate that task belongs to a project owned by manager
        if (!isTaskValidForManager(taskId, managerId)) {
            throw new RuntimeException("Task not found or access denied");
        }
        
        task.setTitle(title);
        task.setDescription(description);
        task.setStatus(status);
        task.setPriority(priority);
        task.setDueDate(dueDate);
        
        Task savedTask = taskRepository.save(task);
        
        // Log the action
        auditLogService.logTaskAction(username, role, "TASK_UPDATE", savedTask.getId());
        
        return savedTask;
    }
    
    public Task assignTask(Long taskId, Long assigneeId, Long managerId, String username, String role) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isEmpty()) {
            throw new RuntimeException("Task not found");
        }
        
        Task task = taskOpt.get();
        
        // Validate that task belongs to a project owned by manager
        if (!isTaskValidForManager(taskId, managerId)) {
            throw new RuntimeException("Task not found or access denied");
        }
        
        // Validate assignee exists
        if (!isEmployeeValid(assigneeId)) {
            throw new RuntimeException("Assignee not found or invalid");
        }
        
        task.setAssigneeId(assigneeId);
        Task savedTask = taskRepository.save(task);
        
        // Log the action
        auditLogService.logTaskAction(username, role, "TASK_ASSIGN", savedTask.getId());
        
        // Notify assignee
        notifyTaskAssignment(savedTask, assigneeId);
        
        return savedTask;
    }
    
    public List<Task> getTasksByProjectGroup(Long projectGroupId, Long managerId) {
        if (!isProjectGroupValidForManager(projectGroupId, managerId)) {
            throw new RuntimeException("Project group not found or access denied");
        }
        
        return taskRepository.findByProjectGroupId(projectGroupId);
    }
    
    public List<Task> getTasksByManager(Long managerId) {
        // Get all projects owned by manager, then get all tasks in those projects
        List<Long> projectIds = projectRepository.findByManagerId(managerId)
                .stream()
                .map(project -> project.getId())
                .toList();
        
        return projectGroupRepository.findAll()
                .stream()
                .filter(group -> projectIds.contains(group.getProjectId()))
                .flatMap(group -> taskRepository.findByProjectGroupId(group.getId()).stream())
                .toList();
    }
    
    public List<Task> getTasksByAssignee(Long assigneeId) {
        return taskRepository.findByAssigneeId(assigneeId);
    }
    
    public List<Task> getTasksByStatus(Task.Status status) {
        return taskRepository.findByStatus(status);
    }
    
    public long getTaskCountByProjectGroup(Long projectGroupId) {
        return taskRepository.countByProjectGroupId(projectGroupId);
    }
    
    public long getTaskCountByAssignee(Long assigneeId) {
        return taskRepository.countByAssigneeId(assigneeId);
    }
    
    public long getTaskCountByStatus(Task.Status status) {
        return taskRepository.countByStatus(status);
    }
    
    private boolean isProjectGroupValidForManager(Long projectGroupId, Long managerId) {
        Optional<com.interacthub.manager.model.ProjectGroup> groupOpt = projectGroupRepository.findById(projectGroupId);
        if (groupOpt.isEmpty()) {
            return false;
        }
        
        Long projectId = groupOpt.get().getProjectId();
        return projectRepository.findByIdAndManagerId(projectId, managerId).isPresent();
    }
    
    private boolean isTaskValidForManager(Long taskId, Long managerId) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isEmpty()) {
            return false;
        }
        
        Long projectGroupId = taskOpt.get().getProjectGroupId();
        return isProjectGroupValidForManager(projectGroupId, managerId);
    }
    
    private boolean isEmployeeValid(Long employeeId) {
        try {
            // Check if employee exists in admin service
            Map<?, ?> response = restTemplate.getForObject(ADMIN_SERVICE_URL + "/users/" + employeeId, Map.class);
            return response != null;
        } catch (Exception e) {
            // If admin service is unavailable, assume valid for now
            return true;
        }
    }
    
    private void notifyTaskAssignment(Task task, Long assigneeId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("recipientId", assigneeId);
            notification.put("type", "TASK_ASSIGNMENT");
            notification.put("title", "New Task Assigned");
            notification.put("message", "You have been assigned a new task: " + task.getTitle());
            notification.put("taskId", task.getId());
            
            restTemplate.postForObject(NOTIFICATION_SERVICE_URL + "/task-assignment", notification, Map.class);
            
        } catch (Exception e) {
            // Log notification failure but don't fail task creation
            System.out.println("Failed to send task assignment notification: " + e.getMessage());
        }
    }
}
