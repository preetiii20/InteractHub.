package com.interacthub.chat.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.chat.model.ChatGroup;

@Repository
public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {
    Optional<ChatGroup> findByGroupId(String groupId);
    boolean existsByGroupId(String groupId);
    
    // Organization-scoped queries
    List<ChatGroup> findByOrganizationId(Long organizationId);
    Optional<ChatGroup> findByGroupIdAndOrganizationId(String groupId, Long organizationId);
    boolean existsByGroupIdAndOrganizationId(String groupId, Long organizationId);
}
