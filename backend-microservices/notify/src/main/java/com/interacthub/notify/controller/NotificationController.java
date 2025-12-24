package com.interacthub.notify.controller;

import com.interacthub.notify.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/notify")
public class NotificationController {

    @Autowired
    private EmailService emailService;

    // This endpoint is called by the Admin Microservice (Port 8081)
    @PostMapping("/welcome-user")
    public ResponseEntity<?> sendWelcomeEmail(@RequestBody Map<String, Object> payload) {
        try {
            if (!payload.containsKey("recipientEmail")) {
                return ResponseEntity.badRequest().body("Missing recipient email.");
            }
            
            emailService.sendWelcomeEmail(payload);
            
            // Returns 200 OK status, confirming successful queuing/simulation
            return ResponseEntity.ok(Map.of("message", "Welcome email queued successfully."));
        } catch (Exception e) {
            System.err.println("Error processing welcome email request: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process notification request."));
        }
    }

    // New endpoint for meeting invitations
    @PostMapping("/send")
    public ResponseEntity<?> sendMeetingInvitation(@RequestBody Map<String, Object> payload) {
        try {
            if (!payload.containsKey("recipientEmail")) {
                return ResponseEntity.badRequest().body("Missing recipient email.");
            }
            
            String recipientEmail = (String) payload.get("recipientEmail");
            String meetingTitle = (String) payload.getOrDefault("meetingTitle", "Meeting");
            String meetingDate = (String) payload.getOrDefault("meetingDate", "");
            String meetingTime = (String) payload.getOrDefault("meetingTime", "");
            String meetingLink = (String) payload.getOrDefault("meetingLink", "");
            String organizer = (String) payload.getOrDefault("organizer", "");
            String description = (String) payload.getOrDefault("description", "");
            
            // Log the meeting invitation
            System.out.println("📧 Meeting Invitation Notification:");
            System.out.println("   To: " + recipientEmail);
            System.out.println("   Meeting: " + meetingTitle);
            System.out.println("   Date: " + meetingDate);
            System.out.println("   Time: " + meetingTime);
            System.out.println("   Link: " + meetingLink);
            System.out.println("   Organizer: " + organizer);
            
            // Send email notification
            emailService.sendMeetingInvitation(payload);
            
            return ResponseEntity.ok(Map.of(
                "message", "Meeting invitation sent successfully to " + recipientEmail,
                "recipientEmail", recipientEmail,
                "meetingTitle", meetingTitle
            ));
        } catch (Exception e) {
            System.err.println("❌ Error processing meeting invitation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to send meeting invitation."));
        }
    }
}