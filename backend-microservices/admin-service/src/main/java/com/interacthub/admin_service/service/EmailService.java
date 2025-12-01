package com.interacthub.admin_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
    
    @Autowired(required = false)
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.username:preetik2172@gmail.com}")
    private String fromEmail;
    
    @Value("${email.enabled:true}")
    private boolean emailEnabled;
    
    /**
     * Send password reset email
     */
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = "http://localhost:3000/reset-password?token=" + resetToken;
        
        // Always log to console for debugging
        System.out.println("=".repeat(80));
        System.out.println("📧 PASSWORD RESET EMAIL");
        System.out.println("=".repeat(80));
        System.out.println("To: " + toEmail);
        System.out.println("🔗 Reset Link: " + resetLink);
        System.out.println("=".repeat(80));
        
        // Send actual email if configured
        if (emailEnabled && mailSender != null) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                helper.setFrom(fromEmail);
                helper.setTo(toEmail);
                helper.setSubject("InteractHub - Password Reset Request");
                
                String htmlContent = buildPasswordResetEmail(resetLink);
                helper.setText(htmlContent, true);
                
                mailSender.send(message);
                System.out.println("✅ Email sent successfully to: " + toEmail);
            } catch (MessagingException e) {
                System.err.println("❌ Failed to send email: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("ℹ️  Email sending is disabled. Check application.properties to enable.");
        }
    }
    
    /**
     * Send password changed confirmation email
     */
    public void sendPasswordChangedEmail(String toEmail) {
        System.out.println("=".repeat(80));
        System.out.println("📧 PASSWORD CHANGED CONFIRMATION");
        System.out.println("=".repeat(80));
        System.out.println("To: " + toEmail);
        System.out.println("=".repeat(80));
        
        if (emailEnabled && mailSender != null) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                helper.setFrom(fromEmail);
                helper.setTo(toEmail);
                helper.setSubject("InteractHub - Password Changed Successfully");
                
                String htmlContent = buildPasswordChangedEmail();
                helper.setText(htmlContent, true);
                
                mailSender.send(message);
                System.out.println("✅ Email sent successfully to: " + toEmail);
            } catch (MessagingException e) {
                System.err.println("❌ Failed to send email: " + e.getMessage());
            }
        }
    }
    
    private String buildPasswordResetEmail(String resetLink) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: %%23333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, %%23667eea 0%%, %%23764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: %%23f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, %%23667eea 0%%, %%23764ba2 100%%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: %%23666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>You requested to reset your password for your InteractHub account.</p>
                        <p>Click the button below to reset your password:</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button">Reset Password</a>
                        </p>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background: %%23fff; padding: 10px; border-radius: 5px;">%s</p>
                        <p><strong>⏰ This link will expire in 1 hour.</strong></p>
                        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 InteractHub. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """, resetLink, resetLink);
    }
    
    private String buildPasswordChangedEmail() {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: %%23333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, %%2310b981 0%%, %%23059669 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: %%23f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .footer { text-align: center; margin-top: 20px; color: %%23666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Password Changed Successfully</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>Your password has been successfully changed for your InteractHub account.</p>
                        <p>If you made this change, no further action is required.</p>
                        <p><strong>⚠️ If you didn't make this change, please contact support immediately.</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2024 InteractHub. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """;
    }
}
