package com.interacthub.manager.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AuditLogService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    private static final String ADMIN_SERVICE_URL = "http://localhost:8081/api/admin";
    
    public void log(String username, String role, String action, String endpoint, String method) {
        try {
            Map<String, Object> auditLog = new HashMap<>();
            auditLog.put("username", username);
            auditLog.put("role", role);
            auditLog.put("action", action);
            auditLog.put("endpoint", endpoint);
            auditLog.put("method", method);
            
            // Send audit log to admin service
            restTemplate.postForObject(ADMIN_SERVICE_URL + "/audit-logs", auditLog, Map.class);
            
        } catch (Exception e) {
            // Log locally if admin service is unavailable
            System.out.println("Audit Log: " + username + " (" + role + ") - " + action + " - " + endpoint + " - " + method);
        }
    }
    
    public void logProjectAction(String username, String role, String action, Long projectId) {
        log(username, role, action, "/api/manager/projects/" + projectId, "POST");
    }
    
    public void logGroupAction(String username, String role, String action, Long projectId, Long groupId) {
        log(username, role, action, "/api/manager/projects/" + projectId + "/groups/" + groupId, "POST");
    }
    
    public void logTaskAction(String username, String role, String action, Long taskId) {
        log(username, role, action, "/api/manager/tasks/" + taskId, "POST");
    }
    
    public void logOnboardAction(String username, String role, String action, Long requestId) {
        log(username, role, action, "/api/manager/onboard/" + requestId, "POST");
    }
}
