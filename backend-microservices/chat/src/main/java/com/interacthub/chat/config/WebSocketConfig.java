package com.interacthub.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enables simple in-memory broker destinations for public/shared channels
        registry.enableSimpleBroker("/topic", "/queue"); 
        
        // Prefix for client-to-server messages
        registry.setApplicationDestinationPrefixes("/app");
        
        // CRITICAL FIX: Designates prefix for user-specific queues (e.g., /user/email@domain/queue/notify)
        registry.setUserDestinationPrefix("/user"); 
    }
}