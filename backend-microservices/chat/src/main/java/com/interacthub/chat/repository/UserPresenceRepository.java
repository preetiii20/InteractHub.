package com.interacthub.chat.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.interacthub.chat.model.UserPresence;

@Repository
public interface UserPresenceRepository extends JpaRepository<UserPresence, String> {
    
    List<UserPresence> findByStatus(String status);
    
    @Query("SELECT u FROM UserPresence u WHERE u.lastHeartbeat < ?1 AND u.status = 'ONLINE'")
    List<UserPresence> findStaleOnlineUsers(Instant threshold);
}
