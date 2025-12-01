package com.interacthub.chat.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "announcement_interactions")
public class AnnouncementInteraction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private Long announcementId;

    @Column(nullable=false)
    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false)
    private InteractionType type; // LIKE or COMMENT

    @Column(length = 2000)
    private String content;

    @Column(nullable=false)
    private Instant createdAt = Instant.now();

    public enum InteractionType { LIKE, COMMENT }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAnnouncementId() { return announcementId; }
    public void setAnnouncementId(Long announcementId) { this.announcementId = announcementId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public InteractionType getType() { return type; }
    public void setType(InteractionType type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

