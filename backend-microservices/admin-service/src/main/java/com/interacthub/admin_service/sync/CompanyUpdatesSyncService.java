package com.interacthub.admin_service.sync;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.interacthub.admin_service.model.Announcement;
import com.interacthub.admin_service.model.Poll;

@Service
public class CompanyUpdatesSyncService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${employee.service.url:http://localhost:8084}")
    private String employeeServiceUrl;

    public void syncAnnouncementToEmployee(Announcement announcement) {
        try {
            Map<String, Object> data = new HashMap<>();
            data.put("id", announcement.getId());
            data.put("title", announcement.getTitle());
            data.put("message", announcement.getContent());
            data.put("department", announcement.getTargetAudience().name());
            data.put("createdAt", announcement.getCreatedAt());
            data.put("type", "announcement");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(data, headers);

            restTemplate.postForEntity(employeeServiceUrl + "/api/employee/updates/sync", request, String.class);
            System.out.println("✅ Announcement synced to Employee Service: " + announcement.getTitle());
        } catch (Exception e) {
            System.err.println("⚠️ Failed to sync announcement to Employee Service: " + e.getMessage());
        }
    }

    public void syncPollToEmployee(Poll poll) {
        try {
            Map<String, Object> data = new HashMap<>();
            data.put("id", poll.getId());
            data.put("question", poll.getQuestion());
            data.put("options", poll.getOptions());
            data.put("isActive", poll.getIsActive());
            data.put("createdAt", poll.getCreatedAt());
            data.put("type", "poll");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(data, headers);

            restTemplate.postForEntity(employeeServiceUrl + "/api/employee/updates/sync", request, String.class);
            System.out.println("✅ Poll synced to Employee Service: " + poll.getQuestion());
        } catch (Exception e) {
            System.err.println("⚠️ Failed to sync poll to Employee Service: " + e.getMessage());
        }
    }
}

