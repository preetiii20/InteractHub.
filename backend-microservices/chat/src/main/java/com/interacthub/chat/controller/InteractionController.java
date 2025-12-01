package com.interacthub.chat.controller;

import java.util.List;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.chat.model.AnnouncementInteraction;
import com.interacthub.chat.model.PollVote;
import com.interacthub.chat.service.InteractionService;

@RestController
@RequestMapping("/api/interactions")
@CrossOrigin
public class InteractionController {

    private final InteractionService svc;
    private final SimpMessagingTemplate broker;

    public InteractionController(InteractionService svc, SimpMessagingTemplate broker) {
        this.svc = svc;
        this.broker = broker;
    }

    @PostMapping("/announcement/like")
    public Map<String,Object> like(@RequestBody AnnouncementInteraction req) {
        AnnouncementInteraction result = svc.like(req);
        long count = svc.likeCount(req.getAnnouncementId());
        boolean liked = result != null; // If result is null, like was removed (toggled off)
        
        broker.convertAndSend("/topic/announcement."+req.getAnnouncementId()+".likes", count);
        broker.convertAndSend("/topic/announcements.reactions",
                Map.of("announcementId", req.getAnnouncementId(),
                       "type", "LIKE",
                       "userName", req.getUserName(),
                       "liked", liked));
        
        // Broadcast updated likes list for real-time updates
        List<Map<String,Object>> likedUsers = svc.getLikedUsers(req.getAnnouncementId());
        broker.convertAndSend("/topic/announcement."+req.getAnnouncementId()+".likes.users", likedUsers);
        
        return Map.of("likeCount", count, "liked", liked);
    }

    @PostMapping("/announcement/comment")
    public AnnouncementInteraction comment(@RequestBody AnnouncementInteraction req) {
        AnnouncementInteraction saved = svc.comment(req);
        broker.convertAndSend("/topic/announcement."+saved.getAnnouncementId()+".comments", saved);
        broker.convertAndSend("/topic/announcements.reactions",
                Map.of("announcementId", saved.getAnnouncementId(),
                       "type", "COMMENT",
                       "userName", saved.getUserName()));
        return saved;
    }

    @GetMapping("/announcement/{id}/likes/count")
    public Map<String,Long> likeCount(@PathVariable Long id) { return Map.of("count", svc.likeCount(id)); }
    
    @GetMapping("/announcement/{id}/likes/users")
    public List<Map<String,Object>> getLikedUsers(@PathVariable Long id) {
        return svc.getLikedUsers(id);
    }

    @GetMapping("/announcement/{id}/interactions")
    public List<AnnouncementInteraction> interactions(@PathVariable Long id) { return svc.getAnnInteractions(id); }

    @PostMapping("/poll/vote")
    public PollVote vote(@RequestBody PollVote vote) {
        PollVote saved = svc.vote(vote);
        broker.convertAndSend("/topic/polls.votes",
                Map.of("pollId", saved.getPollId(), "voterName", saved.getVoterName()));
        broker.convertAndSend("/topic/poll."+saved.getPollId()+".results", svc.results(saved.getPollId()));
        return saved;
    }

    @GetMapping("/poll/{id}/results")
    public Map<String,Object> results(@PathVariable Long id) { return svc.results(id); }

    @GetMapping("/poll/{id}/votes")
    public List<PollVote> votes(@PathVariable Long id) { return svc.votes(id); }

    @GetMapping("/recent/likes")
    public List<Map<String,Object>> getRecentLikes() {
        return svc.getRecentLikes();
    }

    @GetMapping("/recent/comments")
    public List<Map<String,Object>> getRecentComments() {
        return svc.getRecentComments();
    }
}
