package org.example.pet_social.repository;

import org.example.pet_social.entity.Friendship;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends MongoRepository<Friendship, String> {
    @Query("{ $or: [{ 'userId': ?0 }, { 'friendId': ?0 }], 'status': ?1 }")
    List<Friendship> findByUserIdAndStatus(String userId, String status);

    @Query("{ 'friendId': ?0, 'status': 'PENDING' }")
    List<Friendship> findPendingRequestsForUser(String userId);

    @Query("{ 'userId': ?0, 'status': 'PENDING' }")
    List<Friendship> findPendingRequestsByUser(String userId);

    @Query("{ $or: [{ 'userId': ?0, 'friendId': ?1 }, { 'userId': ?1, 'friendId': ?0 }] }")
    Optional<Friendship> findFriendshipBetween(String userId1, String userId2);

    @Query(value = "{ $or: [{ 'userId': ?0 }, { 'friendId': ?0 }], 'status': 'ACCEPTED' }", count = true)
    long countFriendsByUserId(String userId);
}
