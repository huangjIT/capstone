package org.example.pet_social.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "walk_invitations")
public class WalkInvitation {

    @Id
    private String id;

    @Indexed
    private String hostUserId;

    private List<String> hostPetIds = new ArrayList<>();
    private String route;
    private Double latitude;
    private Double longitude;
    private String date;
    private String time;
    private int durationMinutes;
    private int maxSpots;
    private String message;
    private String status; // ACTIVE, DRAFT, WITHDRAWN

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public WalkInvitation() {}

    public String getId() { return id; }
    public String getHostUserId() { return hostUserId; }
    public void setHostUserId(String hostUserId) { this.hostUserId = hostUserId; }
    public List<String> getHostPetIds() { return hostPetIds; }
    public void setHostPetIds(List<String> hostPetIds) { this.hostPetIds = hostPetIds != null ? hostPetIds : new ArrayList<>(); }
    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public int getMaxSpots() { return maxSpots; }
    public void setMaxSpots(int maxSpots) { this.maxSpots = maxSpots; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
