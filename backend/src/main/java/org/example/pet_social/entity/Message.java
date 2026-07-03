package org.example.pet_social.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "messages")
@CompoundIndex(name = "idx_conversation", def = "{'senderId': 1, 'receiverId': 1, 'createdAt': -1}")
public class Message {

    @Id
    private String id;

    @Indexed
    private String senderId;

    @Indexed
    private String receiverId;

    @Indexed
    private String walkRequestId;

    /** Business type: WALK | DATE | MARKET */
    @Indexed
    private String type;

    /** For WALK messages: the walk invitation ID this message belongs to */
    @Indexed
    private String walkInvitationId;

    /** For DATE messages: the date request ID scoping this conversation */
    @Indexed
    private String dateRequestId;

    /** For DATE messages: the date invitation ID this message belongs to */
    @Indexed
    private String dateInvitationId;

    /** For MARKET messages: the market item ID this message belongs to */
    @Indexed
    private String marketItemId;

    private String content;
    private String messageType = "TEXT";
    private String mediaUrl;
    private Boolean isRead = false;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;

    public Message() {}

    public Message(String senderId, String receiverId, String content) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }
    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
        if (Boolean.TRUE.equals(isRead) && this.readAt == null) {
            this.readAt = LocalDateTime.now();
        }
    }
    public String getWalkRequestId() { return walkRequestId; }
    public void setWalkRequestId(String walkRequestId) { this.walkRequestId = walkRequestId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getWalkInvitationId() { return walkInvitationId; }
    public void setWalkInvitationId(String walkInvitationId) { this.walkInvitationId = walkInvitationId; }
    public String getDateRequestId() { return dateRequestId; }
    public void setDateRequestId(String dateRequestId) { this.dateRequestId = dateRequestId; }
    public String getDateInvitationId() { return dateInvitationId; }
    public void setDateInvitationId(String dateInvitationId) { this.dateInvitationId = dateInvitationId; }
    public String getMarketItemId() { return marketItemId; }
    public void setMarketItemId(String marketItemId) { this.marketItemId = marketItemId; }
    public LocalDateTime getReadAt() { return readAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void markAsRead() { setIsRead(true); }
}
