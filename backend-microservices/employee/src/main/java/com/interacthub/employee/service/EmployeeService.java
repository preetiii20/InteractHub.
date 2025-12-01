package com.interacthub.employee.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.interacthub.employee.model.Employee;
import com.interacthub.employee.repository.EmployeeRepository;

@Service
public class EmployeeService {
    
    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public Employee register(Employee emp) {
        if (emp.getPassword() != null && !emp.getPassword().isEmpty()) {
            emp.setPassword(passwordEncoder.encode(emp.getPassword()));
        }
        return employeeRepository.save(emp);
    }
    
    public Optional<Employee> findByEmail(String email) {
        return employeeRepository.findByEmail(email);
    }
    
    public Optional<Employee> getById(Long id) {
        return employeeRepository.findById(id);
    }
    
    public Employee updateProfile(Long id, Employee partial) {
        return employeeRepository.findById(id)
                .map(existing -> {
                    if (partial.getFirstName() != null) existing.setFirstName(partial.getFirstName());
                    if (partial.getLastName() != null) existing.setLastName(partial.getLastName());
                    if (partial.getPhoneNumber() != null) existing.setPhoneNumber(partial.getPhoneNumber());
                    if (partial.getPassword() != null && !partial.getPassword().isEmpty()) {
                        existing.setPassword(passwordEncoder.encode(partial.getPassword()));
                    }
                    return employeeRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Employee not found"));
    }
    
    public Employee saveOrUpdate(Employee emp) {
        return employeeRepository.findByEmail(emp.getEmail())
                .map(existing -> {
                    if (emp.getFirstName() != null) existing.setFirstName(emp.getFirstName());
                    if (emp.getLastName() != null) existing.setLastName(emp.getLastName());
                    if (emp.getRole() != null) existing.setRole(emp.getRole());
                    if (emp.getDepartment() != null) existing.setDepartment(emp.getDepartment());
                    if (emp.getDepartmentId() != null) existing.setDepartmentId(emp.getDepartmentId());
                    if (emp.getManagerId() != null) existing.setManagerId(emp.getManagerId());
                    if (emp.getPosition() != null) existing.setPosition(emp.getPosition());
                    if (emp.getPhoneNumber() != null) existing.setPhoneNumber(emp.getPhoneNumber());
                    // Update password if provided (already hashed from sync controller)
                    if (emp.getPassword() != null && !emp.getPassword().isEmpty()) {
                        existing.setPassword(emp.getPassword());
                    }
                    if (emp.getIsActive() != null) existing.setIsActive(emp.getIsActive());
                    return employeeRepository.save(existing);
                })
                .orElseGet(() -> employeeRepository.save(emp));
    }
}

