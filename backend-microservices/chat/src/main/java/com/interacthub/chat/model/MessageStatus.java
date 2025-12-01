package com.interacthub.chat.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "message_status", indexes = {
    @Index(name = "idx_msg_status_msg", columnList = "message_id"),
    @Index(name = "idx_msg_status_user", columnList = "user_id")
})
public class MessageStatus {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "message_id", nullable = false)
    private Long messageId;
    
    @Column(name = "message_type", nullable = false)
    private String messageType; // GROUP or DIRECT
    
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    @Column(name = "status", nullable = false)
    private String status; // DELIVERED, READ
    
    @Column(name = "timestamp", nullable = false)
    private Instant timestamp = Instant.now();
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getMessageId() { return messageId; }
    public void setMessageId(Long messageId) { this.messageId = messageId; }
    
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
