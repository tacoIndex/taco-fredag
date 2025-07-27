-- Add indexes for better query performance
CREATE INDEX idx_product_ean ON Product(ean);
CREATE INDEX idx_product_store ON Product(store);
CREATE INDEX idx_product_updated_at ON Product(updatedAt);
CREATE INDEX idx_ean_response_processed ON EanResponeDtos(processed);