package com.interacthub.hr.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.interacthub.hr.model.LeaveRequest;
import com.interacthub.hr.repository.LeaveRequestRepository;

@Service
@Transactional
public class LeaveRequestService {
    private final LeaveRequestRepository repo;

    public LeaveRequestService(LeaveRequestRepository repo) { this.repo = repo; }

    public List<LeaveRequest> getByEmployee(Long employeeId) {
        return repo.findByEmployeeIdOrderByRequestedAtDesc(employeeId);
    }

    public List<LeaveRequest> getByStatus(String status) {
        if (status == null || status.isBlank()) return repo.findAll();
        return repo.findByStatusOrderByRequestedAtDesc(status.toUpperCase());
    }

    public LeaveRequest create(LeaveRequest req) {
        req.setStatus("PENDING");
        req.setRequestedAt(LocalDateTime.now());
        return repo.save(req);
    }

    public LeaveRequest approve(Long id, String comments) {
        LeaveRequest r = repo.findById(id).orElseThrow(() -> new RuntimeException("Leave request not found"));
        r.setStatus("APPROVED");
        r.setHrComments(comments);
        r.setProcessedAt(LocalDateTime.now());
        return repo.save(r);
    }

    public LeaveRequest reject(Long id, String comments) {
        LeaveRequest r = repo.findById(id).orElseThrow(() -> new RuntimeException("Leave request not found"));
        r.setStatus("REJECTED");
        r.setHrComments(comments);
        r.setProcessedAt(LocalDateTime.now());
        return repo.save(r);
    }
}


