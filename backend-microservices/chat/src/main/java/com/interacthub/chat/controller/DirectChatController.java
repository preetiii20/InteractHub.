package com.interacthub.chat.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.interacthub.chat.model.DirectMessage;
import com.interacthub.chat.repository.DirectMessageRepository;
import com.interacthub.chat.service.FileStorageService;

@RestController
@RequestMapping("/api/direct")
@CrossOrigin(origins = "http://localhost:3000")
public class DirectChatController {

    private final DirectMessageRepository repo;
    private final SimpMessagingTemplate broker;
    private final FileStorageService fileStorageService;

    public DirectChatController(DirectMessageRepository repo, SimpMessagingTemplate broker, FileStorageService fileStorageService) {
        this.repo = repo; 
        this.broker = broker;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Normalizes two unique identifiers (emails) to create a consistent, canonical room ID.
     */
    private String normalizeRoom(String a, String b) {
        // A and B MUST be unique identifiers (emails) for consistent room sorting.
        String A = (a == null ? "" : a.trim().toLowerCase());
        String B = (b == null ? "" : b.trim().toLowerCase());
        return (A.compareTo(B) <= 0) ? (A + "|" + B) : (B + "|" + A);
    }

    @GetMapping("/history")
    public List<DirectMessage> history(@RequestParam String userA, @RequestParam String userB) {
        // userA and userB are guaranteed to be emails from the frontend history request.
        String room = normalizeRoom(userA, userB);
        return repo.findByRoomIdOrderBySentAtAsc(room);
    }
    
    // File upload endpoint for DMs
    @PostMapping("/upload-file")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("senderName") String senderName,
            @RequestParam("recipientName") String recipientName,
            @RequestParam(value = "content", required = false, defaultValue = "") String content) {
        
        System.out.println("📤 DM File upload received");
        System.out.println("   - senderName: " + senderName);
        System.out.println("   - recipientName: " + recipientName);
        System.out.println("   - fileName: " + (file != null ? file.getOriginalFilename() : "null"));
        
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty or not provided"));
            }
            
            FileStorageService.FileUploadResult uploadResult = fileStorageService.storeFile(file);
            
            // Create and save DM with file
            DirectMessage msg = new DirectMessage();
            String room = normalizeRoom(senderName, recipientName);
            msg.setRoomId(room);
            msg.setSenderName(senderName.toLowerCase());
            msg.setRecipientName(recipientName.toLowerCase());
            msg.setContent(content.isEmpty() ? "📎 " + uploadResult.getOriginalFileName() : content);
            msg.setFileUrl(uploadResult.getFileUrl());
            msg.setFileName(uploadResult.getOriginalFileName());
            msg.setFileType(uploadResult.getFileType());
            msg.setFileSize(uploadResult.getFileSize());
            
            DirectMessage saved = repo.save(msg);
            
            // Broadcast to room
            broker.convertAndSend("/queue/dm." + saved.getRoomId(), saved);
            
            // Notify recipient
            broker.convertAndSend("/user/" + recipientName.toLowerCase() + "/queue/notify",
                Map.of("type", "dm",
                       "from", saved.getSenderName(),
                       "roomId", saved.getRoomId(),
                       "preview", "📎 " + uploadResult.getOriginalFileName(),
                       "sentAt", String.valueOf(saved.getSentAt())));
            
            System.out.println("✅ DM File uploaded successfully - messageId: " + saved.getId());
            
            return ResponseEntity.ok(Map.of(
                "messageId", saved.getId(),
                "fileUrl", uploadResult.getFileUrl(),
                "fileName", uploadResult.getOriginalFileName(),
                "message", "File uploaded successfully"
            ));
        } catch (Exception e) {
            System.err.println("❌ Error uploading DM file: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // Delete DM message (soft delete)
    @PostMapping("/message/{messageId}/delete")
    public ResponseEntity<?> deleteMessage(
            @PathVariable Long messageId,
            @RequestBody Map<String, String> payload) {
        
        String userId = payload.get("userId");
        
        return repo.findById(messageId)
            .map(msg -> {
                // Check if user is sender
                if (!msg.getSenderName().equalsIgnoreCase(userId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Not authorized to delete this message"));
                }
                
                // Soft delete
                msg.setDeleted(true);
                msg.setDeletedAt(java.time.Instant.now());
                msg.setDeletedBy(userId);
                repo.save(msg);
                
                // Broadcast deletion
                broker.convertAndSend("/queue/dm." + msg.getRoomId(), Map.of(
                    "type", "MESSAGE_DELETED",
                    "messageId", messageId,
                    "deletedBy", userId
                ));
                
                return ResponseEntity.ok(Map.of("message", "Message deleted successfully"));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @MessageMapping("/dm.send")
    public void send(DirectMessage msg) {
        // msg.getSenderName() holds the SENDER'S EMAIL (routing ID)
        // msg.getRecipientName() holds the RECIPIENT'S EMAIL (routing ID)

        String senderEmail = msg.getSenderName(); 
        String recipientEmail = msg.getRecipientName(); 

        if (senderEmail == null || senderEmail.isBlank() || recipientEmail == null || recipientEmail.isBlank()) {
            System.err.println("ERROR: DM failed due to missing sender or recipient email in payload.");
            return;
        }

        // 1. Room ID calculation: Use the two unique emails for canonical room ID.
        String room = normalizeRoom(senderEmail, recipientEmail);
        msg.setRoomId(room);
        
        // Ensure data saved is consistent (store lowercase email as sender ID)
        msg.setSenderName(senderEmail.toLowerCase());
        
        DirectMessage saved = repo.save(msg);

        // 2. Room broadcast (message delivery to the shared queue/topic)
        // This delivers the message to the ChatWindow's subscription.
        broker.convertAndSend("/queue/dm." + saved.getRoomId(), saved);

        // 3. Personal notify (notification): Target the recipient's unique email.
        String recipientId = saved.getRecipientName().toLowerCase(); 
        broker.convertAndSend("/user/" + recipientId + "/queue/notify",
            Map.of("type","dm",
                   "from", saved.getSenderName(), // Sender's Email/ID
                   "roomId", saved.getRoomId(),
                   "preview", saved.getContent(), 
                   "sentAt", String.valueOf(saved.getSentAt())));
    }
}