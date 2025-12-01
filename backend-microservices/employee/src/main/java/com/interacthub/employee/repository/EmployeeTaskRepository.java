package com.interacthub.employee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.employee.model.EmployeeTask;

@Repository
public interface EmployeeTaskRepository extends JpaRepository<EmployeeTask, Long> {
    List<EmployeeTask> findByEmployeeEmail(String employeeEmail);
    List<EmployeeTask> findByEmployeeEmailOrderByAssignedDateDesc(String employeeEmail);
}

