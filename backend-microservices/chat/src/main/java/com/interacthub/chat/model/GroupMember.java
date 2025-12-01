package com.interacthub.chat.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name="chat_group_members",
       uniqueConstraints = @UniqueConstraint(columnNames = {"groupId","memberName"}),
       indexes = { @Index(name="idx_members_group", columnList="groupId")})
public class GroupMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false) private String groupId;
    @Column(nullable=false) private String memberName;
    @Column(nullable=false) private Instant joinedAt = Instant.now();

    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getGroupId() { return groupId; } public void setGroupId(String groupId) { this.groupId = groupId; }
    public String getMemberName() { return memberName; } public void setMemberName(String memberName) { this.memberName = memberName; }
    public Instant getJoinedAt() { return joinedAt; } public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }
}
