package com.interacthub.chat.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "channel_id")
    private String channelId; 
    
    @Column(name = "sender_id", nullable = false)
    private Long senderId;
    
    private String senderName; 
    
    @Column(columnDefinition = "TEXT")
    private String content; // Text message or WebRTC signaling data
    
    @Enumerated(EnumType.STRING)
    private MessageType type = MessageType.CHAT; // CHAT, VOICE_NOTE, VIDEO_SIGNAL
    
    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
    
    public enum MessageType { CHAT, JOIN, LEAVE, VOICE_NOTE, VIDEO_SIGNAL, COMMENT }
    
    // Manual Getters and Setters (REQUIRED)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getChannelId() { return channelId; }
    public void setChannelId(String channelId) { this.channelId = channelId; }
    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}






