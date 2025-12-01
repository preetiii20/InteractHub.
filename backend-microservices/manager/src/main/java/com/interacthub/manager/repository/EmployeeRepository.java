package com.interacthub.manager.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.interacthub.manager.model.Employee;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    List<Employee> findByManagerId(Long managerId);

    @Query("SELECT e FROM Employee e WHERE e.managerId = :managerId AND e.isActive = true")
    List<Employee> findByManagerIdAndIsActiveTrue(Long managerId);

    Optional<Employee> findByEmail(String email);

    // Simple LIKE search by first/last name
    @Query("SELECT e FROM Employee e WHERE e.managerId = :managerId AND " +
           "(LOWER(e.firstName) LIKE LOWER(:nameLike) OR LOWER(e.lastName) LIKE LOWER(:nameLike))")
    List<Employee> searchByManagerAndName(Long managerId, String nameLike);

    long count();
    
    // Add missing method for finding active employees
    List<Employee> findByIsActiveTrue();
}
