package org.example.pet_social.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "events")
public class Event {

    @Id
    private String id;

    @Indexed
    private String organizerId;

    private String title;
    private String description;

    @Indexed
    private LocalDateTime eventDateTime;

    private String locationName;
    private Double latitude;
    private Double longitude;

    @Indexed
    private String eventType;

    private String petSpecies;
    private Integer maxAttendees;
    private Integer currentAttendees = 0;
    private String status = "UPCOMING";
    private String coverPhotoUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Event() {}

    public Event(String organizerId, String title, LocalDateTime eventDateTime) {
        this.organizerId = organizerId;
        this.title = title;
        this.eventDateTime = eventDateTime;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public String getOrganizerId() { return organizerId; }
    public void setOrganizerId(String organizerId) { this.organizerId = organizerId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getEventDateTime() { return eventDateTime; }
    public void setEventDateTime(LocalDateTime eventDateTime) { this.eventDateTime = eventDateTime; }
    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getPetSpecies() { return petSpecies; }
    public void setPetSpecies(String petSpecies) { this.petSpecies = petSpecies; }
    public Integer getMaxAttendees() { return maxAttendees; }
    public void setMaxAttendees(Integer maxAttendees) { this.maxAttendees = maxAttendees; }
    public Integer getCurrentAttendees() { return currentAttendees; }
    public void setCurrentAttendees(Integer currentAttendees) { this.currentAttendees = currentAttendees; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCoverPhotoUrl() { return coverPhotoUrl; }
    public void setCoverPhotoUrl(String coverPhotoUrl) { this.coverPhotoUrl = coverPhotoUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
