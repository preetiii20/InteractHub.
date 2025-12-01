package com.interacthub.employee.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.interacthub.employee.model.CompanyAnnouncement;
import com.interacthub.employee.model.CompanyPoll;
import com.interacthub.employee.repository.CompanyAnnouncementRepository;
import com.interacthub.employee.repository.CompanyPollRepository;

@RestController
@RequestMapping("/api/employee/updates")
@CrossOrigin(origins = "*")
public class CompanyUpdatesController {

    @Autowired
    private CompanyAnnouncementRepository announcementRepository;
    
    @Autowired
    private CompanyPollRepository pollRepository;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Value("${admin.service.url:http://localhost:8081}")
    private String adminServiceUrl;

    // ===== SYNC ENDPOINT (called by Admin Service) =====
    
    @PostMapping("/sync")
    public ResponseEntity<String> syncUpdate(@RequestBody Map<String, Object> data) {
        try {
            String type = (String) data.get("type");
            
            if ("announcement".equals(type)) {
                CompanyAnnouncement announcement = new CompanyAnnouncement();
                announcement.setId(((Number) data.get("id")).longValue());
                announcement.setTitle((String) data.get("title"));
                announcement.setMessage((String) data.get("message"));
                announcement.setDepartment((String) data.get("department"));
                announcement.setCreatedAt(LocalDateTime.now());
                
                announcementRepository.save(announcement);
                System.out.println("✅ Synced announcement: " + announcement.getTitle());
                
            } else if ("poll".equals(type)) {
                CompanyPoll poll = new CompanyPoll();
                poll.setId(((Number) data.get("id")).longValue());
                poll.setQuestion((String) data.get("question"));
                poll.setOptions((List<String>) data.get("options"));
                poll.setIsActive((Boolean) data.get("isActive"));
                poll.setCreatedAt(LocalDateTime.now());
                
                pollRepository.save(poll);
                System.out.println("✅ Synced poll: " + poll.getQuestion());
            }
            
            return ResponseEntity.ok("Synced successfully");
        } catch (Exception e) {
            System.err.println("❌ Sync failed: " + e.getMessage());
            return ResponseEntity.ok("Sync failed: " + e.getMessage());
        }
    }

    // ===== FETCH ENDPOINTS FOR EMPLOYEES =====
    
    @GetMapping("/announcements")
    public ResponseEntity<List<CompanyAnnouncement>> getAnnouncements() {
        List<CompanyAnnouncement> announcements = announcementRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(announcements);
    }
    
    @GetMapping("/polls")
    public ResponseEntity<List<CompanyPoll>> getActivePolls() {
        List<CompanyPoll> polls = pollRepository.findByIsActiveTrueOrderByCreatedAtDesc();
        return ResponseEntity.ok(polls);
    }
    
    @PostMapping("/polls/vote/{pollId}")
    public ResponseEntity<Map<String, Object>> voteOnPoll(
            @PathVariable Long pollId,
            @RequestBody Map<String, String> voteData) {
        try {
            String option = voteData.get("option");
            String voterEmail = voteData.get("voterEmail");
            
            // Forward vote to Admin Service for centralized vote counting
            Map<String, Object> payload = new HashMap<>();
            payload.put("option", option);
            payload.put("voterEmail", voterEmail);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                adminServiceUrl + "/api/admin/company-updates/polls/vote/" + pollId,
                request,
                Map.class
            );
            
            return ResponseEntity.ok(Map.of(
                "message", "Vote recorded",
                "data", response.getBody()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

