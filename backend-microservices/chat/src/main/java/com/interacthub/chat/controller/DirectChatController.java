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
import com.interacthub.chat.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/direct")
@CrossOrigin(origins = "http://localhost:3000")
public class DirectChatController {

    private final DirectMessageRepository repo;
    private final SimpMessagingTemplate broker;
    private final FileStorageService fileStorageService;
    
    @Autowired
    private UserService userService;

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
        try {
            System.out.println("📨 Fetching DM history");
            System.out.println("   userA: " + userA);
            System.out.println("   userB: " + userB);
            
            // userA and userB are guaranteed to be emails from the frontend history request.
            String room = normalizeRoom(userA, userB);
            System.out.println("   Normalized room: " + room);
            
            List<DirectMessage> messages = repo.findByRoomIdOrderBySentAtAsc(room);
            System.out.println("✅ Found " + messages.size() + " DM messages in room: " + room);
            
            return messages;
        } catch (Exception e) {
            System.err.println("❌ Error fetching DM history for userA: " + userA + ", userB: " + userB);
            e.printStackTrace();
            return new java.util.ArrayList<>();
        }
    }
    
    @GetMapping("/all")
    public ResponseEntity<java.util.List<DirectMessage>> getAllDMs() {
        try {
            System.out.println("📨 Fetching ALL DMs from database");
            java.util.List<DirectMessage> allMessages = repo.findAll();
            System.out.println("✅ Found " + allMessages.size() + " total DM messages");
            return ResponseEntity.ok(allMessages);
        } catch (Exception e) {
            System.err.println("❌ Error fetching all DMs");
            e.printStackTrace();
            return ResponseEntity.status(500).body(new java.util.ArrayList<>());
        }
    }
    
    @PostMapping("/test-create")
    public ResponseEntity<?> createTestDM() {
        try {
            System.out.println("🧪 Creating test DM");
            DirectMessage msg = new DirectMessage();
            msg.setRoomId("admin@example.com|user@example.com");
            msg.setSenderName("admin@example.com");
            msg.setRecipientName("user@example.com");
            msg.setContent("This is a test DM message");
            
            DirectMessage saved = repo.save(msg);
            System.out.println("✅ Test DM created with ID: " + saved.getId());
            
            return ResponseEntity.ok(Map.of(
                "message", "Test DM created successfully",
                "id", saved.getId(),
                "roomId", saved.getRoomId()
            ));
        } catch (Exception e) {
            System.err.println("❌ Error creating test DM");
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/populate-sample")
    public ResponseEntity<?> populateSampleDMs() {
        try {
            System.out.println("🧪 Populating sample DMs");
            
            // Get all users from database (assuming they exist)
            java.util.List<DirectMessage> existingDMs = repo.findAll();
            if (!existingDMs.isEmpty()) {
                return ResponseEntity.ok(Map.of("message", "Sample DMs already exist", "count", existingDMs.size()));
            }
            
            // Create sample DMs between any available users
            // For now, create DMs with common patterns
            String[][] userPairs = {
                {"admin", "manager"},
                {"admin", "hr"},
                {"admin", "employee"},
                {"manager", "hr"},
                {"manager", "employee"},
                {"hr", "employee"}
            };
            
            int count = 0;
            for (String[] pair : userPairs) {
                String userA = pair[0];
                String userB = pair[1];
                String room = normalizeRoom(userA, userB);
                
                // Create 3 sample messages for each pair
                for (int i = 1; i <= 3; i++) {
                    DirectMessage msg = new DirectMessage();
                    msg.setRoomId(room);
                    msg.setSenderName(i % 2 == 0 ? userA : userB);
                    msg.setRecipientName(i % 2 == 0 ? userB : userA);
                    msg.setContent("Sample message " + i + " between " + userA + " and " + userB);
                    repo.save(msg);
                    count++;
                    System.out.println("   ✅ Created DM: " + room);
                }
            }
            
            System.out.println("✅ Created " + count + " sample DM messages");
            return ResponseEntity.ok(Map.of(
                "message", "Sample DMs populated successfully",
                "count", count
            ));
        } catch (Exception e) {
            System.err.println("❌ Error populating sample DMs");
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
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
        try {
            System.out.println("📨 Received DM message");
            System.out.println("   Sender: " + msg.getSenderName());
            System.out.println("   Recipient: " + msg.getRecipientName());
            System.out.println("   Content: " + (msg.getContent() != null ? msg.getContent().substring(0, Math.min(50, msg.getContent().length())) : "null"));
            
            // msg.getSenderName() holds the SENDER'S EMAIL (routing ID)
            // msg.getRecipientName() holds the RECIPIENT'S EMAIL (routing ID)

            String senderEmail = msg.getSenderName(); 
            String recipientEmail = msg.getRecipientName(); 

            if (senderEmail == null || senderEmail.isBlank() || recipientEmail == null || recipientEmail.isBlank()) {
                System.err.println("❌ DM failed due to missing sender or recipient email in payload.");
                return;
            }

            // 1. Room ID calculation: Use the two unique emails for canonical room ID.
            String room = normalizeRoom(senderEmail, recipientEmail);
            msg.setRoomId(room);
            System.out.println("   Room: " + room);
            
            // Ensure data saved is consistent (store lowercase email as sender ID)
            msg.setSenderName(senderEmail.toLowerCase());
            
            DirectMessage saved = repo.save(msg);
            System.out.println("✅ DM saved with ID: " + saved.getId());

            // 2. Room broadcast (message delivery to the shared queue/topic)
            // This delivers the message to the ChatWindow's subscription.
            broker.convertAndSend("/queue/dm." + saved.getRoomId(), saved);
            System.out.println("📢 Broadcasted to /queue/dm." + saved.getRoomId());

            // 3. Personal notify (notification): Target the recipient's unique email.
            String recipientId = saved.getRecipientName().toLowerCase();
            
            // Fetch sender's full name from admin service
            String senderFirstName = null;
            String senderLastName = null;
            if (userService != null) {
                Map<String, Object> senderUser = userService.getUserByEmail(senderEmail);
                if (senderUser != null) {
                    senderFirstName = (String) senderUser.get("firstName");
                    senderLastName = (String) senderUser.get("lastName");
                    System.out.println("   Sender full name: " + senderFirstName + " " + senderLastName);
                }
            }
            
            Map<String, Object> notification = Map.of(
                "type","dm",
                "from", saved.getSenderName(), // Sender's Email/ID
                "fromEmail", saved.getSenderName(),
                "firstName", senderFirstName != null ? senderFirstName : "",
                "lastName", senderLastName != null ? senderLastName : "",
                "roomId", saved.getRoomId(),
                "preview", saved.getContent(), 
                "sentAt", String.valueOf(saved.getSentAt())
            );
            System.out.println("📢 Sending DM notification to: /user/" + recipientId + "/queue/notify");
            
            // Try user-specific destination (requires authentication)
            broker.convertAndSend("/user/" + recipientId + "/queue/notify", notification);
            
            // Fallback: Also send to topic-based destination (doesn't require authentication)
            // This allows clients to subscribe without authentication
            String topicDest = "/topic/user-notifications." + recipientId;
            System.out.println("📢 Also sending to topic: " + topicDest);
            broker.convertAndSend(topicDest, notification);
        } catch (Exception e) {
            System.err.println("❌ Error sending DM: " + e.getMessage());
            e.printStackTrace();
        }
    }
}