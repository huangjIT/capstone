package org.example.pet_social.dto;

import org.example.pet_social.entity.Pet;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class UiFormatTest {

    @Test
    void petEmojiPrefersExplicitAvatarThenFallsBackBySpecies() {
        Pet withAvatar = new Pet(null, "Rex", "DOG", "Lab");
        withAvatar.setAvatarEmoji("🦴");
        assertThat(UiFormat.petEmoji(withAvatar)).isEqualTo("🦴");

        assertThat(UiFormat.petEmoji(new Pet(null, "Rex", "dog", null))).isEqualTo("🐕");
        assertThat(UiFormat.petEmoji(new Pet(null, "Tom", "CAT", null))).isEqualTo("🐱");
        assertThat(UiFormat.petEmoji(new Pet(null, "Bunny", "RABBIT", null))).isEqualTo("🐾");
        assertThat(UiFormat.petEmoji(new Pet(null, "X", null, null))).isEqualTo("🐾");
    }

    @Test
    void speciesLabelMapsDbValuesToUiUnion() {
        assertThat(UiFormat.speciesLabel("DOG")).isEqualTo("Dog");
        assertThat(UiFormat.speciesLabel("cat")).isEqualTo("Cat");
        assertThat(UiFormat.speciesLabel("BIRD")).isEqualTo("Other");
        assertThat(UiFormat.speciesLabel(null)).isEqualTo("Other");
    }

    @Test
    void ageFormatsYearsAndMonths() {
        assertThat(UiFormat.age(LocalDate.now().minusYears(2).minusMonths(1))).isEqualTo("2y");
        assertThat(UiFormat.age(LocalDate.now().minusMonths(8))).isEqualTo("8mo");
        // Newborns round up to 1mo rather than showing 0mo
        assertThat(UiFormat.age(LocalDate.now().minusDays(3))).isEqualTo("1mo");
        assertThat(UiFormat.age(null)).isEmpty();
    }

    @Test
    void tagsSplitsCsvAndAddsVaccinated() {
        Pet pet = new Pet(null, "Rex", "DOG", null);
        pet.setPersonalityTags("Friendly, Calm pace,,  ");
        pet.setIsVaccinated(true);
        assertThat(UiFormat.tags(pet)).containsExactly("Friendly", "Calm pace", "Vaccinated");

        Pet duplicate = new Pet(null, "Rex", "DOG", null);
        duplicate.setPersonalityTags("Vaccinated");
        duplicate.setIsVaccinated(true);
        assertThat(UiFormat.tags(duplicate)).containsExactly("Vaccinated");

        assertThat(UiFormat.tags(new Pet(null, "Rex", "DOG", null))).isEmpty();
    }

    @Test
    void distanceKmFormatsOneDecimalOrEmpty() {
        assertThat(UiFormat.distanceKm(1.267)).isEqualTo("1.3 km");
        assertThat(UiFormat.distanceKm(null)).isEmpty();
    }

    @Test
    void relativeTimeBuckets() {
        assertThat(UiFormat.relativeTime(LocalDateTime.now())).isEqualTo("Just now");
        assertThat(UiFormat.relativeTime(LocalDateTime.now().minusMinutes(5))).isEqualTo("5 min ago");
        assertThat(UiFormat.relativeTime(LocalDateTime.now().minusHours(3))).isEqualTo("3 hr ago");
        assertThat(UiFormat.relativeTime(LocalDateTime.now().minusDays(1).minusHours(1))).isEqualTo("Yesterday");
        assertThat(UiFormat.relativeTime(LocalDateTime.now().minusDays(4))).isEqualTo("4 days ago");
        assertThat(UiFormat.relativeTime(null)).isEmpty();
    }

    @Test
    void capitalizeAndToDbValueRoundTrip() {
        assertThat(UiFormat.capitalize("LIKE_NEW")).isEqualTo("Like New");
        assertThat(UiFormat.capitalize("toy")).isEqualTo("Toy");
        assertThat(UiFormat.capitalize(null)).isEmpty();
        assertThat(UiFormat.toDbValue("Like New")).isEqualTo("LIKE_NEW");
        assertThat(UiFormat.toDbValue("  ")).isNull();
    }

    @Test
    void notifHelpersMapCategories() {
        assertThat(UiFormat.notifCategory("BLIND_DATE")).isEqualTo("blind_date");
        assertThat(UiFormat.notifEmoji("MESSAGE")).isEqualTo("💬");
        assertThat(UiFormat.notifEmoji("SOMETHING_ELSE")).isEqualTo("🔔");
        assertThat(UiFormat.notifLabel("WALK_REQUEST")).isEqualTo("Walk Request");
        assertThat(UiFormat.notifLabel("CUSTOM_THING")).isEqualTo("Custom Thing");
    }

    @Test
    void haversineMatchesKnownDistance() {
        // Berlin -> Munich is ~504 km
        double km = UiFormat.haversineKm(52.5200, 13.4050, 48.1351, 11.5820);
        assertThat(km).isCloseTo(504.0, within(5.0));
        assertThat(UiFormat.haversineKm(10, 20, 10, 20)).isCloseTo(0.0, within(1e-9));
    }
}
