package com.interacthub.employee.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.employee.model.Employee;
import com.interacthub.employee.security.JwtUtil;
import com.interacthub.employee.service.EmployeeService;

@RestController
@RequestMapping("/api/employee/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private EmployeeService employeeService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Employee employee) {
        if (employeeService.findByEmail(employee.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }
        
        Employee saved = employeeService.register(employee);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Employee registered successfully");
        response.put("employee", Map.of(
            "id", saved.getId(),
            "email", saved.getEmail(),
            "firstName", saved.getFirstName(),
            "lastName", saved.getLastName()
        ));
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        
        Optional<Employee> employeeOpt = employeeService.findByEmail(email);
        
        if (employeeOpt.isEmpty() || !passwordEncoder.matches(password, employeeOpt.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
        
        Employee employee = employeeOpt.get();
        
        String token = jwtUtil.generateToken(email);
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("role", employee.getRole());
        response.put("email", employee.getEmail());
        
        return ResponseEntity.ok(response);
    }
}

