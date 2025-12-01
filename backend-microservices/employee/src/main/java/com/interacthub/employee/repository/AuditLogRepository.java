package com.interacthub.employee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.employee.model.AuditLog;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEmployeeEmailOrderByTimestampDesc(String employeeEmail);
    List<AuditLog> findByEmployeeIdOrderByTimestampDesc(Long employeeId);
}

