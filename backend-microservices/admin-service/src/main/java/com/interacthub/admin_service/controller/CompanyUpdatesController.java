package com.interacthub.admin_service.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.admin_service.model.Announcement;
import com.interacthub.admin_service.model.Poll;
import com.interacthub.admin_service.service.AdminService;
import com.interacthub.admin_service.sync.CompanyUpdatesSyncService;

@RestController
@RequestMapping("/api/admin/company-updates")
@CrossOrigin(origins = "*")
public class CompanyUpdatesController {

    @Autowired
    private AdminService adminService;
    
    @Autowired
    private CompanyUpdatesSyncService syncService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // ===== ANNOUNCEMENTS =====
    
    @PostMapping("/announcements/create")
    public ResponseEntity<Map<String, Object>> createAnnouncement(@RequestBody Announcement announcement) {
        try {
            Announcement created = adminService.createAnnouncement(announcement);
            
            // Sync to Employee service
            syncService.syncAnnouncementToEmployee(created);
            
            // Broadcast via WebSocket
            messagingTemplate.convertAndSend("/topic/announcements", Map.of(
                "type", "NEW_ANNOUNCEMENT",
                "data", created
            ));
            
            return ResponseEntity.ok(Map.of("message", "Announcement created successfully", "data", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/announcements/all")
    public ResponseEntity<List<Announcement>> getAllAnnouncements() {
        List<Announcement> announcements = adminService.getAllAnnouncements();
        return ResponseEntity.ok(announcements);
    }
    
    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<Map<String, String>> deleteAnnouncement(@PathVariable Long id) {
        try {
            adminService.deleteAnnouncement(id, "admin@interacthub.com");
            
            // Broadcast deletion
            messagingTemplate.convertAndSend("/topic/announcements", Map.of(
                "type", "DELETE_ANNOUNCEMENT",
                "id", id
            ));
            
            return ResponseEntity.ok(Map.of("message", "Announcement deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== POLLS =====
    
    @PostMapping("/polls/create")
    public ResponseEntity<Map<String, Object>> createPoll(@RequestBody Poll poll) {
        try {
            Poll created = adminService.createPoll(poll);
            
            // Sync to Employee service
            syncService.syncPollToEmployee(created);
            
            // Broadcast via WebSocket
            messagingTemplate.convertAndSend("/topic/polls", Map.of(
                "type", "NEW_POLL",
                "data", created
            ));
            
            return ResponseEntity.ok(Map.of("message", "Poll created successfully", "data", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/polls/active")
    public ResponseEntity<List<Poll>> getActivePolls() {
        List<Poll> polls = adminService.getActivePolls();
        return ResponseEntity.ok(polls);
    }
    
    @PostMapping("/polls/vote/{pollId}")
    public ResponseEntity<Map<String, Object>> voteOnPoll(
            @PathVariable Long pollId,
            @RequestBody Map<String, String> voteData) {
        try {
            String option = voteData.get("option");
            String voterEmail = voteData.get("voterEmail");
            
            Map<String, Object> result = adminService.voteOnPoll(pollId, option, voterEmail);
            
            // Broadcast vote update
            messagingTemplate.convertAndSend("/topic/polls", Map.of(
                "type", "VOTE_UPDATE",
                "pollId", pollId,
                "result", result
            ));
            
            return ResponseEntity.ok(Map.of("message", "Vote recorded", "data", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

