package com.interacthub.employee.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.employee.model.Employee;
import com.interacthub.employee.repository.AuditLogRepository;
import com.interacthub.employee.repository.EmployeeTaskRepository;
import com.interacthub.employee.service.EmployeeService;

@RestController
@RequestMapping("/api/employee")
@CrossOrigin(origins = "*")
public class DashboardController {
    
    @Autowired
    private EmployeeService employeeService;
    
    @Autowired
    private EmployeeTaskRepository taskRepository;
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(
            @RequestHeader(value = "X-User-Name", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-Employee-Id", required = false) String employeeId) {
        try {
            System.out.println("🔍 Dashboard requested for: " + email + " (Role: " + role + ", ID: " + employeeId + ")");
            
            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(401).body("Unauthorized - No user email provided");
            }
            
            Optional<Employee> employeeOpt = employeeService.findByEmail(email);
            
            if (employeeOpt.isEmpty()) {
                System.out.println("❌ Employee not found: " + email);
                return ResponseEntity.status(401).body("Unauthorized - Employee not found");
            }
            
            Employee employee = employeeOpt.get();
            
            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("profile", Map.of(
                "id", employee.getId(),
                "firstName", employee.getFirstName(),
                "lastName", employee.getLastName(),
                "email", employee.getEmail(),
                "department", employee.getDepartment() != null ? employee.getDepartment() : "",
                "position", employee.getPosition() != null ? employee.getPosition() : "",
                "phoneNumber", employee.getPhoneNumber() != null ? employee.getPhoneNumber() : ""
            ));
            
            // Get tasks
            dashboard.put("tasks", taskRepository.findByEmployeeEmailOrderByAssignedDateDesc(email));
            
            // Get audit logs (last 10)
            dashboard.put("activityLogs", auditLogRepository.findByEmployeeEmailOrderByTimestampDesc(email)
                .stream().limit(10).toList());
            
            // Announcements and polls would come from Admin service (TODO: implement integration)
            dashboard.put("announcements", List.of());
            dashboard.put("polls", List.of());
            
            System.out.println("✅ Dashboard data sent successfully for: " + email);
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            System.err.println("❌ Dashboard error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}

