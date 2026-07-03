package org.example.pet_social.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "walk_requests")
public class WalkRequest {

    @Id
    private String id;

    @Indexed
    private String invitationId;

    @Indexed
    private String requesterUserId;

    private String requesterPetId;
    private String status; // PENDING, ACCEPTED, REJECTED
    private String message;
    private LocalDateTime createdAt;

    public WalkRequest() {}

    public String getId() { return id; }
    public String getInvitationId() { return invitationId; }
    public void setInvitationId(String invitationId) { this.invitationId = invitationId; }
    public String getRequesterUserId() { return requesterUserId; }
    public void setRequesterUserId(String requesterUserId) { this.requesterUserId = requesterUserId; }
    public String getRequesterPetId() { return requesterPetId; }
    public void setRequesterPetId(String requesterPetId) { this.requesterPetId = requesterPetId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
