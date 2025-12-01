package com.interacthub.manager.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "onboard_requests")
public class OnboardRequest {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Column
    private String phone;

    @Column
    private String roleTitle;

    @Column
    private String department;

    @Column(nullable = false)
    private Long requestedByManagerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(nullable = false)
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column
    private LocalDateTime resolvedAt;

    public enum Status {
        PENDING, APPROVED, REJECTED
    }

    // Constructors
    public OnboardRequest() {}

    public OnboardRequest(String fullName, String email, String phone, String roleTitle, 
                         String department, Long requestedByManagerId) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.roleTitle = roleTitle;
        this.department = department;
        this.requestedByManagerId = requestedByManagerId;
        this.requestedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRoleTitle() { return roleTitle; }
    public void setRoleTitle(String roleTitle) { this.roleTitle = roleTitle; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public Long getRequestedByManagerId() { return requestedByManagerId; }
    public void setRequestedByManagerId(Long requestedByManagerId) { this.requestedByManagerId = requestedByManagerId; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { 
        this.status = status; 
        if (status != Status.PENDING) {
            this.resolvedAt = LocalDateTime.now();
        }
    }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
