package com.interacthub.admin_service.repository;

import com.interacthub.admin_service.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    Optional<Organization> findByAdminEmail(String adminEmail);
    Optional<Organization> findBySubdomain(String subdomain);
    boolean existsByAdminEmail(String adminEmail);
}
