package com.interacthub.hr.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.interacthub.hr.model.AttendanceRecord;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByEmployeeIdOrderByDateDesc(Long employeeId);
    List<AttendanceRecord> findByDate(LocalDate date);
}


