// package com.interacthub.chat.controller;

// import java.io.IOException;
// import java.util.ArrayList;
// import java.util.List;
// import java.util.Map;
// import java.util.UUID;

// import org.springframework.core.io.ByteArrayResource;
// import org.springframework.core.io.Resource;
// import org.springframework.http.HttpHeaders;
// import org.springframework.http.MediaType;
// import org.springframework.http.ResponseEntity;
// import org.springframework.messaging.handler.annotation.MessageMapping;
// import org.springframework.messaging.simp.SimpMessagingTemplate;
// import org.springframework.web.bind.annotation.CrossOrigin;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.PathVariable;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.RequestBody;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RequestParam;
// import org.springframework.web.bind.annotation.RestController;
// import org.springframework.web.multipart.MultipartFile;

// import com.interacthub.chat.model.ChatGroup;
// import com.interacthub.chat.model.GroupMember;
// import com.interacthub.chat.model.GroupMessage;
// import com.interacthub.chat.repository.ChatGroupRepository;
// import com.interacthub.chat.repository.GroupMemberRepository;
// import com.interacthub.chat.repository.GroupMessageRepository;
// import com.interacthub.chat.service.FileStorageService;

// @RestController
// @RequestMapping("/api/group")
// @CrossOrigin(origins = "http://localhost:3000")
// public class GroupChatController {

//     private final ChatGroupRepository groupRepo;
//     private final GroupMemberRepository memberRepo;
//     private final GroupMessageRepository msgRepo;
//     private final SimpMessagingTemplate broker;
//     private final FileStorageService fileStorageService;

//     public GroupChatController(ChatGroupRepository groupRepo, GroupMemberRepository memberRepo, 
//                                GroupMessageRepository msgRepo, SimpMessagingTemplate broker,
//                                FileStorageService fileStorageService) {
//         this.groupRepo = groupRepo; 
//         this.memberRepo = memberRepo; 
//         this.msgRepo = msgRepo; 
//         this.broker = broker;
//         this.fileStorageService = fileStorageService;
//     }

//     @PostMapping("/create")
//     public Map<String,Object> createGroup(@RequestBody Map<String,Object> req) {
//         String name = String.valueOf(req.getOrDefault("name","Group"));
//         String createdByName = String.valueOf(req.getOrDefault("createdByName","User"));
//         @SuppressWarnings("unchecked")
//         List<String> members = (List<String>) req.getOrDefault("members", new ArrayList<>());

//         ChatGroup g = new ChatGroup();
//         g.setGroupId(UUID.randomUUID().toString());
//         g.setName(name);
//         g.setCreatedByName(createdByName);
//         ChatGroup saved = groupRepo.save(g);

//         // Add members and notify them
//         for (String m : members) {
//             if (m == null || m.trim().isEmpty()) continue;
//             GroupMember gm = new GroupMember();
//             gm.setGroupId(saved.getGroupId());
//             gm.setMemberName(m.trim());
//             memberRepo.save(gm);
            
//             // Notify each member about the new group via user-specific queue
//             String memberEmail = m.trim();
//             System.out.println("📢 Notifying member: " + memberEmail + " about new group: " + saved.getName());
            
//             // Send to user-specific queue (exact email match)
//             broker.convertAndSend("/user/" + memberEmail + "/queue/notify", 
//                 Map.of(
//                     "type", "NEW_GROUP",
//                     "groupId", saved.getGroupId(),
//                     "groupName", saved.getName(),
//                     "createdBy", createdByName,
//                     "members", members,
//                     "message", createdByName + " added you to " + saved.getName()
//                 ));
            
//             // Also send to public topic as fallback
//             broker.convertAndSend("/topic/notify." + memberEmail, 
//                 Map.of(
//                     "type", "NEW_GROUP",
//                     "groupId", saved.getGroupId(),
//                     "groupName", saved.getName(),
//                     "createdBy", createdByName,
//                     "members", members,
//                     "message", createdByName + " added you to " + saved.getName()
//                 ));
//         }
        
//         // Send system message to group
//         GroupMessage systemMsg = new GroupMessage();
//         systemMsg.setGroupId(saved.getGroupId());
//         systemMsg.setSenderName("System");
//         systemMsg.setContent(createdByName + " created the group");
//         systemMsg.setMessageType("SYSTEM");
//         GroupMessage savedMsg = msgRepo.save(systemMsg);
        
//         // Broadcast system message to group
//         broker.convertAndSend("/topic/group." + saved.getGroupId(), savedMsg);
        
//         return Map.of("groupId", saved.getGroupId(), "name", saved.getName());
//     }

//     // Health check for upload endpoint
//     @GetMapping("/upload-file/test")
//     public ResponseEntity<Map<String, String>> testUploadEndpoint() {
//         return ResponseEntity.ok(Map.of("status", "ok", "message", "Upload endpoint is accessible"));
//     }

//     // File upload endpoint (MUST be before path variable routes to avoid conflicts)
//     @PostMapping("/upload-file")
//     public ResponseEntity<Map<String, Object>> uploadFile(
//             @RequestParam("file") MultipartFile file,
//             @RequestParam("groupId") String groupId,
//             @RequestParam("senderName") String senderName,
//             @RequestParam(value = "content", required = false, defaultValue = "") String content) {
//         System.out.println("📤 File upload received");
//         System.out.println("   - groupId: " + groupId);
//         System.out.println("   - senderName: " + senderName);
//         System.out.println("   - fileName: " + (file != null ? file.getOriginalFilename() : "null"));
//         System.out.println("   - fileSize: " + (file != null ? file.getSize() : 0));
//         System.out.println("   - content: " + content);
        
//         try {
//             if (file == null || file.isEmpty()) {
//                 System.err.println("❌ File is null or empty");
//                 return ResponseEntity.badRequest().body(Map.of("error", "File is empty or not provided"));
//             }
            
//             if (groupId == null || groupId.isBlank()) {
//                 System.err.println("❌ groupId is null or blank");
//                 return ResponseEntity.badRequest().body(Map.of("error", "groupId is required"));
//             }
//             FileStorageService.FileUploadResult uploadResult = fileStorageService.storeFile(file);
            
//             // Create and save message with file
//             GroupMessage msg = new GroupMessage();
//             msg.setGroupId(groupId);
//             msg.setSenderName(senderName);
//             msg.setContent(content.isEmpty() ? "📎 " + uploadResult.getOriginalFileName() : content);
//             msg.setFileUrl(uploadResult.getFileUrl());
//             msg.setFileName(uploadResult.getOriginalFileName());
//             msg.setFileType(uploadResult.getFileType());
//             msg.setFileSize(uploadResult.getFileSize());
            
//             GroupMessage saved = msgRepo.save(msg);
//             broker.convertAndSend("/topic/group."+saved.getGroupId(), saved);
            
//             System.out.println("✅ File uploaded successfully - messageId: " + saved.getId() + ", fileUrl: " + uploadResult.getFileUrl());
            
//             return ResponseEntity.ok(Map.of(
//                 "messageId", saved.getId(),
//                 "fileUrl", uploadResult.getFileUrl(),
//                 "fileName", uploadResult.getOriginalFileName(),
//                 "message", "File uploaded successfully"
//             ));
//         } catch (Exception e) {
//             System.err.println("❌ Error uploading file: " + e.getMessage());
//             e.printStackTrace();
//             return ResponseEntity.status(500).body(Map.of("error", e.getMessage(), "detail", e.getClass().getSimpleName()));
//         }
//     }
    
//     @GetMapping("/{groupId}/members")
//     public List<GroupMember> members(@PathVariable String groupId) {
//         return memberRepo.findByGroupId(groupId);
//     }

//     @GetMapping("/{groupId}/history")
//     public List<GroupMessage> history(@PathVariable String groupId) {
//         return msgRepo.findByGroupIdOrderBySentAtAsc(groupId);
//     }
    
//     // File download endpoint
//     @GetMapping("/files/{fileName:.+}")
//     public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
//         try {
//             byte[] fileContent = fileStorageService.loadFileAsBytes(fileName);
//             ByteArrayResource resource = new ByteArrayResource(fileContent);
            
//             // Determine content type
//             String contentType = "application/octet-stream";
//             if (fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg")) {
//                 contentType = "image/jpeg";
//             } else if (fileName.toLowerCase().endsWith(".png")) {
//                 contentType = "image/png";
//             } else if (fileName.toLowerCase().endsWith(".gif")) {
//                 contentType = "image/gif";
//             } else if (fileName.toLowerCase().endsWith(".pdf")) {
//                 contentType = "application/pdf";
//             }
            
//             return ResponseEntity.ok()
//                     .contentType(MediaType.parseMediaType(contentType))
//                     .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
//                     .body(resource);
//         } catch (IOException e) {
//             return ResponseEntity.notFound().build();
//         }
//     }

//     // Delete message (soft delete)
//     @PostMapping("/message/{messageId}/delete")
//     public ResponseEntity<?> deleteMessage(
//             @PathVariable Long messageId,
//             @RequestBody Map<String, String> payload) {
        
//         String userId = payload.get("userId");
        
//         return msgRepo.findById(messageId)
//             .map(msg -> {
//                 // Check if user is sender or admin
//                 if (!msg.getSenderName().equalsIgnoreCase(userId)) {
//                     return ResponseEntity.status(403).body(Map.of("error", "Not authorized to delete this message"));
//                 }
                
//                 // Soft delete
//                 msg.setDeleted(true);
//                 msg.setDeletedAt(java.time.Instant.now());
//                 msg.setDeletedBy(userId);
//                 msgRepo.save(msg);
                
//                 // Broadcast deletion
//                 broker.convertAndSend("/topic/group." + msg.getGroupId(), Map.of(
//                     "type", "MESSAGE_DELETED",
//                     "messageId", messageId,
//                     "deletedBy", userId
//                 ));
                
//                 return ResponseEntity.ok(Map.of("message", "Message deleted successfully"));
//             })
//             .orElse(ResponseEntity.notFound().build());
//     }
    
//     // Delete message for everyone (admin only)
//     @PostMapping("/message/{messageId}/delete-for-everyone")
//     public ResponseEntity<?> deleteMessageForEveryone(
//             @PathVariable Long messageId,
//             @RequestBody Map<String, String> payload) {
        
//         String userId = payload.get("userId");
        
//         return msgRepo.findById(messageId)
//             .map(msg -> {
//                 // Soft delete
//                 msg.setDeleted(true);
//                 msg.setDeletedAt(java.time.Instant.now());
//                 msg.setDeletedBy(userId);
//                 msg.setContent("This message was deleted");
//                 msg.setFileUrl(null);
//                 msg.setFileName(null);
//                 msgRepo.save(msg);
                
//                 // Broadcast deletion
//                 broker.convertAndSend("/topic/group." + msg.getGroupId(), Map.of(
//                     "type", "MESSAGE_DELETED_FOR_EVERYONE",
//                     "messageId", messageId,
//                     "deletedBy", userId
//                 ));
                
//                 return ResponseEntity.ok(Map.of("message", "Message deleted for everyone"));
//             })
//             .orElse(ResponseEntity.notFound().build());
//     }

//     // STOMP send: /app/group.send
//     @MessageMapping("/group.send")
//     public void send(GroupMessage msg) {
//         if (msg.getSenderName() == null || msg.getSenderName().isBlank()) msg.setSenderName("User");
//         if (msg.getGroupId() == null || msg.getGroupId().isBlank()) return;
//         GroupMessage saved = msgRepo.save(msg);
//         broker.convertAndSend("/topic/group."+saved.getGroupId(), saved);
//     }
// }
package com.interacthub.chat.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
import org.springframework.beans.factory.annotation.Autowired;

import com.interacthub.chat.model.ChatGroup;
import com.interacthub.chat.model.GroupMember;
import com.interacthub.chat.model.GroupMessage;
import com.interacthub.chat.repository.ChatGroupRepository;
import com.interacthub.chat.repository.GroupMemberRepository;
import com.interacthub.chat.repository.GroupMessageRepository;
import com.interacthub.chat.service.FileStorageService;
import com.interacthub.chat.service.UserService;

@RestController
@RequestMapping("/api/group")
@CrossOrigin(origins = "http://localhost:3000")
public class GroupChatController {

    private final ChatGroupRepository groupRepo;
    private final GroupMemberRepository memberRepo;
    private final GroupMessageRepository msgRepo;
    private final SimpMessagingTemplate broker;
    private final FileStorageService fileStorageService;
    
    @Autowired
    private UserService userService;

    public GroupChatController(ChatGroupRepository groupRepo, GroupMemberRepository memberRepo, 
                               GroupMessageRepository msgRepo, SimpMessagingTemplate broker,
                               FileStorageService fileStorageService) {
        this.groupRepo = groupRepo; 
        this.memberRepo = memberRepo; 
        this.msgRepo = msgRepo; 
        this.broker = broker;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/create")
    public Map<String,Object> createGroup(@RequestBody Map<String,Object> req) {
        String name = String.valueOf(req.getOrDefault("name","Group"));
        String createdByName = String.valueOf(req.getOrDefault("createdByName","User"));
        String createdByEmail = String.valueOf(req.getOrDefault("createdByEmail", createdByName));
        Long organizationId = req.get("organizationId") != null ? Long.valueOf(String.valueOf(req.get("organizationId"))) : null;
        @SuppressWarnings("unchecked")
        List<String> members = (List<String>) req.getOrDefault("members", new ArrayList<>());

        ChatGroup g = new ChatGroup();
        g.setGroupId(UUID.randomUUID().toString());
        g.setName(name);
        g.setCreatedByName(createdByEmail);
        g.setOrganizationId(organizationId); // Set organization ID
        ChatGroup saved = groupRepo.save(g);

        // Prepare notification payload
        Map<String, Object> notification = Map.of(
            "type", "NEW_GROUP",
            "groupId", saved.getGroupId(),
            "groupName", saved.getName(),
            "createdBy", createdByName,
            "members", members,
            "createdAt", saved.getCreatedAt().toString(),
            "message", createdByName + " created a new group"
        );
        
        // Add members and notify them
        for (String m : members) {
            if (m == null || m.trim().isEmpty()) continue;
            GroupMember gm = new GroupMember();
            gm.setGroupId(saved.getGroupId());
            gm.setMemberName(m.trim());
            memberRepo.save(gm);
            
            String memberEmail = m.trim();
            System.out.println("📢 Notifying member: " + memberEmail + " about new group: " + saved.getName());
            
            // Send to user-specific queue
            broker.convertAndSend("/user/" + memberEmail + "/queue/notify", notification);
        }
        
        // Also broadcast to all clients via public topic
        System.out.println("📢 Broadcasting group creation to all clients");
        broker.convertAndSend("/topic/group-notifications", notification);
        
        // Send system message to group history
        GroupMessage systemMsg = new GroupMessage();
        systemMsg.setGroupId(saved.getGroupId());
        systemMsg.setSenderName("System");
        systemMsg.setContent(createdByName + " created the group");
        systemMsg.setMessageType("SYSTEM");
        systemMsg.setOrganizationId(organizationId); // Set organization ID
        GroupMessage savedMsg = msgRepo.save(systemMsg);
        
        // Broadcast system message to group topic (so creator sees it immediately)
        broker.convertAndSend("/topic/group." + saved.getGroupId(), savedMsg);
        
        return Map.of("groupId", saved.getGroupId(), "name", saved.getName());
    }

    // Health check for upload endpoint
    @GetMapping("/upload-file/test")
    public ResponseEntity<Map<String, String>> testUploadEndpoint() {
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Upload endpoint is accessible"));
    }

    // File upload endpoint
    @PostMapping("/upload-file")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("groupId") String groupId,
            @RequestParam("senderName") String senderName,
            @RequestParam(value = "organizationId", required = false) Long organizationId,
            @RequestParam(value = "content", required = false, defaultValue = "") String content) {
        
        System.out.println("📤 File upload received");
        
        try {
            if (file == null || file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            if (groupId == null || groupId.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "groupId is required"));
            
            FileStorageService.FileUploadResult uploadResult = fileStorageService.storeFile(file);
            
            GroupMessage msg = new GroupMessage();
            msg.setGroupId(groupId);
            msg.setSenderName(senderName);
            msg.setContent(content.isEmpty() ? "📎 " + uploadResult.getOriginalFileName() : content);
            msg.setFileUrl(uploadResult.getFileUrl());
            msg.setFileName(uploadResult.getOriginalFileName());
            msg.setFileType(uploadResult.getFileType());
            msg.setFileSize(uploadResult.getFileSize());
            msg.setMessageType("FILE");
            msg.setOrganizationId(organizationId); // Set organization ID
            
            GroupMessage saved = msgRepo.save(msg);
            broker.convertAndSend("/topic/group."+saved.getGroupId(), saved);
            
            return ResponseEntity.ok(Map.of(
                "messageId", saved.getId(),
                "fileUrl", uploadResult.getFileUrl(),
                "message", "File uploaded successfully"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{groupId}")
    public ResponseEntity<Map<String, Object>> getGroupDetails(@PathVariable String groupId) {
        try {
            Optional<ChatGroup> groupOpt = groupRepo.findByGroupId(groupId);
            if (!groupOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            ChatGroup group = groupOpt.get();
            List<GroupMember> members = memberRepo.findByGroupId(groupId);
            
            return ResponseEntity.ok(Map.of(
                "groupId", group.getGroupId(),
                "name", group.getName(),
                "createdBy", group.getCreatedByName(),
                "createdAt", group.getCreatedAt().toString(),
                "members", members.stream().map(GroupMember::getMemberName).collect(java.util.stream.Collectors.toList())
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{groupId}/members")
    public List<GroupMember> members(@PathVariable String groupId) {
        return memberRepo.findByGroupId(groupId);
    }

    @GetMapping("/{groupId}/history")
    public List<GroupMessage> history(@PathVariable String groupId, @RequestParam(required = false) Long organizationId) {
        try {
            System.out.println("📜 Fetching message history for group: " + groupId);
            List<GroupMessage> messages;
            
            // If organizationId is provided, use org-scoped query for security
            if (organizationId != null) {
                messages = msgRepo.findByGroupIdAndOrganizationIdOrderBySentAtAsc(groupId, organizationId);
                System.out.println("   Using org-scoped query (orgId: " + organizationId + ")");
            } else {
                // Fallback to non-org query for backward compatibility
                messages = msgRepo.findByGroupIdOrderBySentAtAsc(groupId);
                System.out.println("   Using non-org query (backward compatible)");
            }
            
            System.out.println("✅ Found " + messages.size() + " messages for group: " + groupId);
            return messages;
        } catch (Exception e) {
            System.err.println("❌ Error fetching message history for group: " + groupId);
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            byte[] fileContent = fileStorageService.loadFileAsBytes(fileName);
            ByteArrayResource resource = new ByteArrayResource(fileContent);
            
            // Determine content type
            String contentType = "application/octet-stream";
            if (fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg")) contentType = "image/jpeg";
            else if (fileName.toLowerCase().endsWith(".png")) contentType = "image/png";
            else if (fileName.toLowerCase().endsWith(".pdf")) contentType = "application/pdf";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Delete message (soft delete)
    @PostMapping("/message/{messageId}/delete")
    public ResponseEntity<?> deleteMessage(
            @PathVariable Long messageId,
            @RequestBody Map<String, String> payload) {
        
        String userId = payload.get("userId");
        
        return msgRepo.findById(messageId)
            .map(msg -> {
                // Check if user is sender or admin
                if (!msg.getSenderName().equalsIgnoreCase(userId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Not authorized to delete this message"));
                }
                
                // Soft delete
                msg.setDeleted(true);
                msg.setDeletedAt(java.time.Instant.now());
                msg.setDeletedBy(userId);
                msgRepo.save(msg);
                
                // Broadcast deletion
                broker.convertAndSend("/topic/group." + msg.getGroupId(), Map.of(
                    "type", "MESSAGE_DELETED",
                    "messageId", messageId,
                    "deletedBy", userId
                ));
                
                return ResponseEntity.ok(Map.of("message", "Message deleted successfully"));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // Leave group endpoint
    @PostMapping("/{groupId}/leave")
    public ResponseEntity<?> leaveGroup(
            @PathVariable String groupId,
            @RequestBody Map<String, String> payload) {
        
        String memberEmail = payload.get("memberEmail");
        
        if (memberEmail == null || memberEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "memberEmail is required"));
        }
        
        try {
            // Remove member from group
            List<GroupMember> members = memberRepo.findByGroupId(groupId);
            GroupMember toRemove = members.stream()
                .filter(m -> m.getMemberName().equalsIgnoreCase(memberEmail))
                .findFirst()
                .orElse(null);
            
            if (toRemove != null) {
                memberRepo.delete(toRemove);
            }
            
            // Broadcast member left event to remaining members
            broker.convertAndSend("/topic/group." + groupId, Map.of(
                "type", "MEMBER_LEFT",
                "memberEmail", memberEmail,
                "message", memberEmail + " left the group"
            ));
            
            // Notify the member that they left
            broker.convertAndSend("/user/" + memberEmail + "/queue/notify", Map.of(
                "type", "GROUP_LEFT",
                "groupId", groupId,
                "message", "You left the group"
            ));
            
            System.out.println("✅ Member " + memberEmail + " left group " + groupId);
            return ResponseEntity.ok(Map.of("message", "Left group successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // Delete group endpoint (creator only)
    @PostMapping("/{groupId}/delete")
    public ResponseEntity<?> deleteGroup(
            @PathVariable String groupId,
            @RequestBody Map<String, String> payload) {
        
        String creatorEmail = payload.get("creatorEmail");
        
        if (creatorEmail == null || creatorEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "creatorEmail is required"));
        }
        
        try {
            // Get group
            ChatGroup group = groupRepo.findByGroupId(groupId).orElse(null);
            if (group == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Get all members first
            List<GroupMember> members = memberRepo.findByGroupId(groupId);
            
            // Debug logging
            System.out.println("🔍 Delete group check:");
            System.out.println("   - groupId: " + groupId);
            System.out.println("   - creatorEmail from request: " + creatorEmail);
            System.out.println("   - createdByName from DB: " + group.getCreatedByName());
            System.out.println("   - members count: " + members.size());
            
            // Verify creator - compare emails (case-insensitive)
            boolean isCreator = group.getCreatedByName().equalsIgnoreCase(creatorEmail);
            System.out.println("   - isCreator (email match): " + isCreator);
            
            // Fallback: if not creator by email, check if user is a member (for old groups where createdByName might be display name)
            if (!isCreator) {
                boolean isMember = members.stream()
                    .anyMatch(m -> m.getMemberName().equalsIgnoreCase(creatorEmail));
                System.out.println("   - isMember (fallback): " + isMember);
                
                if (!isMember) {
                    System.out.println("❌ Authorization failed - not the creator or member");
                    return ResponseEntity.status(403).body(Map.of("error", "Only group creator can delete the group"));
                }
                System.out.println("✅ Using fallback authorization - user is a member");
            }
            
            // Notify all members about group deletion
            for (GroupMember member : members) {
                broker.convertAndSend("/user/" + member.getMemberName() + "/queue/notify", Map.of(
                    "type", "GROUP_DELETED",
                    "groupId", groupId,
                    "groupName", group.getName(),
                    "message", "Group " + group.getName() + " has been deleted"
                ));
            }
            
            // Broadcast deletion to group topic
            broker.convertAndSend("/topic/group." + groupId, Map.of(
                "type", "GROUP_DELETED",
                "groupId", groupId,
                "message", "This group has been deleted"
            ));
            
            // Delete all messages in group
            List<GroupMessage> messages = msgRepo.findByGroupIdOrderBySentAtAsc(groupId);
            msgRepo.deleteAll(messages);
            
            // Delete all members
            memberRepo.deleteAll(members);
            
            // Delete group
            groupRepo.delete(group);
            
            System.out.println("✅ Group " + groupId + " deleted by " + creatorEmail);
            return ResponseEntity.ok(Map.of("message", "Group deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // Add member to group
    @PostMapping("/{groupId}/add-member")
    public ResponseEntity<?> addMember(
            @PathVariable String groupId,
            @RequestBody Map<String, Object> payload) {
        
        String memberEmail = (String) payload.get("memberEmail");
        String addedByEmail = (String) payload.get("addedByEmail");
        
        if (memberEmail == null || memberEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "memberEmail is required"));
        }
        
        try {
            // Get group
            ChatGroup group = groupRepo.findByGroupId(groupId).orElse(null);
            if (group == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if member already exists
            List<GroupMember> existingMembers = memberRepo.findByGroupId(groupId);
            boolean alreadyMember = existingMembers.stream()
                .anyMatch(m -> m.getMemberName().equalsIgnoreCase(memberEmail));
            
            if (alreadyMember) {
                return ResponseEntity.badRequest().body(Map.of("error", "User is already a member of this group"));
            }
            
            // Add new member
            GroupMember newMember = new GroupMember();
            newMember.setGroupId(groupId);
            newMember.setMemberName(memberEmail.trim());
            memberRepo.save(newMember);
            
            // Notify the new member
            String addedByName = addedByEmail != null ? addedByEmail : "Admin";
            broker.convertAndSend("/user/" + memberEmail.toLowerCase() + "/queue/notify", Map.of(
                "type", "ADDED_TO_GROUP",
                "groupId", groupId,
                "groupName", group.getName(),
                "addedBy", addedByName,
                "message", addedByName + " added you to " + group.getName()
            ));
            
            // Broadcast member added event to group
            broker.convertAndSend("/topic/group." + groupId, Map.of(
                "type", "MEMBER_ADDED",
                "memberEmail", memberEmail,
                "addedBy", addedByName,
                "message", addedByName + " added " + memberEmail + " to the group"
            ));
            
            System.out.println("✅ Member " + memberEmail + " added to group " + groupId + " by " + addedByName);
            return ResponseEntity.ok(Map.of(
                "message", "Member added successfully",
                "memberEmail", memberEmail
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // Get all groups for a user
    @GetMapping("/user/{userEmail}/groups")
    public ResponseEntity<List<Map<String, Object>>> getUserGroups(@PathVariable String userEmail) {
        try {
            System.out.println("🔍 Fetching groups for user: " + userEmail);
            String normalizedEmail = userEmail.toLowerCase();
            System.out.println("   Normalized email: " + normalizedEmail);
            
            List<GroupMember> memberships = memberRepo.findByMemberName(normalizedEmail);
            System.out.println("   Found " + memberships.size() + " group memberships");
            
            List<Map<String, Object>> groups = new ArrayList<>();
            
            for (GroupMember membership : memberships) {
                System.out.println("   Processing group: " + membership.getGroupId());
                Optional<ChatGroup> groupOpt = groupRepo.findByGroupId(membership.getGroupId());
                if (groupOpt.isPresent()) {
                    ChatGroup group = groupOpt.get();
                    List<GroupMember> allMembers = memberRepo.findByGroupId(membership.getGroupId());
                    Map<String, Object> groupData = Map.of(
                        "groupId", group.getGroupId(),
                        "name", group.getName(),
                        "createdBy", group.getCreatedByName(),
                        "createdAt", group.getCreatedAt().toString(),
                        "members", allMembers.stream().map(GroupMember::getMemberName).collect(java.util.stream.Collectors.toList())
                    );
                    groups.add(groupData);
                    System.out.println("   ✅ Added group: " + group.getName());
                } else {
                    System.out.println("   ❌ Group not found: " + membership.getGroupId());
                }
            }
            
            System.out.println("✅ Returning " + groups.size() + " groups for user: " + userEmail);
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            System.err.println("❌ Error fetching groups for user: " + userEmail);
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ArrayList<>());
        }
    }

    // STOMP send: /app/group.send
    @MessageMapping("/group.send")
    public void send(GroupMessage msg) {
        try {
            System.out.println("📨 Received message for group: " + msg.getGroupId());
            System.out.println("   From: " + msg.getSenderName());
            System.out.println("   Content: " + (msg.getContent() != null ? msg.getContent().substring(0, Math.min(50, msg.getContent().length())) : "null"));
            
            if (msg.getSenderName() == null || msg.getSenderName().isBlank()) {
                msg.setSenderName("User");
                System.out.println("   ⚠️ Sender name was null, set to 'User'");
            }
            if (msg.getGroupId() == null || msg.getGroupId().isBlank()) {
                System.err.println("❌ Group ID is null or blank, discarding message");
                return;
            }
            
            // Get group to retrieve organizationId if not set
            Optional<ChatGroup> groupOpt = groupRepo.findByGroupId(msg.getGroupId());
            if (groupOpt.isPresent() && msg.getOrganizationId() == null) {
                msg.setOrganizationId(groupOpt.get().getOrganizationId());
            }
            
            GroupMessage saved = msgRepo.save(msg);
            System.out.println("✅ Message saved with ID: " + saved.getId());
            
            // Broadcast to group topic (for active subscribers)
            broker.convertAndSend("/topic/group."+saved.getGroupId(), saved);
            System.out.println("📢 Broadcasted to /topic/group." + saved.getGroupId());
            
            // Send notifications to all group members (for global notifications)
            List<GroupMember> members = memberRepo.findByGroupId(saved.getGroupId());
            String senderName = saved.getSenderName();
            String preview = saved.getContent() != null && saved.getContent().length() > 100 
                ? saved.getContent().substring(0, 100) + "..." 
                : saved.getContent();
            
            // Fetch sender's full name from admin service
            String senderFirstName = null;
            String senderLastName = null;
            if (userService != null) {
                Map<String, Object> senderUser = userService.getUserByEmail(senderName);
                if (senderUser != null) {
                    senderFirstName = (String) senderUser.get("firstName");
                    senderLastName = (String) senderUser.get("lastName");
                    System.out.println("   Sender full name: " + senderFirstName + " " + senderLastName);
                }
            }
            
            System.out.println("   Notifying " + members.size() + " members");
            for (GroupMember member : members) {
                String memberEmail = member.getMemberName();
                // Don't notify the sender
                if (memberEmail != null && !memberEmail.equalsIgnoreCase(senderName)) {
                    String normalizedMemberEmail = memberEmail.toLowerCase();
                    Map<String, Object> notification = Map.of(
                        "type", "group_message",
                        "from", senderName,
                        "fromEmail", senderName,
                        "firstName", senderFirstName != null ? senderFirstName : "",
                        "lastName", senderLastName != null ? senderLastName : "",
                        "groupId", saved.getGroupId(),
                        "preview", preview != null ? preview : "New message",
                        "sentAt", String.valueOf(saved.getSentAt())
                    );
                    
                    // Send to user-specific queue
                    broker.convertAndSend("/user/" + normalizedMemberEmail + "/queue/notify", notification);
                    System.out.println("   📬 Sent notification to: " + normalizedMemberEmail);
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error sending message: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    @PostMapping("/populate-sample")
    public ResponseEntity<?> populateSampleGroups() {
        try {
            System.out.println("🧪 Populating sample groups");
            
            // Check if groups already exist
            java.util.List<ChatGroup> existingGroups = groupRepo.findAll();
            if (!existingGroups.isEmpty()) {
                return ResponseEntity.ok(Map.of("message", "Sample groups already exist", "count", existingGroups.size()));
            }
            
            // Create sample groups with common user roles
            String[][] groupConfigs = {
                {"Team A", "admin", "admin,manager,hr,employee"},
                {"Team B", "manager", "manager,hr,employee"},
                {"Developers", "admin", "admin,employee"}
            };
            
            int groupCount = 0;
            int messageCount = 0;
            
            for (String[] config : groupConfigs) {
                String groupName = config[0];
                String createdBy = config[1];
                String[] members = config[2].split(",");
                
                // Create group
                ChatGroup group = new ChatGroup();
                group.setGroupId(UUID.randomUUID().toString());
                group.setName(groupName);
                group.setCreatedByName(createdBy);
                ChatGroup savedGroup = groupRepo.save(group);
                groupCount++;
                System.out.println("   ✅ Created group: " + groupName);
                
                // Add members
                for (String member : members) {
                    GroupMember gm = new GroupMember();
                    gm.setGroupId(savedGroup.getGroupId());
                    gm.setMemberName(member.trim());
                    memberRepo.save(gm);
                }
                
                // Add sample messages
                for (int i = 1; i <= 2; i++) {
                    GroupMessage msg = new GroupMessage();
                    msg.setGroupId(savedGroup.getGroupId());
                    msg.setSenderName(members[i % members.length].trim());
                    msg.setContent("Sample message " + i + " in " + groupName);
                    msgRepo.save(msg);
                    messageCount++;
                }
            }
            
            System.out.println("✅ Created " + groupCount + " sample groups with " + messageCount + " messages");
            return ResponseEntity.ok(Map.of(
                "message", "Sample groups populated successfully",
                "groups", groupCount,
                "messages", messageCount
            ));
        } catch (Exception e) {
            System.err.println("❌ Error populating sample groups");
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}