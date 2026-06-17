package org.example.pet_social.repository;

import org.example.pet_social.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Find conversation between two users
    @Query("SELECT m FROM Message m WHERE (m.sender.id = :userId1 AND m.receiver.id = :userId2) OR (m.sender.id = :userId2 AND m.receiver.id = :userId1) ORDER BY m.createdAt DESC")
    Page<Message> findConversation(@Param("userId1") Long userId1, @Param("userId2") Long userId2, Pageable pageable);

    // Find all messages sent by a user
    List<Message> findBySender_Id(Long senderId);

    // Find all messages received by a user
    List<Message> findByReceiver_Id(Long receiverId);

    // Find unread messages for a user
    List<Message> findByReceiver_IdAndIsRead(Long receiverId, Boolean isRead);

    // Count unread messages
    Long countByReceiver_IdAndIsRead(Long receiverId, Boolean isRead);

    // Find recent conversations for a user (unique conversation partners)
    @Query(value = "SELECT DISTINCT ON (CASE WHEN sender_id = :userId THEN receiver_id ELSE sender_id END) * " +
                   "FROM messages WHERE sender_id = :userId OR receiver_id = :userId " +
                   "ORDER BY CASE WHEN sender_id = :userId THEN receiver_id ELSE sender_id END, created_at DESC",
           nativeQuery = true)
    List<Message> findRecentConversations(@Param("userId") Long userId);
}
