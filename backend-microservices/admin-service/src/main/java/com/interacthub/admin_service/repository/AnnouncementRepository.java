package com.interacthub.admin_service.repository;

import com.interacthub.admin_service.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByTargetAudienceOrderByCreatedAtDesc(Announcement.TargetAudience targetAudience);
    List<Announcement> findByIsActiveTrueOrderByCreatedAtDesc();
    List<Announcement> findTop20ByIsActiveTrueOrderByCreatedAtDesc();
}
