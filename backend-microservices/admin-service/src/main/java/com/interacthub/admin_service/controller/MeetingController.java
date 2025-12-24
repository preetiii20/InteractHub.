package com.interacthub.admin_service.controller;

import com.interacthub.admin_service.model.Meeting;
import com.interacthub.admin_service.service.MeetingService;
import com.interacthub.admin_service.util.OrganizationValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/admin/meetings")
public class MeetingController {
    
    @Autowired
    private MeetingService meetingService;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private OrganizationValidator organizationValidator;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @PostMapping
    public ResponseEntity<?> createMeeting(
            @RequestBody Meeting meeting,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            // Validate required fields
            if (meeting.getTitle() == null || meeting.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Meeting title is required"));
            }
            if (meeting.getMeetingDate() == null || meeting.getMeetingDate().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Meeting date is required"));
            }
            if (meeting.getMeetingTime() == null || meeting.getMeetingTime().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Meeting time is required"));
            }
            if (meeting.getJitsiLink() == null || meeting.getJitsiLink().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Jitsi link is required"));
            }
            if (meeting.getOrganizerId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Organizer ID is required"));
            }
            
            // Set organization ID if email is provided
            if (userEmail != null && !userEmail.isEmpty()) {
                Long organizationId = organizationValidator.getOrganizationIdFromEmail(userEmail);
                if (organizationId != null) {
                    meeting.setOrganizationId(organizationId);
                }
            }
            
            Meeting created = meetingService.createMeeting(meeting);
            
            // Send notifications to participants
            if (created.getParticipantIds() != null && !created.getParticipantIds().isEmpty()) {
                sendNotificationsToParticipants(created);
            }
            
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            System.err.println("❌ Error creating meeting: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to create meeting: " + e.getMessage()));
        }
    }
    
    @PostMapping("/with-notifications")
    public ResponseEntity<?> createMeetingWithNotifications(
            @RequestBody Meeting meeting,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            // Validate required fields
            if (meeting.getTitle() == null || meeting.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Meeting title is required"));
            }
            if (meeting.getMeetingDate() == null || meeting.getMeetingDate().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Meeting date is required"));
            }
            if (meeting.getMeetingTime() == null || meeting.getMeetingTime().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Meeting time is required"));
            }
            if (meeting.getJitsiLink() == null || meeting.getJitsiLink().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Jitsi link is required"));
            }
            if (meeting.getOrganizerId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Organizer ID is required"));
            }
            
            // Set organization ID if email is provided
            if (userEmail != null && !userEmail.isEmpty()) {
                Long organizationId = organizationValidator.getOrganizationIdFromEmail(userEmail);
                if (organizationId != null) {
                    meeting.setOrganizationId(organizationId);
                }
            }
            
            Meeting created = meetingService.createMeeting(meeting);
            
            // Send notifications to participants
            if (created.getParticipantIds() != null && !created.getParticipantIds().isEmpty()) {
                sendNotificationsToParticipants(created);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("meeting", created);
            response.put("message", "Meeting created and notifications sent to " + created.getParticipantIds().size() + " participants");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Error creating meeting: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Failed to create meeting: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    private void sendNotificationsToParticipants(Meeting meeting) {
        try {
            // Fetch all users to get their emails
            Map<Long, String> userEmailMap = new HashMap<>();
            try {
                List<?> users = restTemplate.getForObject("http://localhost:8081/api/admin/users/all", List.class);
                if (users != null) {
                    for (Object userObj : users) {
                        if (userObj instanceof Map) {
                            Map<String, Object> user = (Map<String, Object>) userObj;
                            Long userId = null;
                            String email = null;
                            
                            // Try different field names for ID
                            if (user.containsKey("id")) {
                                userId = ((Number) user.get("id")).longValue();
                            } else if (user.containsKey("userId")) {
                                userId = ((Number) user.get("userId")).longValue();
                            }
                            
                            // Try different field names for email
                            if (user.containsKey("email")) {
                                email = (String) user.get("email");
                            } else if (user.containsKey("emailAddress")) {
                                email = (String) user.get("emailAddress");
                            }
                            
                            if (userId != null && email != null) {
                                userEmailMap.put(userId, email);
                            }
                        }
                    }
                }
                System.out.println("✅ Fetched " + userEmailMap.size() + " users from admin service");
            } catch (Exception e) {
                System.err.println("⚠️ Failed to fetch users from admin service: " + e.getMessage());
            }
            
            // Send notifications to each participant in a separate thread with delay
            for (Long participantId : meeting.getParticipantIds()) {
                String userEmail = userEmailMap.getOrDefault(participantId, "user" + participantId + "@example.com");
                
                // Send notification in background thread with longer delay to ensure subscription is active
                // Using 2000ms delay to give participants time to subscribe to WebSocket
                new Thread(() -> {
                    try {
                        // Delay to ensure participant has subscribed to WebSocket
                        // Increased from 1000ms to 2000ms for better reliability
                        Thread.sleep(2000);
                        
                        Map<String, Object> notification = new HashMap<>();
                        notification.put("userId", participantId);
                        notification.put("type", "MEETING_INVITATION");
                        notification.put("title", "Meeting Invitation: " + meeting.getTitle());
                        notification.put("message", "You've been invited to \"" + meeting.getTitle() + "\" on " + meeting.getMeetingDate() + " at " + meeting.getMeetingTime());
                        notification.put("meetingId", meeting.getId());
                        notification.put("jitsiLink", meeting.getJitsiLink());
                        notification.put("meetingTitle", meeting.getTitle());
                        notification.put("meetingDate", meeting.getMeetingDate());
                        notification.put("meetingTime", meeting.getMeetingTime());
                        notification.put("organizerId", meeting.getOrganizerId());
                        
                        // Send via WebSocket to participant
                        System.out.println("📤 Sending WebSocket notification to user: " + userEmail.toLowerCase());
                        System.out.println("   Destination: /user/" + userEmail.toLowerCase() + "/queue/meetings");
                        System.out.println("   Notification: " + notification);
                        
                        messagingTemplate.convertAndSendToUser(
                            userEmail.toLowerCase(),
                            "/queue/meetings",
                            notification
                        );
                        System.out.println("✅ WebSocket notification sent to user " + participantId + " (" + userEmail + ")");
                    } catch (InterruptedException e) {
                        System.err.println("⚠️ Thread interrupted while sending notification: " + e.getMessage());
                    } catch (Exception e) {
                        System.err.println("⚠️ Failed to send WebSocket notification to user " + participantId + ": " + e.getMessage());
                        e.printStackTrace();
                    }
                }).start();
                
                // Also try to send email notification
                try {
                    Map<String, Object> emailNotif = new HashMap<>();
                    emailNotif.put("recipientEmail", userEmail);
                    emailNotif.put("organizer", "Admin");
                    emailNotif.put("meetingLink", meeting.getJitsiLink());
                    emailNotif.put("title", "Meeting Invitation: " + meeting.getTitle());
                    emailNotif.put("message", "You've been invited to \"" + meeting.getTitle() + "\" on " + meeting.getMeetingDate() + " at " + meeting.getMeetingTime());
                    
                    restTemplate.postForObject(
                        "http://localhost:8082/api/notify/send",
                        emailNotif,
                        Map.class
                    );
                    System.out.println("✅ Email notification sent to user " + participantId);
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to send email notification to user " + participantId + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error sending notifications: " + e.getMessage());
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getMeeting(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Email", required = true) String userEmail) {
        try {
            Long organizationId = organizationValidator.getOrganizationIdFromEmail(userEmail);
            if (organizationId == null) {
                return ResponseEntity.status(403).body(Map.of("error", "User organization not found"));
            }
            
            Meeting meeting = meetingService.getMeetingById(id).orElse(null);
            if (meeting == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Validate meeting belongs to user's organization (backward compatible with null organizationId)
            if (meeting.getOrganizationId() != null && !meeting.getOrganizationId().equals(organizationId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            
            return ResponseEntity.ok(meeting);
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getMeetingsForUser(
            @PathVariable Long userId,
            @RequestHeader(value = "X-User-Email", required = true) String userEmail) {
        try {
            Long organizationId = organizationValidator.getOrganizationIdFromEmail(userEmail);
            if (organizationId == null) {
                return ResponseEntity.status(403).body(Map.of("error", "User organization not found"));
            }
            
            List<Meeting> meetings = meetingService.getMeetingsForUser(userId);
            // Filter by organization (backward compatible with null organizationId)
            List<Meeting> filteredMeetings = meetings.stream()
                .filter(m -> m.getOrganizationId() == null || m.getOrganizationId().equals(organizationId))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(filteredMeetings);
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }
    
    @GetMapping("/organizer/{organizerId}")
    public ResponseEntity<?> getMeetingsOrganizedBy(
            @PathVariable Long organizerId,
            @RequestHeader(value = "X-User-Email", required = true) String userEmail) {
        try {
            Long organizationId = organizationValidator.getOrganizationIdFromEmail(userEmail);
            if (organizationId == null) {
                return ResponseEntity.status(403).body(Map.of("error", "User organization not found"));
            }
            
            List<Meeting> meetings = meetingService.getMeetingsOrganizedBy(organizerId);
            // Filter by organization (backward compatible with null organizationId)
            List<Meeting> filteredMeetings = meetings.stream()
                .filter(m -> m.getOrganizationId() == null || m.getOrganizationId().equals(organizationId))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(filteredMeetings);
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }
    
    @GetMapping("/participant/{userId}")
    public ResponseEntity<?> getMeetingsAsParticipant(
            @PathVariable Long userId,
            @RequestHeader(value = "X-User-Email", required = true) String userEmail) {
        try {
            Long organizationId = organizationValidator.getOrganizationIdFromEmail(userEmail);
            if (organizationId == null) {
                return ResponseEntity.status(403).body(Map.of("error", "User organization not found"));
            }
            
            List<Meeting> meetings = meetingService.getMeetingsForUser(userId);
            // Filter by organization (backward compatible with null organizationId)
            List<Meeting> filteredMeetings = meetings.stream()
                .filter(m -> m.getOrganizationId() == null || m.getOrganizationId().equals(organizationId))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(filteredMeetings);
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMeeting(
            @PathVariable Long id,
            @RequestBody Meeting meeting,
            @RequestHeader(value = "X-User-Email", required = true) String userEmail) {
        try {
            Long organizationId = organizationValidator.getOrganizationIdFromEmail(userEmail);
            if (organizationId == null) {
                return ResponseEntity.status(403).body(Map.of("error", "User organization not found"));
            }
            
            Meeting existing = meetingService.getMeetingById(id).orElse(null);
            if (existing == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Validate meeting belongs to user's organization (backward compatible with null organizationId)
            if (existing.getOrganizationId() != null && !existing.getOrganizationId().equals(organizationId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            
            Meeting updated = meetingService.updateMeeting(id, meeting);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied or invalid request"));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMeeting(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Email", required = true) String userEmail) {
        try {
            Long organizationId = organizationValidator.getOrganizationIdFromEmail(userEmail);
            if (organizationId == null) {
                return ResponseEntity.status(403).body(Map.of("error", "User organization not found"));
            }
            
            // Get meeting details before deletion for notification purposes
            Meeting meeting = meetingService.getMeetingById(id).orElse(null);
            
            if (meeting == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Validate meeting belongs to user's organization (backward compatible with null organizationId)
            if (meeting.getOrganizationId() != null && !meeting.getOrganizationId().equals(organizationId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            
            // Delete the meeting
            meetingService.deleteMeeting(id);
            
            // Send cancellation notifications to participants
            if (meeting.getParticipantIds() != null && !meeting.getParticipantIds().isEmpty()) {
                sendCancellationNotifications(meeting);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Meeting deleted successfully");
            response.put("participantsNotified", meeting.getParticipantIds() != null ? meeting.getParticipantIds().size() : 0);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied or invalid request"));
        }
    }
    
    private void sendCancellationNotifications(Meeting meeting) {
        try {
            // Fetch all users to get their emails
            Map<Long, String> userEmailMap = new HashMap<>();
            try {
                List<?> users = restTemplate.getForObject("http://localhost:8081/api/admin/users/all", List.class);
                if (users != null) {
                    for (Object userObj : users) {
                        if (userObj instanceof Map) {
                            Map<String, Object> user = (Map<String, Object>) userObj;
                            Long userId = null;
                            String email = null;
                            
                            // Try different field names for ID
                            if (user.containsKey("id")) {
                                userId = ((Number) user.get("id")).longValue();
                            } else if (user.containsKey("userId")) {
                                userId = ((Number) user.get("userId")).longValue();
                            }
                            
                            // Try different field names for email
                            if (user.containsKey("email")) {
                                email = (String) user.get("email");
                            } else if (user.containsKey("emailAddress")) {
                                email = (String) user.get("emailAddress");
                            }
                            
                            if (userId != null && email != null) {
                                userEmailMap.put(userId, email);
                            }
                        }
                    }
                }
                System.out.println("✅ Fetched " + userEmailMap.size() + " users from admin service");
            } catch (Exception e) {
                System.err.println("⚠️ Failed to fetch users from admin service: " + e.getMessage());
            }
            
            // Send cancellation notifications to each participant in a separate thread with delay
            for (Long participantId : meeting.getParticipantIds()) {
                String userEmail = userEmailMap.getOrDefault(participantId, "user" + participantId + "@example.com");
                
                // Send notification in background thread with longer delay
                // Using 2000ms delay to give participants time to subscribe to WebSocket
                new Thread(() -> {
                    try {
                        // Delay to ensure participant has subscribed to WebSocket
                        // Increased from 1000ms to 2000ms for better reliability
                        Thread.sleep(2000);
                        
                        Map<String, Object> notification = new HashMap<>();
                        notification.put("userId", participantId);
                        notification.put("type", "MEETING_CANCELLED");
                        notification.put("title", "Meeting Cancelled: " + meeting.getTitle());
                        notification.put("message", "The meeting \"" + meeting.getTitle() + "\" scheduled for " + meeting.getMeetingDate() + " at " + meeting.getMeetingTime() + " has been cancelled by the organizer.");
                        notification.put("meetingId", meeting.getId());
                        notification.put("meetingTitle", meeting.getTitle());
                        notification.put("meetingDate", meeting.getMeetingDate());
                        notification.put("meetingTime", meeting.getMeetingTime());
                        notification.put("action", "CANCELLED");
                        
                        // Send via WebSocket to participant
                        System.out.println("📤 Sending cancellation WebSocket notification to user: " + userEmail.toLowerCase());
                        System.out.println("   Destination: /user/" + userEmail.toLowerCase() + "/queue/meetings");
                        System.out.println("   Notification: " + notification);
                        
                        messagingTemplate.convertAndSendToUser(
                            userEmail.toLowerCase(),
                            "/queue/meetings",
                            notification
                        );
                        System.out.println("✅ WebSocket cancellation notification sent to user " + participantId + " (" + userEmail + ")");
                    } catch (InterruptedException e) {
                        System.err.println("⚠️ Thread interrupted while sending cancellation notification: " + e.getMessage());
                    } catch (Exception e) {
                        System.err.println("⚠️ Failed to send WebSocket cancellation notification to user " + participantId + ": " + e.getMessage());
                        e.printStackTrace();
                    }
                }).start();
                
                // Also try to send email notification
                try {
                    Map<String, Object> emailNotif = new HashMap<>();
                    emailNotif.put("recipientEmail", userEmail);
                    emailNotif.put("organizer", "Admin");
                    emailNotif.put("title", "Meeting Cancelled: " + meeting.getTitle());
                    emailNotif.put("message", "The meeting \"" + meeting.getTitle() + "\" scheduled for " + meeting.getMeetingDate() + " at " + meeting.getMeetingTime() + " has been cancelled by the organizer.");
                    
                    restTemplate.postForObject(
                        "http://localhost:8082/api/notify/send",
                        emailNotif,
                        Map.class
                    );
                    System.out.println("✅ Cancellation email notification sent to user " + participantId);
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to send cancellation email notification to user " + participantId + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error sending cancellation notifications: " + e.getMessage());
        }
    }
    
    @GetMapping
    public ResponseEntity<?> getAllMeetings(
            @RequestHeader(value = "X-User-Email", required = true) String userEmail) {
        try {
            Long organizationId = organizationValidator.getOrganizationIdFromEmail(userEmail);
            if (organizationId == null) {
                return ResponseEntity.status(403).body(Map.of("error", "User organization not found"));
            }
            
            List<Meeting> meetings = meetingService.getAllMeetings();
            // Filter by organization (backward compatible with null organizationId)
            List<Meeting> filteredMeetings = meetings.stream()
                .filter(m -> m.getOrganizationId() == null || m.getOrganizationId().equals(organizationId))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(filteredMeetings);
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
    }
}
