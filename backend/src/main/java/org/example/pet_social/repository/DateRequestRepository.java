package org.example.pet_social.repository;

import org.example.pet_social.entity.DateRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface DateRequestRepository extends MongoRepository<DateRequest, String> {
    List<DateRequest> findByInvitationId(String invitationId);
    List<DateRequest> findByRequesterUserId(String requesterUserId);
    long countByInvitationIdAndStatus(String invitationId, String status);
    boolean existsByInvitationIdAndRequesterUserId(String invitationId, String requesterUserId);
    DateRequest findByInvitationIdAndRequesterUserId(String invitationId, String requesterUserId);
}
