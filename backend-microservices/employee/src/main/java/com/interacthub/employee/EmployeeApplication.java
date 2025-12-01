package com.interacthub.employee;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.interacthub.employee.repository")
public class EmployeeApplication {
    public static void main(String[] args) {
        SpringApplication.run(EmployeeApplication.class, args);
        System.out.println("✅ Employee Microservice is running on port 8084...");
        System.out.println("📊 H2 Console: http://localhost:8084/h2-console");
    }
}

