package com.interacthub.manager.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.manager.model.OnboardRequest;

@Repository
public interface OnboardRequestRepository extends JpaRepository<OnboardRequest, Long> {
    List<OnboardRequest> findByRequestedByManagerId(Long managerId);
    List<OnboardRequest> findByRequestedByManagerIdOrderByRequestedAtDesc(Long managerId);
    List<OnboardRequest> findByStatus(OnboardRequest.Status status);
    List<OnboardRequest> findByEmail(String email);
    long countByRequestedByManagerId(Long managerId);
    long countByRequestedByManagerIdAndStatus(Long managerId, OnboardRequest.Status status);
    long countByStatus(OnboardRequest.Status status);
}
