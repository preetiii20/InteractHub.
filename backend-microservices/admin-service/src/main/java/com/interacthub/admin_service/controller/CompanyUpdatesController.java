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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.stream.Collectors;

import com.interacthub.admin_service.model.Announcement;
import com.interacthub.admin_service.model.Poll;
import com.interacthub.admin_service.service.AdminService;
import com.interacthub.admin_service.sync.CompanyUpdatesSyncService;
import com.interacthub.admin_service.util.OrganizationValidator;

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
    
    @Autowired
    private OrganizationValidator organizationValidator;

    // ===== ANNOUNCEMENTS =====
    
    @PostMapping("/announcements/create")
    public ResponseEntity<?> createAnnouncement(
            @RequestBody Announcement announcement) {
        try {
            Announcement created = adminService.createAnnouncement(announcement);
            
            // Sync to Employee service
            syncService.syncAnnouncementToEmployee(created);
            
            // Broadcast via WebSocket
            messagingTemplate.convertAndSend("/topic/announcements", Map.of(
                "type", "NEW_ANNOUNCEMENT",
                "data", created
            ));
            
            System.out.println("✅ Announcement created: " + created.getId());
            return ResponseEntity.ok(Map.of("message", "Announcement created successfully", "data", created));
        } catch (Exception e) {
            System.err.println("❌ Error creating announcement: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create announcement: " + e.getMessage()));
        }
    }
    
    @GetMapping("/announcements/all")
    public ResponseEntity<?> getAllAnnouncements() {
        try {
            List<Announcement> announcements = adminService.getAllAnnouncements();
            System.out.println("✅ Fetched " + announcements.size() + " announcements");
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            System.err.println("❌ Error fetching announcements: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch announcements: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<?> deleteAnnouncement(
            @PathVariable Long id) {
        try {
            adminService.deleteAnnouncement(id, null);
            
            // Broadcast deletion
            messagingTemplate.convertAndSend("/topic/announcements", Map.of(
                "type", "DELETE_ANNOUNCEMENT",
                "id", id
            ));
            
            System.out.println("✅ Announcement deleted: " + id);
            return ResponseEntity.ok(Map.of("message", "Announcement deleted successfully"));
        } catch (Exception e) {
            System.err.println("❌ Error deleting announcement: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete announcement: " + e.getMessage()));
        }
    }

    // ===== POLLS =====
    
    @PostMapping("/polls/create")
    public ResponseEntity<?> createPoll(
            @RequestBody Poll poll) {
        try {
            Poll created = adminService.createPoll(poll);
            
            // Sync to Employee service
            syncService.syncPollToEmployee(created);
            
            // Broadcast via WebSocket
            messagingTemplate.convertAndSend("/topic/polls", Map.of(
                "type", "NEW_POLL",
                "data", created
            ));
            
            System.out.println("✅ Poll created: " + created.getId());
            return ResponseEntity.ok(Map.of("message", "Poll created successfully", "data", created));
        } catch (Exception e) {
            System.err.println("❌ Error creating poll: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create poll: " + e.getMessage()));
        }
    }
    
    @GetMapping("/polls/active")
    public ResponseEntity<?> getActivePolls() {
        try {
            List<Poll> polls = adminService.getActivePolls();
            System.out.println("✅ Fetched " + polls.size() + " active polls");
            return ResponseEntity.ok(polls);
        } catch (Exception e) {
            System.err.println("❌ Error fetching polls: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch polls: " + e.getMessage()));
        }
    }
    
    @PostMapping("/polls/vote/{pollId}")
    public ResponseEntity<?> voteOnPoll(
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
            
            System.out.println("✅ Vote recorded for poll: " + pollId);
            return ResponseEntity.ok(Map.of("message", "Vote recorded", "data", result));
        } catch (Exception e) {
            System.err.println("❌ Error voting on poll: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to vote on poll: " + e.getMessage()));
        }
    }
}

