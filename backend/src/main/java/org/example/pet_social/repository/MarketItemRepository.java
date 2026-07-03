package org.example.pet_social.repository;

import org.example.pet_social.entity.MarketItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface MarketItemRepository extends MongoRepository<MarketItem, String> {
    List<MarketItem> findBySellerUserId(String sellerUserId);
    List<MarketItem> findBySellerUserIdNotAndStatus(String sellerUserId, String status);
    List<MarketItem> findBySellerUserIdNotAndStatusAndCategory(String sellerUserId, String status, String category);
}
