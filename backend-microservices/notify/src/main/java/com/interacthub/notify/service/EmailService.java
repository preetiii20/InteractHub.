package com.interacthub.notify.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender; 
    
    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendWelcomeEmail(Map<String, Object> payload) {
        // --- Retrieve Password and Recipient Data ---
        String recipientEmail = (String) payload.get("recipientEmail");
        String role = (String) payload.get("role");
        String firstName = (String) payload.get("firstName");
        String tempPassword = (String) payload.get("tempPassword"); 
        
        if (tempPassword == null || tempPassword.isEmpty()) {
             System.err.println("❌ ERROR: Temporary Password was NULL/Empty. Cannot send credentials.");
             throw new RuntimeException("Failed to send email: Temporary password missing from payload.");
        }
        
        String loginLink = "http://localhost:3000/login"; 
        
        // --- EMAIL MESSAGE SETUP ---
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(senderEmail); 
        message.setTo(recipientEmail);
        message.setSubject("Welcome to InteractHub! Your Account Credentials");
        
        message.setText(
            "Dear " + firstName + ",\n\n" +
            "Welcome to InteractHub! Your account has been successfully created with the role: " + role + ".\n\n" +
            "Your temporary login credentials are:\n" +
            "Email: " + recipientEmail + "\n" +
            "Temporary Password: " + tempPassword + "\n\n" + 
            "Please log in immediately using the link below:\n" +
            loginLink + "\n" +
            "Thank You,\nThe InteractHub Team"
        );
        
        // --- REAL EMAIL EXECUTION ---
        try {
            mailSender.send(message); 
            System.out.println("=======================================================");
            System.out.println("✅ REAL EMAIL SENT TO: " + recipientEmail + " with password: " + tempPassword);
            System.out.println("=======================================================");
        } catch (Exception e) {
            System.err.println("❌ FATAL EMAIL ERROR: Failed to send email. Check SMTP credentials/network. Error: " + e.getMessage());
            throw new RuntimeException("Failed to send welcome email due to SMTP error.", e);
        }
    }

    public void sendMeetingInvitation(Map<String, Object> payload) {
        // --- Retrieve Meeting Data ---
        String recipientEmail = (String) payload.get("recipientEmail");
        String meetingTitle = (String) payload.getOrDefault("meetingTitle", "Meeting");
        String meetingDate = (String) payload.getOrDefault("meetingDate", "");
        String meetingTime = (String) payload.getOrDefault("meetingTime", "");
        String meetingEndTime = (String) payload.getOrDefault("meetingEndTime", "");
        String meetingLink = (String) payload.getOrDefault("meetingLink", "");
        String organizer = (String) payload.getOrDefault("organizer", "");
        String description = (String) payload.getOrDefault("description", "");
        
        if (recipientEmail == null || recipientEmail.isEmpty()) {
            System.err.println("❌ ERROR: Recipient email is NULL/Empty. Cannot send meeting invitation.");
            throw new RuntimeException("Failed to send email: Recipient email missing from payload.");
        }
        
        // --- EMAIL MESSAGE SETUP ---
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(senderEmail);
        message.setTo(recipientEmail);
        message.setSubject("Meeting Invitation: " + meetingTitle);
        
        String emailBody = "You have been invited to a meeting!\n\n" +
            "Meeting Title: " + meetingTitle + "\n" +
            "Date: " + meetingDate + "\n" +
            "Time: " + meetingTime + (meetingEndTime != null && !meetingEndTime.isEmpty() ? " - " + meetingEndTime : "") + "\n" +
            "Organizer: " + organizer + "\n";
        
        if (description != null && !description.isEmpty()) {
            emailBody += "Description: " + description + "\n";
        }
        
        emailBody += "\nJoin the meeting: " + meetingLink + "\n\n" +
            "Please click the link above to join the video meeting.\n\n" +
            "Thank You,\nThe InteractHub Team";
        
        message.setText(emailBody);
        
        // --- REAL EMAIL EXECUTION ---
        try {
            mailSender.send(message);
            System.out.println("=======================================================");
            System.out.println("✅ MEETING INVITATION EMAIL SENT TO: " + recipientEmail);
            System.out.println("   Meeting: " + meetingTitle);
            System.out.println("   Date: " + meetingDate + " at " + meetingTime);
            System.out.println("   Link: " + meetingLink);
            System.out.println("=======================================================");
        } catch (Exception e) {
            System.err.println("❌ FATAL EMAIL ERROR: Failed to send meeting invitation. Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send meeting invitation due to SMTP error.", e);
        }
    }
}