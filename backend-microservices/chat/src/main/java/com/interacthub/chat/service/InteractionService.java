package com.interacthub.chat.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.interacthub.chat.model.AnnouncementInteraction;
import com.interacthub.chat.model.Interaction;
import com.interacthub.chat.model.PollVote;
import com.interacthub.chat.repository.AnnouncementInteractionRepository;
import com.interacthub.chat.repository.InteractionRepository;
import com.interacthub.chat.repository.PollVoteRepository;

@Service
public class InteractionService {

    @org.springframework.beans.factory.annotation.Autowired
    private PollVoteRepository pollRepo;

    @org.springframework.beans.factory.annotation.Autowired
    private AnnouncementInteractionRepository annRepo;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private InteractionRepository interactionRepository;

    // Default constructor left for Spring's instantiation; field injection will populate repositories.
    public InteractionService() {
    }

    // Generic save used by REST controllers for comments/reactions
    public Interaction saveGeneralInteraction(Interaction interaction) {
        if (interaction == null) throw new IllegalArgumentException("Interaction cannot be null");
        if (interaction.getSenderId() == null || interaction.getEntityId() == null || interaction.getEntityType() == null) {
            throw new IllegalArgumentException("Interaction must have senderId, entityId and entityType");
        }
        return interactionRepository.save(interaction);
    }

    public AnnouncementInteraction like(AnnouncementInteraction req) {
        // Toggle like functionality - if user already liked, remove the like
        req.setType(AnnouncementInteraction.InteractionType.LIKE);
        
        // Check if user already liked this announcement
        List<AnnouncementInteraction> existingLikes = annRepo.findByAnnouncementIdAndUserNameAndType(
            req.getAnnouncementId(), 
            req.getUserName(), 
            AnnouncementInteraction.InteractionType.LIKE
        );
        
        if (!existingLikes.isEmpty()) {
            // User already liked - remove the like (toggle off)
            annRepo.deleteAll(existingLikes);
            return null; // Return null to indicate like was removed
        } else {
            // User hasn't liked yet - add the like (toggle on)
            return annRepo.save(req);
        }
    }

    public AnnouncementInteraction comment(AnnouncementInteraction req) {
        req.setType(AnnouncementInteraction.InteractionType.COMMENT);
        return annRepo.save(req);
    }

    public long likeCount(Long annId) {
        return annRepo.countByAnnouncementIdAndType(annId, AnnouncementInteraction.InteractionType.LIKE);
    }

    public List<AnnouncementInteraction> getAnnInteractions(Long annId) {
        return annRepo.findByAnnouncementId(annId);
    }

    public PollVote vote(PollVote v) { 
        // Check if user already voted on this poll
        List<PollVote> existingVotes = pollRepo.findByPollIdAndVoterName(v.getPollId(), v.getVoterName());
        
        if (!existingVotes.isEmpty()) {
            // User already voted - update their vote to the new option
            PollVote existingVote = existingVotes.get(0);
            existingVote.setSelectedOption(v.getSelectedOption());
            existingVote.setVotedAt(v.getVotedAt());
            return pollRepo.save(existingVote);
        } else {
            // User hasn't voted yet - create new vote
            return pollRepo.save(v);
        }
    }

    public List<PollVote> votes(Long pollId) { return pollRepo.findByPollId(pollId); }

    public Map<String,Object> results(Long pollId) {
        List<Object[]> rows = pollRepo.getVoteCountsByOption(pollId);
        long total = pollRepo.countByPollId(pollId);
        Map<String,Long> map = new HashMap<>();
        for (Object[] r : rows) map.put((String)r[0], (Long)r[1]);
        return Map.of("totalVotes", total, "optionCounts", map);
    }
    
    public List<Map<String,Object>> getLikedUsers(Long announcementId) {
        List<AnnouncementInteraction> likes = annRepo.findByAnnouncementIdAndType(announcementId, AnnouncementInteraction.InteractionType.LIKE);
        return likes.stream()
                .map(like -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("userName", like.getUserName());
                    userMap.put("likedAt", like.getCreatedAt());
                    return userMap;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Map<String,Object>> getRecentLikes() {
        List<AnnouncementInteraction> recentLikes = annRepo.findTop10ByTypeOrderByCreatedAtDesc(AnnouncementInteraction.InteractionType.LIKE);
        return recentLikes.stream()
                .map(like -> {
                    Map<String, Object> likeMap = new HashMap<>();
                    likeMap.put("announcementId", like.getAnnouncementId());
                    likeMap.put("userName", like.getUserName());
                    likeMap.put("createdAt", like.getCreatedAt());
                    return likeMap;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Map<String,Object>> getRecentComments() {
        List<AnnouncementInteraction> recentComments = annRepo.findTop10ByTypeOrderByCreatedAtDesc(AnnouncementInteraction.InteractionType.COMMENT);
        return recentComments.stream()
                .map(comment -> {
                    Map<String, Object> commentMap = new HashMap<>();
                    commentMap.put("announcementId", comment.getAnnouncementId());
                    commentMap.put("userName", comment.getUserName());
                    commentMap.put("content", comment.getContent());
                    commentMap.put("createdAt", comment.getCreatedAt());
                    return commentMap;
                })
                .collect(java.util.stream.Collectors.toList());
    }
}

