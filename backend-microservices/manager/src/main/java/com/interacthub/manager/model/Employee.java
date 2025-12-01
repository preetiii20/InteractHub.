package com.interacthub.manager.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "employees")
public class Employee {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false) private Long managerId;

    @Column(nullable=false) private String firstName;
    @Column private String lastName;
    @Column private String email;
    @Column private String position;
    @Column private String phoneNumber;

    @Column(nullable=false) private Boolean isActive = true;
    
    @Column private String department;
    
    @Column private String role;

    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getManagerId() { return managerId; } public void setManagerId(Long managerId) { this.managerId = managerId; }
    public String getFirstName() { return firstName; } public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; } public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
    public String getPosition() { return position; } public void setPosition(String position) { this.position = position; }
    public String getPhoneNumber() { return phoneNumber; } public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public Boolean getIsActive() { return isActive; } public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getDepartment() { return department; } public void setDepartment(String department) { this.department = department; }
    public String getRole() { return role; } public void setRole(String role) { this.role = role; }
}
