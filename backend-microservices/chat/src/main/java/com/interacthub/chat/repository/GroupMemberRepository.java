package com.interacthub.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.chat.model.GroupMember;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByGroupId(String groupId);
    List<GroupMember> findByMemberName(String memberName);
    void deleteByGroupIdAndMemberName(String groupId, String memberName);
}
