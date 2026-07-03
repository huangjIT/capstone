package org.example.pet_social.repository;

import org.example.pet_social.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {
    Page<Comment> findByPostId(String postId, Pageable pageable);
    List<Comment> findByUserId(String userId);
    Long countByPostId(String postId);
}
