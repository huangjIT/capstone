package org.example.pet_social.repository;

import org.example.pet_social.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    @Query("{ $or: [{ 'senderId': ?0, 'receiverId': ?1 }, { 'senderId': ?1, 'receiverId': ?0 }] }")
    Page<Message> findConversation(String userId1, String userId2, Pageable pageable);

    @Query("{ $or: [{ 'senderId': ?0, 'receiverId': ?1 }, { 'senderId': ?1, 'receiverId': ?0 }] }")
    List<Message> findConversationSorted(String userId1, String userId2, Sort sort);

    List<Message> findByWalkRequestIdOrderByCreatedAtAsc(String walkRequestId);

    List<Message> findBySenderId(String senderId);
    List<Message> findByReceiverId(String receiverId);
    List<Message> findByReceiverIdAndIsRead(String receiverId, Boolean isRead);
    Long countByReceiverIdAndIsRead(String receiverId, Boolean isRead);
    long countByWalkRequestIdAndReceiverIdAndIsRead(String walkRequestId, String receiverId, Boolean isRead);
    long countByTypeAndWalkInvitationIdAndReceiverIdAndIsRead(String type, String walkInvitationId, String receiverId, Boolean isRead);
    long countByTypeAndDateInvitationIdAndReceiverIdAndIsRead(String type, String dateInvitationId, String receiverId, Boolean isRead);
    List<Message> findByDateRequestIdOrderByCreatedAtAsc(String dateRequestId);
    List<Message> findByMarketItemIdOrderByCreatedAtAsc(String marketItemId);
    long countByTypeAndMarketItemIdAndReceiverIdAndIsRead(String type, String marketItemId, String receiverId, Boolean isRead);
    long countByTypeAndReceiverIdAndIsRead(String type, String receiverId, Boolean isRead);
}
