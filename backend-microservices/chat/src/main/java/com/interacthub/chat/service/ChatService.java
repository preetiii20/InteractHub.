package com.interacthub.chat.service;

import com.interacthub.chat.model.ChatMessage;
import com.interacthub.chat.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatService {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    public ChatMessage saveMessage(ChatMessage message) {
        return chatMessageRepository.save(message);
    }

    public List<ChatMessage> getChannelMessages(String channelId) {
        return chatMessageRepository.findByChannelIdOrderByTimestampAsc(channelId);
    }

    public List<ChatMessage> getRecentChannelMessages(String channelId, int limit) {
        List<ChatMessage> messages = chatMessageRepository.findByChannelIdOrderByTimestampAsc(channelId);
        if (messages.size() > limit) {
            return messages.subList(messages.size() - limit, messages.size());
        }
        return messages;
    }

    public List<ChatMessage> searchMessages(String channelId, String searchTerm) {
        return chatMessageRepository.searchMessagesInChannel(channelId, searchTerm);
    }

    public long getMessageCount(String channelId) {
        return chatMessageRepository.countByChannelId(channelId);
    }
}






