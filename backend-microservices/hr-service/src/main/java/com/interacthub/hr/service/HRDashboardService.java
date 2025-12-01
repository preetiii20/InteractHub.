package com.interacthub.hr.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.interacthub.hr.repository.AttendanceRepository;
import com.interacthub.hr.repository.LeaveRequestRepository;

@Service
public class HRDashboardService {
    private final RestTemplate restTemplate;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    
    @Value("${admin.service.url:http://localhost:8081/api/admin}")
    private String adminServiceUrl;

    public HRDashboardService(
            RestTemplate restTemplate,
            AttendanceRepository attendanceRepository,
            LeaveRequestRepository leaveRequestRepository) {
        this.restTemplate = restTemplate;
        this.attendanceRepository = attendanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Get total employees from admin service
        try {
            org.springframework.http.ResponseEntity<java.util.List> response = 
                restTemplate.getForEntity(adminServiceUrl + "/users/role/EMPLOYEE", java.util.List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                stats.put("totalEmployees", response.getBody().size());
            } else {
                stats.put("totalEmployees", 0);
            }
        } catch (Exception e) {
            System.err.println("Error fetching employees from admin service: " + e.getMessage());
            stats.put("totalEmployees", 0);
        }
        
        // Get pending leave requests
        stats.put("pendingLeaveRequests", leaveRequestRepository.findByStatusOrderByRequestedAtDesc("PENDING").size());
        
        // Get today's attendance count
        LocalDate today = LocalDate.now();
        stats.put("todaysAttendance", attendanceRepository.findByDate(today).size());
        
        return stats;
    }
}

