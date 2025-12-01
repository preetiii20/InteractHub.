package com.interacthub.manager.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "manager_announcements")
public class ManagerAnnouncement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false) private Long managerId;
    @Column(nullable=false) private Long departmentId;

    @Column(nullable=false) private String title;
    @Column(nullable=false, columnDefinition="TEXT") private String content;

    @Column(nullable=false) private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getManagerId() { return managerId; } public void setManagerId(Long managerId) { this.managerId = managerId; }
    public Long getDepartmentId() { return departmentId; } public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; } public void setContent(String content) { this.content = content; }
    public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
