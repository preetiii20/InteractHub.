package com.interacthub.admin_service.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.interacthub.admin_service.model.User;

@Service
public class SyncService {
    @Autowired
    private RestTemplate restTemplate;

    @Value("${manager.service.url:http://localhost:8083}")
    private String managerServiceUrl;

    @Value("${hr.service.url:http://localhost:8087}")
    private String hrServiceUrl;

    @Value("${employee.service.url:http://localhost:8084}")
    private String employeeServiceUrl;

    public void syncUserToManager(User user) {
        try {
            if (user.getRole() == User.Role.MANAGER || user.getRole() == User.Role.EMPLOYEE) {
                Map<String, Object> userData = new HashMap<>();
                userData.put("email", user.getEmail());
                userData.put("firstName", user.getFirstName());
                userData.put("lastName", user.getLastName());
                userData.put("role", user.getRole().name());
                userData.put("position", user.getPosition());
                userData.put("phoneNumber", user.getPhoneNumber());
                userData.put("departmentId", user.getDepartmentId());
                userData.put("managerId", user.getCreatedBy());

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(userData, headers);
                restTemplate.postForEntity(managerServiceUrl + "/api/manager/sync/user", request, String.class);
                System.out.println("✅ User synced to Manager Service: " + user.getEmail());
            }
        } catch (Exception e) {
            System.err.println("⚠️ Manager sync failed: " + user.getEmail() + " - " + e.getMessage());
        }
    }

    public void syncUserToHR(User user) {
        try {
            if (user.getRole() == User.Role.HR || user.getRole() == User.Role.EMPLOYEE) {
                Map<String, Object> userData = new HashMap<>();
                userData.put("email", user.getEmail());
                userData.put("firstName", user.getFirstName());
                userData.put("lastName", user.getLastName());
                userData.put("role", user.getRole().name());
                userData.put("position", user.getPosition());
                userData.put("phoneNumber", user.getPhoneNumber());
                userData.put("departmentId", user.getDepartmentId());

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(userData, headers);
                restTemplate.postForEntity(hrServiceUrl + "/api/hr/sync/user", request, String.class);
                System.out.println("✅ User synced to HR Service: " + user.getEmail());
            }
        } catch (Exception e) {
            System.err.println("⚠️ HR sync failed: " + user.getEmail() + " - " + e.getMessage());
        }
    }

    public void syncUserToEmployee(User user, String password) {
        try {
            if (user.getRole() == User.Role.EMPLOYEE) {
                Map<String, Object> userData = new HashMap<>();
                userData.put("email", user.getEmail());
                userData.put("firstName", user.getFirstName());
                userData.put("lastName", user.getLastName());
                userData.put("role", user.getRole().name());
                userData.put("position", user.getPosition());
                userData.put("phoneNumber", user.getPhoneNumber());
                userData.put("department", null); // Department name not available in User model
                userData.put("departmentId", user.getDepartmentId());
                userData.put("managerId", user.getCreatedBy());
                userData.put("password", password);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(userData, headers);
                restTemplate.postForEntity(employeeServiceUrl + "/api/employee/sync/user", request, String.class);
                System.out.println("✅ User synced to Employee Service: " + user.getEmail());
            }
        } catch (Exception e) {
            System.err.println("⚠️ Employee sync failed: " + user.getEmail() + " - " + e.getMessage());
        }
    }
}

