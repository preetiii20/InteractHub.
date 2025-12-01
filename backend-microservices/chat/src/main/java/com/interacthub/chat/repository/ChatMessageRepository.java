package com.interacthub.chat.repository;

import com.interacthub.chat.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    // Get messages for a specific channel
    List<ChatMessage> findByChannelIdOrderByTimestampAsc(String channelId);
    
    // Get recent messages for a channel
    List<ChatMessage> findByChannelIdAndTimestampAfterOrderByTimestampAsc(String channelId, LocalDateTime timestamp);
    
    // Get messages by type
    List<ChatMessage> findByChannelIdAndTypeOrderByTimestampAsc(String channelId, ChatMessage.MessageType type);
    
    // Get message count for a channel
    long countByChannelId(String channelId);
    
    // Search messages by content
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.channelId = :channelId AND cm.content LIKE %:searchTerm% ORDER BY cm.timestamp DESC")
    List<ChatMessage> searchMessagesInChannel(@Param("channelId") String channelId, @Param("searchTerm") String searchTerm);
}






