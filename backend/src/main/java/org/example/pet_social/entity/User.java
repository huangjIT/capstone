package org.example.pet_social.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "drivers")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String vehicleType; // e.g., BICYCLE, CAR, SCOOTER

    @Column(nullable = false)
    private boolean isAvailable; // True if they can accept an order

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "capability_mask")
    private Long capabilityMask = 0L;

    // add getter/setter
    public Long getCapabilityMask() { return capabilityMask; }
    public void setCapabilityMask(Long capabilityMask) { this.capabilityMask = capabilityMask; }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Default constructor required by JPA
    public User() {}

    public User(String name, String vehicleType, boolean isAvailable) {
        this.name = name;
        this.vehicleType = vehicleType;
        this.isAvailable = isAvailable;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}