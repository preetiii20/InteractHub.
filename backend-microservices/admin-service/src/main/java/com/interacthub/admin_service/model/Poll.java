package com.interacthub.admin_service.model;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "polls")
public class Poll {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false) private String question;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "poll_options", joinColumns = @JoinColumn(name = "poll_id"))
    @Column(name = "option_text")
    private List<String> options;

    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private TargetAudience targetAudience;

    @Column(name="created_by_name", nullable=false)
    private String createdByName;

    @Column(name="is_active") private Boolean isActive = true;

    @Column(name="created_at") private LocalDateTime createdAt;

    @PrePersist protected void onCreate() { this.createdAt = LocalDateTime.now(); }

    public enum TargetAudience { ALL, HR, MANAGER, EMPLOYEE, DEPARTMENT, ADMIN }

    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getQuestion() { return question; } public void setQuestion(String question) { this.question = question; }
    public List<String> getOptions() { return options; } public void setOptions(List<String> options) { this.options = options; }
    public TargetAudience getTargetAudience() { return targetAudience; } public void setTargetAudience(TargetAudience targetAudience) { this.targetAudience = targetAudience; }
    public String getCreatedByName() { return createdByName; } public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public Boolean getIsActive() { return isActive; } public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
