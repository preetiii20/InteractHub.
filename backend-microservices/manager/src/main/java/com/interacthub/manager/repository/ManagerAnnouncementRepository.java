package com.interacthub.manager.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.manager.model.ManagerAnnouncement;

@Repository
public interface ManagerAnnouncementRepository extends JpaRepository<ManagerAnnouncement, Long> {
    List<ManagerAnnouncement> findTop5ByOrderByCreatedAtDesc();
}