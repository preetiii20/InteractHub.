package com.interacthub.hr.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.interacthub.hr.model.AttendanceRecord;
import com.interacthub.hr.service.AttendanceService;

@RestController
@RequestMapping("/api/hr/attendance")
@CrossOrigin(origins = "http://localhost:3000")
public class AttendanceController {

    private final AttendanceService service;

    public AttendanceController(AttendanceService service) { this.service = service; }

    @GetMapping("/employee/{employeeId}")
    public List<AttendanceRecord> byEmployee(@PathVariable Long employeeId) {
        return service.getEmployeeAttendance(employeeId);
    }

    @GetMapping
    public List<AttendanceRecord> byDate(@RequestParam(required = false) String date) {
        LocalDate d = date == null || date.isBlank() ? LocalDate.now() : LocalDate.parse(date);
        return service.getAttendanceByDate(d);
    }

    @PostMapping("/mark")
    public ResponseEntity<AttendanceRecord> mark(@RequestBody Map<String, Object> payload) {
        Long employeeId = Long.valueOf(String.valueOf(payload.get("employeeId")));
        String type = String.valueOf(payload.get("type"));
        String day = String.valueOf(payload.getOrDefault("date", LocalDate.now().toString()));
        AttendanceRecord saved = service.mark(employeeId, type, LocalDate.parse(day));
        return ResponseEntity.ok(saved);
    }
}


