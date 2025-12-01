package com.interacthub.admin_service.repository;

import com.interacthub.admin_service.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByTargetAudienceOrderByCreatedAtDesc(Document.TargetAudience targetAudience);
}