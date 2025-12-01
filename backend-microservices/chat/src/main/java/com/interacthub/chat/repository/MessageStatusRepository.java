package com.interacthub.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.chat.model.MessageStatus;

@Repository
public interface MessageStatusRepository extends JpaRepository<MessageStatus, Long> {
    
    List<MessageStatus> findByMessageIdAndMessageType(Long messageId, String messageType);
    
    List<MessageStatus> findByMessageIdAndMessageTypeAndStatus(Long messageId, String messageType, String status);
}
