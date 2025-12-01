package com.interacthub.chat.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.chat.model.SignalMessage;

@RestController
@RequestMapping("/api/signal")
@CrossOrigin(origins = "http://localhost:3000")
public class SignalController {

    private final SimpMessagingTemplate broker;

    public SignalController(SimpMessagingTemplate broker) { this.broker = broker; }

    @MessageMapping("/signal.offer")
    public void offer(SignalMessage m) { relay("offer", m); }

    @MessageMapping("/signal.answer")
    public void answer(SignalMessage m) { relay("answer", m); }

    @MessageMapping("/signal.candidate")
    public void candidate(SignalMessage m) { relay("candidate", m); }

    @MessageMapping("/signal.hangup")
    public void hangup(SignalMessage m) { relay("hangup", m); }

    private void relay(String event, SignalMessage m) {
        if (m.getRoomId() == null || m.getRoomId().isBlank()) return;
        m.setType(event);
        broker.convertAndSend("/queue/signal."+m.getRoomId(), m);
        // For 1:1 convenience, also notify specific user:
        if (m.getToName() != null && !m.getToName().isBlank()) {
            broker.convertAndSend("/user/"+m.getToName()+"/queue/notify", m);
        }
    }
}
