package com.interacthub.manager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "manager_polls")
public class ManagerPoll {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false) private Long managerId;
    @Column(nullable=false) private Long departmentId;

    @Column(nullable=false) private String question;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "manager_poll_options", joinColumns = @JoinColumn(name = "poll_id"))
    @Column(name = "option_text")
    private List<String> options;

    @Column(nullable=false) private Boolean isActive = true;

    @Column(nullable=false) private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getManagerId() { return managerId; } public void setManagerId(Long managerId) { this.managerId = managerId; }
    public Long getDepartmentId() { return departmentId; } public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getQuestion() { return question; } public void setQuestion(String question) { this.question = question; }
    public List<String> getOptions() { return options; } public void setOptions(List<String> options) { this.options = options; }
    public Boolean getIsActive() { return isActive; } public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
