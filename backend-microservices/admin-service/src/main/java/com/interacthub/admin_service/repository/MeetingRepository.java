package com.interacthub.admin_service.repository;

import com.interacthub.admin_service.model.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {
    
    // Find meetings organized by a user
    List<Meeting> findByOrganizerId(Long organizerId);
    
    // Organization-scoped queries
    List<Meeting> findByOrganizationId(Long organizationId);
    List<Meeting> findByOrganizationIdAndOrganizerId(Long organizationId, Long organizerId);
}
