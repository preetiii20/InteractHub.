package com.interacthub.manager.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.manager.model.Task;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectGroupId(Long projectGroupId);
    List<Task> findByAssigneeId(Long assigneeId);
    List<Task> findByStatus(Task.Status status);
    List<Task> findByProjectGroupIdAndStatus(Long projectGroupId, Task.Status status);
    List<Task> findByAssigneeIdAndStatus(Long assigneeId, Task.Status status);
    long countByProjectGroupId(Long projectGroupId);
    long countByAssigneeId(Long assigneeId);
    long countByStatus(Task.Status status);
}
