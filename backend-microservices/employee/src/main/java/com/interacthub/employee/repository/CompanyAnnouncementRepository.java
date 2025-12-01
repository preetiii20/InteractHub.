package com.interacthub.employee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.employee.model.CompanyAnnouncement;

@Repository
public interface CompanyAnnouncementRepository extends JpaRepository<CompanyAnnouncement, Long> {
    List<CompanyAnnouncement> findAllByOrderByCreatedAtDesc();
}

