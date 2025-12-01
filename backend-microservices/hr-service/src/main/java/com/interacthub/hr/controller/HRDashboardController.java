package com.interacthub.hr.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.hr.service.HRDashboardService;

@RestController
@RequestMapping("/api/hr/dashboard")
@CrossOrigin(origins = "http://localhost:3000")
public class HRDashboardController {
    private final HRDashboardService service;

    public HRDashboardController(HRDashboardService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(service.getDashboardStats());
    }
}

