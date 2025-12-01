package com.interacthub.chat.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.chat.model.Channel;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, Long> {
    // Required for Manager Service to check if channel exists
    Optional<Channel> findByChannelId(String channelId);
}