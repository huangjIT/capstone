package org.example.pet_social.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "pet_matches")
@CompoundIndex(name = "idx_pets_unique", def = "{'petId1': 1, 'petId2': 1}", unique = true)
public class PetMatch {

    @Id
    private String id;

    @Indexed
    private String petId1;

    @Indexed
    private String petId2;

    private String matchStatus = "PENDING";
    private Double compatibilityScore;
    private String matchType;
    private String initiatedByUserId;
    private LocalDateTime meetingDate;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PetMatch() {}

    public PetMatch(String petId1, String petId2, String initiatedByUserId) {
        this.petId1 = petId1;
        this.petId2 = petId2;
        this.initiatedByUserId = initiatedByUserId;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public String getPetId1() { return petId1; }
    public void setPetId1(String petId1) { this.petId1 = petId1; }
    public String getPetId2() { return petId2; }
    public void setPetId2(String petId2) { this.petId2 = petId2; }
    public String getMatchStatus() { return matchStatus; }
    public void setMatchStatus(String matchStatus) { this.matchStatus = matchStatus; }
    public Double getCompatibilityScore() { return compatibilityScore; }
    public void setCompatibilityScore(Double compatibilityScore) { this.compatibilityScore = compatibilityScore; }
    public String getMatchType() { return matchType; }
    public void setMatchType(String matchType) { this.matchType = matchType; }
    public String getInitiatedByUserId() { return initiatedByUserId; }
    public void setInitiatedByUserId(String initiatedByUserId) { this.initiatedByUserId = initiatedByUserId; }
    public LocalDateTime getMeetingDate() { return meetingDate; }
    public void setMeetingDate(LocalDateTime meetingDate) { this.meetingDate = meetingDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
