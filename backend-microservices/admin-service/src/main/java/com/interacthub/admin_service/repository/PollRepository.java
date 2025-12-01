package com.interacthub.admin_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.admin_service.model.Poll;

@Repository
public interface PollRepository extends JpaRepository<Poll, Long> {
    List<Poll> findByTargetAudienceAndIsActiveTrueOrderByCreatedAtDesc(Poll.TargetAudience targetAudience);
    List<Poll> findByTargetAudienceInAndIsActiveTrueOrderByCreatedAtDesc(List<Poll.TargetAudience> audiences);
}
