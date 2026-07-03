package org.example.pet_social.repository;

import org.example.pet_social.entity.WalkInvitation;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface WalkInvitationRepository extends MongoRepository<WalkInvitation, String> {
    List<WalkInvitation> findByHostUserId(String hostUserId);
    List<WalkInvitation> findByHostUserIdNotAndStatus(String hostUserId, String status);
}
