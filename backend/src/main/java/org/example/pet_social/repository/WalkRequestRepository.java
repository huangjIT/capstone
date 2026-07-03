package org.example.pet_social.repository;

import org.example.pet_social.entity.WalkRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface WalkRequestRepository extends MongoRepository<WalkRequest, String> {
    List<WalkRequest> findByInvitationId(String invitationId);
    List<WalkRequest> findByRequesterUserId(String requesterUserId);
    long countByInvitationIdAndStatus(String invitationId, String status);
    boolean existsByInvitationIdAndRequesterUserId(String invitationId, String requesterUserId);
    WalkRequest findByInvitationIdAndRequesterUserId(String invitationId, String requesterUserId);
}
