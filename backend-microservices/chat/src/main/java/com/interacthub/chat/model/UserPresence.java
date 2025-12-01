package com.interacthub.chat.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_presence")
public class UserPresence {
    
    @Id
    @Column(name = "user_id")
    private String userId; // email or unique identifier
    
    @Column(name = "status", nullable = false)
    private String status = "OFFLINE"; // ONLINE, OFFLINE, AWAY
    
    @Column(name = "last_seen")
    private Instant lastSeen;
    
    @Column(name = "last_heartbeat")
    private Instant lastHeartbeat;
    
    @Column(name = "display_name")
    private String displayName;
    
    // Getters and Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Instant getLastSeen() { return lastSeen; }
    public void setLastSeen(Instant lastSeen) { this.lastSeen = lastSeen; }
    
    public Instant getLastHeartbeat() { return lastHeartbeat; }
    public void setLastHeartbeat(Instant lastHeartbeat) { this.lastHeartbeat = lastHeartbeat; }
    
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
}
