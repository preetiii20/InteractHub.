package com.interacthub.hr.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.interacthub.hr.model.AttendanceRecord;
import com.interacthub.hr.repository.AttendanceRepository;

@Service
@Transactional
public class AttendanceService {
    private final AttendanceRepository repo;
    private final RestTemplate restTemplate;

    @Value("${admin.service.url:http://localhost:8081/api/admin}")
    private String adminServiceUrl;

    public AttendanceService(AttendanceRepository repo, RestTemplate restTemplate) { this.repo = repo; this.restTemplate = restTemplate; }

    public List<AttendanceRecord> getEmployeeAttendance(Long employeeId) {
        return repo.findByEmployeeIdOrderByDateDesc(employeeId);
    }

    public List<AttendanceRecord> getAttendanceByDate(LocalDate date) {
        return repo.findByDate(date);
    }

    public AttendanceRecord mark(Long employeeId, String type, LocalDate date) {
        AttendanceRecord record = repo.findByEmployeeIdOrderByDateDesc(employeeId)
            .stream().filter(r -> r.getDate().equals(date)).findFirst()
            .orElseGet(() -> {
                AttendanceRecord r = new AttendanceRecord();
                r.setEmployeeId(employeeId);
                r.setDate(date);
                r.setStatus("PRESENT");
                return r;
            });

        // Ensure employeeName is populated
        if (record.getEmployeeName() == null || record.getEmployeeName().isBlank()) {
            try {
                var response = restTemplate.getForEntity(adminServiceUrl + "/users", java.util.List.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    for (Object o : response.getBody()) {
                        if (o instanceof java.util.Map<?, ?> m) {
                            Object id = m.get("id");
                            if (id != null && Long.valueOf(String.valueOf(id)).equals(employeeId)) {
                                Object fn = m.get("firstName");
                                Object ln = m.get("lastName");
                                String firstName = fn == null ? "" : String.valueOf(fn);
                                String lastName = ln == null ? "" : String.valueOf(ln);
                                String fullName = (firstName + " " + lastName).trim();
                                if (!fullName.isBlank()) record.setEmployeeName(fullName);
                                break;
                            }
                        }
                    }
                }
            } catch (Exception ignore) { }
        }

        String now = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        if ("CHECK_IN".equalsIgnoreCase(type)) {
            record.setCheckInTime(now);
            record.setStatus("CHECKED_IN");
        } else if ("CHECK_OUT".equalsIgnoreCase(type)) {
            record.setCheckOutTime(now);
            record.setStatus("PRESENT");
            
            // Calculate work hours if check-in exists
            if (record.getCheckInTime() != null && !record.getCheckInTime().isEmpty()) {
                try {
                    LocalTime checkIn = LocalTime.parse(record.getCheckInTime(), DateTimeFormatter.ofPattern("HH:mm:ss"));
                    LocalTime checkOut = LocalTime.parse(now, DateTimeFormatter.ofPattern("HH:mm:ss"));
                    long minutes = java.time.Duration.between(checkIn, checkOut).toMinutes();
                    double hours = minutes / 60.0;
                    record.setWorkHours(hours);
                } catch (Exception e) {
                    System.err.println("Error calculating work hours: " + e.getMessage());
                }
            }
        }

        return repo.save(record);
    }
}


