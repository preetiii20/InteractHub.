package com.interacthub.employee.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.interacthub.employee.model.AuditLog;
import com.interacthub.employee.repository.AuditLogRepository;

@Service
public class AuditService {
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    public void logAction(Long employeeId, String email, String action, String target, String details) {
        AuditLog log = new AuditLog(employeeId, email, action, target, details);
        auditLogRepository.save(log);
        System.out.println("📝 Audit Log: " + email + " - " + action + " - " + target);
    }
    
    public List<AuditLog> getLogsForEmployee(String email) {
        return auditLogRepository.findByEmployeeEmailOrderByTimestampDesc(email);
    }
}

