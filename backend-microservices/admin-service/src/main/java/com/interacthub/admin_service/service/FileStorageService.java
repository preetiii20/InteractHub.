package com.interacthub.admin_service.service;

import com.interacthub.admin_service.model.Document;
import com.interacthub.admin_service.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {
    
    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();
    
    @Autowired
    private DocumentRepository documentRepository;
    
    public FileStorageService() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create upload directory", ex);
        }
    }
    
    public Document storeFile(MultipartFile file, Long uploadedBy, 
                              Document.TargetAudience targetAudience, Long targetDepartmentId) {
        try {
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            
            String fileName = UUID.randomUUID().toString() + fileExtension;
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation);
            
            Document document = new Document();
            document.setName(fileName);
            document.setOriginalName(originalFileName);
            document.setFilePath(targetLocation.toString());
            document.setFileSize(file.getSize());
            document.setMimeType(file.getContentType());
            document.setUploadedBy(uploadedBy);
            document.setTargetAudience(targetAudience);
            document.setTargetDepartmentId(targetDepartmentId);
            document.setIsPublic(false);
            
            return documentRepository.save(document);
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + file.getOriginalFilename(), ex);
        }
    }
    
    public List<Document> getDocumentsByTarget(Document.TargetAudience targetAudience) {
        return documentRepository.findByTargetAudienceOrderByCreatedAtDesc(targetAudience);
    }
    
    public byte[] loadFileAsBytes(String fileName) throws IOException {
        Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
        return Files.readAllBytes(filePath);
    }
}