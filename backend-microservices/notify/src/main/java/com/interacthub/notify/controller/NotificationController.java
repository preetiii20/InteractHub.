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
}