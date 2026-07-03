package org.example.pet_social.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "event_attendees")
@CompoundIndex(name = "idx_event_user_unique", def = "{'eventId': 1, 'userId': 1}", unique = true)
public class EventAttendee {

    @Id
    private String id;

    @Indexed
    private String eventId;

    @Indexed
    private String userId;

    private String petId;
    private String rsvpStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EventAttendee() {}

    public EventAttendee(String eventId, String userId, String rsvpStatus) {
        this.eventId = eventId;
        this.userId = userId;
        this.rsvpStatus = rsvpStatus;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getPetId() { return petId; }
    public void setPetId(String petId) { this.petId = petId; }
    public String getRsvpStatus() { return rsvpStatus; }
    public void setRsvpStatus(String rsvpStatus) { this.rsvpStatus = rsvpStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
