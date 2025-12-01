package com.interacthub.manager.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.interacthub.manager.model.OnboardRequest;
import com.interacthub.manager.repository.OnboardRequestRepository;

@Service
@Transactional
public class OnboardService {
    
    @Autowired
    private OnboardRequestRepository onboardRequestRepository;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Autowired
    private RestTemplate restTemplate;
    
    private static final String ADMIN_SERVICE_URL = "http://localhost:8081/api/admin";
    private static final String NOTIFICATION_SERVICE_URL = "http://localhost:8090/api/notify";
    
    public OnboardRequest createOnboardRequest(String fullName, String email, String phone, 
                                            String roleTitle, String department, Long managerId,
                                            String username, String role) {
        
        // Validate unique email (no duplicate pending or active employee)
        if (onboardRequestRepository.findByEmail(email).stream()
                .anyMatch(request -> request.getStatus() == OnboardRequest.Status.PENDING)) {
            throw new RuntimeException("An onboarding request for this email is already pending");
        }
        
        // Check if user already exists in admin service
        if (isUserAlreadyExists(email)) {
            throw new RuntimeException("User with this email already exists");
        }
        
        OnboardRequest request = new OnboardRequest(fullName, email, phone, roleTitle, department, managerId);
        OnboardRequest savedRequest = onboardRequestRepository.save(request);
        
        // Log the action
        auditLogService.logOnboardAction(username, role, "ONBOARD_REQUEST_CREATE", savedRequest.getId());
        
        // Notify HR
        notifyHRAboutOnboardRequest(savedRequest);
        
        return savedRequest;
    }
    
    public List<OnboardRequest> getOnboardRequestsByManager(Long managerId) {
        return onboardRequestRepository.findByRequestedByManagerIdOrderByRequestedAtDesc(managerId);
    }
    
    public List<OnboardRequest> getOnboardRequestsByStatus(OnboardRequest.Status status) {
        return onboardRequestRepository.findByStatus(status);
    }
    
    public OnboardRequest getOnboardRequestById(Long requestId, Long managerId) {
        return onboardRequestRepository.findById(requestId)
                .filter(request -> request.getRequestedByManagerId().equals(managerId))
                .orElseThrow(() -> new RuntimeException("Onboard request not found or access denied"));
    }
    
    public OnboardRequest updateOnboardRequest(Long requestId, String fullName, String email, String phone,
                                              String roleTitle, String department, Long managerId,
                                              String username, String role) {
        
        OnboardRequest request = getOnboardRequestById(requestId, managerId);
        
        // Only allow updates if status is PENDING
        if (request.getStatus() != OnboardRequest.Status.PENDING) {
            throw new RuntimeException("Cannot update onboard request that has been processed");
        }
        
        request.setFullName(fullName);
        request.setEmail(email);
        request.setPhone(phone);
        request.setRoleTitle(roleTitle);
        request.setDepartment(department);
        
        OnboardRequest savedRequest = onboardRequestRepository.save(request);
        
        // Log the action
        auditLogService.logOnboardAction(username, role, "ONBOARD_REQUEST_UPDATE", savedRequest.getId());
        
        return savedRequest;
    }
    
    public void cancelOnboardRequest(Long requestId, Long managerId, String username, String role) {
        OnboardRequest request = getOnboardRequestById(requestId, managerId);
        
        // Only allow cancellation if status is PENDING
        if (request.getStatus() != OnboardRequest.Status.PENDING) {
            throw new RuntimeException("Cannot cancel onboard request that has been processed");
        }
        
        onboardRequestRepository.deleteById(requestId);
        
        // Log the action
        auditLogService.logOnboardAction(username, role, "ONBOARD_REQUEST_CANCEL", requestId);
    }
    
    public long getOnboardRequestCountByManager(Long managerId) {
        return onboardRequestRepository.countByRequestedByManagerId(managerId);
    }
    
    public long getOnboardRequestCountByManagerAndStatus(Long managerId, OnboardRequest.Status status) {
        return onboardRequestRepository.countByRequestedByManagerIdAndStatus(managerId, status);
    }
    
    public long getOnboardRequestCountByStatus(OnboardRequest.Status status) {
        return onboardRequestRepository.countByStatus(status);
    }
    
    private boolean isUserAlreadyExists(String email) {
        try {
            Map<?, ?> response = restTemplate.getForObject(ADMIN_SERVICE_URL + "/users/email/" + email, Map.class);
            return response != null;
        } catch (Exception e) {
            // If admin service is unavailable, assume user doesn't exist
            return false;
        }
    }
    
    private void notifyHRAboutOnboardRequest(OnboardRequest request) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "ONBOARD_REQUEST");
            notification.put("title", "New Employee Onboarding Request");
            notification.put("message", "Manager has requested onboarding for: " + request.getFullName() + " (" + request.getEmail() + ")");
            notification.put("requestId", request.getId());
            notification.put("managerId", request.getRequestedByManagerId());
            notification.put("fullName", request.getFullName());
            notification.put("email", request.getEmail());
            notification.put("roleTitle", request.getRoleTitle());
            notification.put("department", request.getDepartment());
            
            // Send to HR service or notification service
            restTemplate.postForObject(NOTIFICATION_SERVICE_URL + "/onboard-request", notification, Map.class);
            
        } catch (Exception e) {
            // Log notification failure but don't fail request creation
            System.out.println("Failed to send HR notification for onboard request: " + e.getMessage());
        }
    }
}
