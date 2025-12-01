package com.interacthub.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.chat.model.AnnouncementInteraction;
import com.interacthub.chat.model.AnnouncementInteraction.InteractionType;

@Repository
public interface AnnouncementInteractionRepository extends JpaRepository<AnnouncementInteraction, Long> {
    List<AnnouncementInteraction> findByAnnouncementId(Long announcementId);
    long countByAnnouncementIdAndType(Long announcementId, InteractionType type);
    List<AnnouncementInteraction> findByAnnouncementIdAndUserNameAndType(Long announcementId, String userName, InteractionType type);
    List<AnnouncementInteraction> findByAnnouncementIdAndType(Long announcementId, InteractionType type);
    List<AnnouncementInteraction> findTop10ByTypeOrderByCreatedAtDesc(InteractionType type);
}

