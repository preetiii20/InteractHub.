package com.interacthub.employee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.employee.model.CompanyPoll;

@Repository
public interface CompanyPollRepository extends JpaRepository<CompanyPoll, Long> {
    List<CompanyPoll> findByIsActiveTrueOrderByCreatedAtDesc();
}

