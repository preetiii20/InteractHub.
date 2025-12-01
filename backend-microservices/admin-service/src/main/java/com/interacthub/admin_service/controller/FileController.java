package com.interacthub.admin_service.controller;

import com.interacthub.admin_service.model.Document;
import com.interacthub.admin_service.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {
    
    @Autowired
    private FileStorageService fileStorageService;
    
    @PostMapping("/upload")
    public ResponseEntity<Document> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("uploadedBy") Long uploadedBy,
            @RequestParam("targetAudience") Document.TargetAudience targetAudience,
            @RequestParam(value = "targetDepartmentId", required = false) Long targetDepartmentId) {
        
        Document document = fileStorageService.storeFile(file, uploadedBy, targetAudience, targetDepartmentId);
        return ResponseEntity.ok(document);
    }
    
    @GetMapping("/target/{targetAudience}")
    public List<Document> getFilesByTarget(@PathVariable Document.TargetAudience targetAudience) {
        return fileStorageService.getDocumentsByTarget(targetAudience);
    }
    
    @GetMapping("/download/{fileName}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable String fileName) {
        try {
            byte[] fileContent = fileStorageService.loadFileAsBytes(fileName);
            
            // Note: In a real app, use DocumentRepository to find file by name and get original name/mime type
            String mimeType = "application/octet-stream";
            String originalName = fileName;

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(mimeType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + originalName + "\"")
                    .body(fileContent);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }
}