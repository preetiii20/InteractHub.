package com.interacthub.employee.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.employee.model.Employee;
import com.interacthub.employee.service.EmployeeService;

@RestController
@RequestMapping("/api/employee/sync")
@CrossOrigin(origins = "*")
public class SyncController {
    
    @Autowired
    private EmployeeService employeeService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @PostMapping("/user")
    public ResponseEntity<?> syncUser(@RequestBody Map<String, Object> userData) {
        try {
            System.out.println("🔄 Sync received from Admin: " + userData.get("email"));
            
            Employee emp = new Employee();
            emp.setEmail((String) userData.get("email"));
            emp.setFirstName((String) userData.get("firstName"));
            emp.setLastName((String) userData.get("lastName"));
            emp.setRole((String) userData.get("role"));
            emp.setDepartment((String) userData.get("department"));
            emp.setPosition((String) userData.get("position"));
            emp.setPhoneNumber((String) userData.get("phoneNumber"));
            
            if (userData.get("departmentId") != null) {
                emp.setDepartmentId(Long.valueOf(userData.get("departmentId").toString()));
            }
            if (userData.get("managerId") != null) {
                emp.setManagerId(Long.valueOf(userData.get("managerId").toString()));
            }
            
            // Set password if provided (hash it)
            if (userData.get("password") != null) {
                emp.setPassword(passwordEncoder.encode((String) userData.get("password")));
            }
            
            emp.setIsActive(true);
            
            Employee saved = employeeService.saveOrUpdate(emp);
            
            System.out.println("✅ User synced successfully to Employee Service: " + saved.getEmail());
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "User synced successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Sync failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Sync failed: " + e.getMessage());
        }
    }
}

