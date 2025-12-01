package com.interacthub.hr.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.interacthub.hr.model.LeaveRequest;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByEmployeeIdOrderByRequestedAtDesc(Long employeeId);
    List<LeaveRequest> findByStatusOrderByRequestedAtDesc(String status);
}


