package com.interacthub.chat.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.interacthub.chat.model.Channel;
import com.interacthub.chat.repository.ChannelRepository;

@Service
public class ChannelService {
    
    @Autowired
    private ChannelRepository channelRepository;

    public Channel createChannel(String channelId, String name, Channel.ChannelType type, Long ownerId) {
        if (channelRepository.findByChannelId(channelId).isPresent()) {
            throw new RuntimeException("Channel ID " + channelId + " already exists.");
        }
        
        Channel channel = new Channel();
        channel.setChannelId(channelId);
        channel.setName(name);
        channel.setType(type);
        channel.setOwnerId(ownerId);
        
        return channelRepository.save(channel);
    }
    
    public Optional<Channel> getChannelById(String channelId) {
        return channelRepository.findByChannelId(channelId);
    }
}