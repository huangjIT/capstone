package org.example.pet_social.entity;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public record UserLocation(
		@JsonProperty("userId")
		@JsonAlias("driverId")
		Long userId,
		double latitude,
		double longitude
) {}
