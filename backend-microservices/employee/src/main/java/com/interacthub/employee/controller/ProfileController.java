package com.interacthub.employee.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.employee.model.Employee;
import com.interacthub.employee.service.AuditService;
import com.interacthub.employee.service.EmployeeService;

@RestController
@RequestMapping("/api/employee")
@CrossOrigin(origins = "*")
public class ProfileController {
    
    @Autowired
    private EmployeeService employeeService;
    
    @Autowired
    private AuditService auditService;
    
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Employee> employeeOpt = employeeService.findByEmail(email);
        
        if (employeeOpt.isEmpty()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        return ResponseEntity.ok(employeeOpt.get());
    }
    
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Employee updates) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<Employee> employeeOpt = employeeService.findByEmail(email);
            
            if (employeeOpt.isEmpty()) {
                return ResponseEntity.status(401).body("Unauthorized");
            }
            
            Employee employee = employeeOpt.get();
            Employee updated = employeeService.updateProfile(employee.getId(), updates);
            
            // Audit log
            auditService.logAction(employee.getId(), email, "PROFILE_UPDATED", "Profile", "Updated profile information");
            
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}

