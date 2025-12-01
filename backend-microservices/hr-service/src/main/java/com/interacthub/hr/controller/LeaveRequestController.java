package com.interacthub.hr.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.interacthub.hr.model.LeaveRequest;
import com.interacthub.hr.service.LeaveRequestService;

@RestController
@RequestMapping("/api/hr/leave-requests")
@CrossOrigin(origins = "http://localhost:3000")
public class LeaveRequestController {
    private final LeaveRequestService service;
    public LeaveRequestController(LeaveRequestService service) { this.service = service; }

    @GetMapping("/employee/{employeeId}")
    public List<LeaveRequest> byEmployee(@PathVariable Long employeeId) {
        return service.getByEmployee(employeeId);
    }

    @GetMapping
    public List<LeaveRequest> byStatus(@RequestParam(required = false) String status) {
        return service.getByStatus(status);
    }

    @PostMapping
    public ResponseEntity<LeaveRequest> create(@RequestBody LeaveRequest body) {
        return ResponseEntity.ok(service.create(body));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<LeaveRequest> approve(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        String comments = payload != null ? payload.getOrDefault("comments", "") : "";
        return ResponseEntity.ok(service.approve(id, comments));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<LeaveRequest> reject(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String comments = payload != null ? payload.getOrDefault("comments", "") : "";
        return ResponseEntity.ok(service.reject(id, comments));
    }
}


