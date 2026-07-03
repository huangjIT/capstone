package org.example.pet_social.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "pets")
public class Pet {

    @Id
    private String id;

    @Indexed
    private String ownerId;

    private String name;

    @Indexed
    private String species;

    private String breed;
    private LocalDate dateOfBirth;
    private String gender;
    private String size;
    private String temperament;
    private String bio;
    private String profilePhotoUrl;
    private Double weight;
    private Boolean isNeutered;
    private Boolean isVaccinated;

    @Indexed
    private Boolean isAvailableForPlaydate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Pet() {}

    public Pet(String ownerId, String name, String species, String breed) {
        this.ownerId = ownerId;
        this.name = name;
        this.species = species;
        this.breed = breed;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSpecies() { return species; }
    public void setSpecies(String species) { this.species = species; }
    public String getBreed() { return breed; }
    public void setBreed(String breed) { this.breed = breed; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    public String getTemperament() { return temperament; }
    public void setTemperament(String temperament) { this.temperament = temperament; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String url) { this.profilePhotoUrl = url; }
    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }
    public Boolean getIsNeutered() { return isNeutered; }
    public void setIsNeutered(Boolean isNeutered) { this.isNeutered = isNeutered; }
    public Boolean getIsVaccinated() { return isVaccinated; }
    public void setIsVaccinated(Boolean isVaccinated) { this.isVaccinated = isVaccinated; }
    public Boolean getIsAvailableForPlaydate() { return isAvailableForPlaydate; }
    public void setIsAvailableForPlaydate(Boolean v) { this.isAvailableForPlaydate = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
