package com.interacthub.employee.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.employee.service.AuditService;

@RestController
@RequestMapping("/api/employee/activity")
@CrossOrigin(origins = "*")
public class ActivityController {
    
    @Autowired
    private AuditService auditService;
    
    @GetMapping("/logs")
    public ResponseEntity<?> getLogs() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.ok(auditService.getLogsForEmployee(email));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}

