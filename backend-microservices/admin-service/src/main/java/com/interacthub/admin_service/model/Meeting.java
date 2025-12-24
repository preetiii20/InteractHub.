package com.interacthub.admin_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "meetings", indexes = {
    @Index(name = "idx_meeting_org", columnList = "organization_id")
})
public class Meeting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "organization_id")
    private Long organizationId; // Organization isolation
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private String meetingDate;
    
    @Column(nullable = false)
    private String meetingTime;
    
    @Column(nullable = false)
    private String meetingEndTime;
    
    @Column(nullable = false)
    private String jitsiLink;
    
    @Column(nullable = false)
    private Long organizerId;
    
    @Column(nullable = false)
    private String organizerRole;
    
    @ElementCollection
    @CollectionTable(name = "meeting_participants", joinColumns = @JoinColumn(name = "meeting_id"))
    @Column(name = "participant_id")
    private List<Long> participantIds;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getMeetingDate() {
        return meetingDate;
    }
    
    public void setMeetingDate(String meetingDate) {
        this.meetingDate = meetingDate;
    }
    
    public String getMeetingTime() {
        return meetingTime;
    }
    
    public void setMeetingTime(String meetingTime) {
        this.meetingTime = meetingTime;
    }
    
    public String getMeetingEndTime() {
        return meetingEndTime;
    }
    
    public void setMeetingEndTime(String meetingEndTime) {
        this.meetingEndTime = meetingEndTime;
    }
    
    public String getJitsiLink() {
        return jitsiLink;
    }
    
    public void setJitsiLink(String jitsiLink) {
        this.jitsiLink = jitsiLink;
    }
    
    public Long getOrganizerId() {
        return organizerId;
    }
    
    public void setOrganizerId(Long organizerId) {
        this.organizerId = organizerId;
    }
    
    public String getOrganizerRole() {
        return organizerRole;
    }
    
    public void setOrganizerRole(String organizerRole) {
        this.organizerRole = organizerRole;
    }
    
    public List<Long> getParticipantIds() {
        return participantIds;
    }
    
    public void setParticipantIds(List<Long> participantIds) {
        this.participantIds = participantIds;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public Long getOrganizationId() {
        return organizationId;
    }
    
    public void setOrganizationId(Long organizationId) {
        this.organizationId = organizationId;
    }
}
