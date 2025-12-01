package com.interacthub.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.interacthub.chat.model.PollVote;

@Repository
public interface PollVoteRepository extends JpaRepository<PollVote, Long> {
    List<PollVote> findByPollId(Long pollId);
    long countByPollId(Long pollId);
    List<PollVote> findByPollIdAndVoterName(Long pollId, String voterName);

    @Query("SELECT pv.selectedOption, COUNT(pv) FROM PollVote pv WHERE pv.pollId = :pollId GROUP BY pv.selectedOption")
    List<Object[]> getVoteCountsByOption(Long pollId);
}

