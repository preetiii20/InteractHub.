package com.interacthub.manager.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.manager.model.ManagerPoll;

@Repository
public interface ManagerPollRepository extends JpaRepository<ManagerPoll, Long> {
    List<ManagerPoll> findTop5ByOrderByCreatedAtDesc();
}