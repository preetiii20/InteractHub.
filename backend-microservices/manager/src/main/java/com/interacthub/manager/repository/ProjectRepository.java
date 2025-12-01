package com.interacthub.manager.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.interacthub.manager.model.Project;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByManagerId(Long managerId);
    List<Project> findByManagerIdAndStatus(Long managerId, Project.Status status);
    Optional<Project> findByIdAndManagerId(Long id, Long managerId);
    long countByManagerId(Long managerId);
    long countByManagerIdAndStatus(Long managerId, Project.Status status);
}
