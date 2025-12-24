package com.interacthub.admin_service.service;

import com.interacthub.admin_service.model.Meeting;
import com.interacthub.admin_service.repository.MeetingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MeetingService {
    
    @Autowired
    private MeetingRepository meetingRepository;
    
    public Meeting createMeeting(Meeting meeting) {
        return meetingRepository.save(meeting);
    }
    
    public Optional<Meeting> getMeetingById(Long id) {
        return meetingRepository.findById(id);
    }
    
    public List<Meeting> getMeetingsForUser(Long userId) {
        // Get all meetings
        List<Meeting> allMeetings = meetingRepository.findAll();
        
        // Filter meetings where user is organizer or participant
        return allMeetings.stream()
            .filter(meeting -> 
                meeting.getOrganizerId().equals(userId) ||
                (meeting.getParticipantIds() != null && meeting.getParticipantIds().contains(userId))
            )
            .collect(Collectors.toList());
    }
    
    public List<Meeting> getMeetingsOrganizedBy(Long organizerId) {
        return meetingRepository.findByOrganizerId(organizerId);
    }
    
    public Meeting updateMeeting(Long id, Meeting meetingDetails) {
        Optional<Meeting> meeting = meetingRepository.findById(id);
        if (meeting.isPresent()) {
            Meeting m = meeting.get();
            if (meetingDetails.getTitle() != null) m.setTitle(meetingDetails.getTitle());
            if (meetingDetails.getDescription() != null) m.setDescription(meetingDetails.getDescription());
            if (meetingDetails.getMeetingDate() != null) m.setMeetingDate(meetingDetails.getMeetingDate());
            if (meetingDetails.getMeetingTime() != null) m.setMeetingTime(meetingDetails.getMeetingTime());
            if (meetingDetails.getMeetingEndTime() != null) m.setMeetingEndTime(meetingDetails.getMeetingEndTime());
            if (meetingDetails.getParticipantIds() != null) m.setParticipantIds(meetingDetails.getParticipantIds());
            return meetingRepository.save(m);
        }
        throw new RuntimeException("Meeting not found with id: " + id);
    }
    
    public void deleteMeeting(Long id) {
        meetingRepository.deleteById(id);
    }
    
    public List<Meeting> getAllMeetings() {
        return meetingRepository.findAll();
    }
}
