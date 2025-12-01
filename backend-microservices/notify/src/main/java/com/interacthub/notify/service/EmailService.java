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
}