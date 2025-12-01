package com.interacthub.chat.model;

public class TypingEvent {
    private String roomId;
    private String userId;
    private String userName;
    private boolean typing;
    
    public TypingEvent() {}
    
    public TypingEvent(String roomId, String userId, String userName, boolean typing) {
        this.roomId = roomId;
        this.userId = userId;
        this.userName = userName;
        this.typing = typing;
    }
    
    // Getters and Setters
    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    
    public boolean isTyping() { return typing; }
    public void setTyping(boolean typing) { this.typing = typing; }
}
