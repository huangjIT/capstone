package org.example.pet_social.repository;

import org.example.pet_social.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends MongoRepository<Post, String> {
    Page<Post> findByUserId(String userId, Pageable pageable);
    Page<Post> findByPetId(String petId, Pageable pageable);
    Page<Post> findByVisibility(String visibility, Pageable pageable);
    @Query("{ 'userId': { $in: ?0 } }")
    Page<Post> findByUserIdIn(List<String> userIds, Pageable pageable);
    Long countByUserId(String userId);
}
