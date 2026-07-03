package org.example.pet_social.repository;

import org.example.pet_social.entity.DateInvitation;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface DateInvitationRepository extends MongoRepository<DateInvitation, String> {
    List<DateInvitation> findByHostUserId(String hostUserId);
    List<DateInvitation> findByHostUserIdNotAndStatus(String hostUserId, String status);
}
