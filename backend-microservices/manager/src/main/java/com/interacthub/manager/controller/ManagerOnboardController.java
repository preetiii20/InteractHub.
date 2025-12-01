package com.interacthub.manager.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.manager.model.OnboardRequest;
import com.interacthub.manager.service.OnboardService;

@RestController
@RequestMapping("/api/manager/onboard")
@CrossOrigin(origins = "http://localhost:3000")
public class ManagerOnboardController {
    
    @Autowired
    private OnboardService onboardService;
    
    @PostMapping
    public ResponseEntity<?> createOnboardRequest(@RequestBody OnboardRequestCreateRequest request,
                                                @RequestHeader("X-User-Name") String username,
                                                @RequestHeader("X-User-Role") String role,
                                                @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            OnboardRequest onboardRequest = onboardService.createOnboardRequest(
                request.getFullName(),
                request.getEmail(),
                request.getPhone(),
                request.getRoleTitle(),
                request.getDepartment(),
                managerId,
                username,
                role
            );
            
            return ResponseEntity.ok(onboardRequest);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/requests")
    public ResponseEntity<List<OnboardRequest>> getOnboardRequests(@RequestHeader("X-Manager-Id") Long managerId,
                                                                 @RequestParam(required = false) String status) {
        List<OnboardRequest> requests;
        
        if (status != null) {
            try {
                OnboardRequest.Status requestStatus = OnboardRequest.Status.valueOf(status.toUpperCase());
                requests = onboardService.getOnboardRequestsByStatus(requestStatus)
                        .stream()
                        .filter(request -> request.getRequestedByManagerId().equals(managerId))
                        .toList();
            } catch (IllegalArgumentException e) {
                requests = onboardService.getOnboardRequestsByManager(managerId);
            }
        } else {
            requests = onboardService.getOnboardRequestsByManager(managerId);
        }
        
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/requests/{requestId}")
    public ResponseEntity<?> getOnboardRequest(@PathVariable Long requestId,
                                             @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            OnboardRequest request = onboardService.getOnboardRequestById(requestId, managerId);
            return ResponseEntity.ok(request);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/requests/{requestId}")
    public ResponseEntity<?> updateOnboardRequest(@PathVariable Long requestId,
                                                @RequestBody OnboardRequestUpdateRequest request,
                                                @RequestHeader("X-User-Name") String username,
                                                @RequestHeader("X-User-Role") String role,
                                                @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            OnboardRequest onboardRequest = onboardService.updateOnboardRequest(
                requestId,
                request.getFullName(),
                request.getEmail(),
                request.getPhone(),
                request.getRoleTitle(),
                request.getDepartment(),
                managerId,
                username,
                role
            );
            
            return ResponseEntity.ok(onboardRequest);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/requests/{requestId}")
    public ResponseEntity<?> cancelOnboardRequest(@PathVariable Long requestId,
                                                @RequestHeader("X-User-Name") String username,
                                                @RequestHeader("X-User-Role") String role,
                                                @RequestHeader("X-Manager-Id") Long managerId) {
        try {
            onboardService.cancelOnboardRequest(requestId, managerId, username, role);
            return ResponseEntity.ok(Map.of("message", "Onboard request cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOnboardStats(@RequestHeader("X-Manager-Id") Long managerId) {
        Map<String, Object> stats = Map.of(
            "totalRequests", onboardService.getOnboardRequestCountByManager(managerId),
            "pendingRequests", onboardService.getOnboardRequestCountByManagerAndStatus(managerId, OnboardRequest.Status.PENDING),
            "approvedRequests", onboardService.getOnboardRequestCountByManagerAndStatus(managerId, OnboardRequest.Status.APPROVED),
            "rejectedRequests", onboardService.getOnboardRequestCountByManagerAndStatus(managerId, OnboardRequest.Status.REJECTED)
        );
        
        return ResponseEntity.ok(stats);
    }
    
    // Request DTOs
    public static class OnboardRequestCreateRequest {
        private String fullName;
        private String email;
        private String phone;
        private String roleTitle;
        private String department;
        
        // Getters and Setters
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        
        public String getRoleTitle() { return roleTitle; }
        public void setRoleTitle(String roleTitle) { this.roleTitle = roleTitle; }
        
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
    }
    
    public static class OnboardRequestUpdateRequest {
        private String fullName;
        private String email;
        private String phone;
        private String roleTitle;
        private String department;
        
        // Getters and Setters
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        
        public String getRoleTitle() { return roleTitle; }
        public void setRoleTitle(String roleTitle) { this.roleTitle = roleTitle; }
        
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
    }
}
