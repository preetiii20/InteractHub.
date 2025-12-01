package com.interacthub.chat.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="chat_groups", indexes = {
    @Index(name="idx_group_groupId", columnList="groupId", unique = true)
})
public class ChatGroup {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true) private String groupId; // e.g., UUID
    @Column(nullable=false) private String name;
    @Column(nullable=false) private String createdByName;
    @Column(nullable=false) private Instant createdAt = Instant.now();

    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getGroupId() { return groupId; } public void setGroupId(String groupId) { this.groupId = groupId; }
    public String getName() { return name; } public void setName(String name) { this.name = name; }
    public String getCreatedByName() { return createdByName; } public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public Instant getCreatedAt() { return createdAt; } public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
