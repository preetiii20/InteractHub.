package com.interacthub.chat.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name="chat_group_messages",
       indexes = @Index(name="idx_groupmsg_group", columnList="groupId"))
public class GroupMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false) private String groupId;
    @Column(nullable=false) private String senderName;
    @Column(nullable=false, length=5000) private String content;
    @Column(nullable=false) private Instant sentAt = Instant.now();
    
    // File upload fields
    @Column(name="file_url") private String fileUrl;
    @Column(name="file_name") private String fileName;
    @Column(name="file_type") private String fileType; // e.g., "image/jpeg", "application/pdf"
    @Column(name="file_size") private Long fileSize;
    
    // Message status tracking
    @Column(name="status") private String status = "SENT"; // SENT, DELIVERED, READ
    
    // Reply/Quote functionality
    @Column(name="reply_to_id") private Long replyToId;
    @Column(name="reply_to_content", length=200) private String replyToContent;
    @Column(name="reply_to_sender") private String replyToSender;
    
    // Mentions
    @Column(name="mentions", length=1000) private String mentions; // Comma-separated user IDs
    
    // Message type
    @Column(name="message_type") private String messageType = "TEXT"; // TEXT, SYSTEM, FILE, IMAGE
    
    // Soft delete
    @Column(name="deleted") private Boolean deleted = false;
    @Column(name="deleted_at") private Instant deletedAt;
    @Column(name="deleted_by") private String deletedBy;

    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getGroupId() { return groupId; } public void setGroupId(String groupId) { this.groupId = groupId; }
    public String getSenderName() { return senderName; } public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getContent() { return content; } public void setContent(String content) { this.content = content; }
    public Instant getSentAt() { return sentAt; } public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
    public String getFileUrl() { return fileUrl; } public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getFileName() { return fileName; } public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFileType() { return fileType; } public void setFileType(String fileType) { this.fileType = fileType; }
    public Long getFileSize() { return fileSize; } public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Long getReplyToId() { return replyToId; } public void setReplyToId(Long replyToId) { this.replyToId = replyToId; }
    public String getReplyToContent() { return replyToContent; } public void setReplyToContent(String replyToContent) { this.replyToContent = replyToContent; }
    public String getReplyToSender() { return replyToSender; } public void setReplyToSender(String replyToSender) { this.replyToSender = replyToSender; }
    public String getMentions() { return mentions; } public void setMentions(String mentions) { this.mentions = mentions; }
    public String getMessageType() { return messageType; } public void setMessageType(String messageType) { this.messageType = messageType; }
    public Boolean getDeleted() { return deleted; } public void setDeleted(Boolean deleted) { this.deleted = deleted; }
    public Instant getDeletedAt() { return deletedAt; } public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
    public String getDeletedBy() { return deletedBy; } public void setDeletedBy(String deletedBy) { this.deletedBy = deletedBy; }
}
