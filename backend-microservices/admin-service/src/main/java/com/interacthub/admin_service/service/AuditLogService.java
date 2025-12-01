package com.interacthub.admin_service.service;

import com.interacthub.admin_service.model.AuditLog;
import com.interacthub.admin_service.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    /**
     * Log an action - method signature that your existing code uses
     */
    public void log(String userEmail, String action, String entityType, String entityId, String description, String ipAddress, String status) {
        AuditLog auditLog = new AuditLog(userEmail, action, entityType, description, ipAddress);
        auditLogRepository.save(auditLog);
        System.out.println("📝 Audit Log: " + action + " by " + userEmail);
    }
    
    /**
     * Simple log method
     */
    public void log(String userEmail, String action, String description) {
        AuditLog auditLog = new AuditLog(userEmail, action, null, description, null);
        auditLogRepository.save(auditLog);
    }
}
