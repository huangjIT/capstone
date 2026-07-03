package org.example.pet_social;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test") // application-test.yml swaps Postgres for in-memory H2
class PetSocialApplicationTests {

    @Test
    void contextLoads() {
    }

}
