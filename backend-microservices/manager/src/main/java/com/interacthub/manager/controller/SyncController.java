package com.interacthub.manager.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.manager.model.Employee;
import com.interacthub.manager.repository.EmployeeRepository;

@RestController
@RequestMapping("/api/manager/sync")
@CrossOrigin(origins = "*")
public class SyncController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @PostMapping("/user")
    public String syncUser(@RequestBody SyncUserRequest userData) {
        try {
            System.out.println("🔄 Sync received for user: " + userData.getEmail());
            
            // Check if user already exists
            if (employeeRepository.findByEmail(userData.getEmail()).isPresent()) {
                System.out.println("⚠️ User already exists: " + userData.getEmail());
                return "User already exists in Manager Service.";
            }

            // Create new employee record
            Employee emp = new Employee();
            emp.setFirstName(userData.getFirstName());
            emp.setLastName(userData.getLastName());
            emp.setEmail(userData.getEmail());
            emp.setRole(userData.getRole());
            emp.setDepartment(String.valueOf(userData.getDepartmentId())); // Store departmentId as string for now
            emp.setPosition(userData.getPosition());
            emp.setPhoneNumber(userData.getPhoneNumber());
            emp.setManagerId(userData.getManagerId() != null ? userData.getManagerId() : 1L);
            emp.setIsActive(true);

            employeeRepository.save(emp);
            
            System.out.println("✅ User synced successfully to Manager Service: " + userData.getEmail());
            return "✅ User synced successfully to Manager Service.";
        } catch (Exception e) {
            System.err.println("❌ Sync failed: " + e.getMessage());
            e.printStackTrace();
            return "❌ Sync failed: " + e.getMessage();
        }
    }
    
    // DTO for incoming sync requests
    public static class SyncUserRequest {
        private String email;
        private String firstName;
        private String lastName;
        private String role;
        private String position;
        private String phoneNumber;
        private Long departmentId;
        private Long managerId;

        // Getters and Setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        
        public String getPosition() { return position; }
        public void setPosition(String position) { this.position = position; }
        
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        
        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        
        public Long getManagerId() { return managerId; }
        public void setManagerId(Long managerId) { this.managerId = managerId; }
    }
}

