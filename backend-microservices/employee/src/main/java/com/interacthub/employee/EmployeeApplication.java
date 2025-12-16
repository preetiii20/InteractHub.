package com.interacthub.employee;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(exclude = {
    org.springframework.boot.autoconfigure.h2.H2ConsoleAutoConfiguration.class
})
@EnableJpaRepositories(basePackages = "com.interacthub.employee.repository")
public class EmployeeApplication {
    public static void main(String[] args) {
        SpringApplication.run(EmployeeApplication.class, args);
        System.out.println("✅ Employee Microservice is running on port 8084...");
        System.out.println("📊 Database: MySQL (interacthub_employee)");
    }
}

