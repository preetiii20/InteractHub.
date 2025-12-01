package com.interacthub.chat.model;

public class SignalMessage {
    private String roomId;
    private String fromName;
    private String toName;
    private String type;
    private String sdp;
    private String candidate;
    private String media;

    public String getRoomId() { return roomId; } public void setRoomId(String roomId) { this.roomId = roomId; }
    public String getFromName() { return fromName; } public void setFromName(String fromName) { this.fromName = fromName; }
    public String getToName() { return toName; } public void setToName(String toName) { this.toName = toName; }
    public String getType() { return type; } public void setType(String type) { this.type = type; }
    public String getSdp() { return sdp; } public void setSdp(String sdp) { this.sdp = sdp; }
    public String getCandidate() { return candidate; } public void setCandidate(String candidate) { this.candidate = candidate; }
    public String getMedia() { return media; } public void setMedia(String media) { this.media = media; }
}
