package com.interacthub.admin_service.repository;

import com.interacthub.admin_service.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    List<AuditLog> findTop100ByOrderByTimestampDesc();
    
    // Organization-scoped queries
    Page<AuditLog> findByOrganizationIdOrderByTimestampDesc(Long organizationId, Pageable pageable);
    List<AuditLog> findByOrganizationIdOrderByTimestampDesc(Long organizationId);
    List<AuditLog> findTop100ByOrganizationIdOrderByTimestampDesc(Long organizationId);
}
