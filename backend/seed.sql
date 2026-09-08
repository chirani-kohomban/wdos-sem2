-- Seed data for admins
INSERT INTO admins (username, password) VALUES ('admin', 'admin123');

-- Seed data for products (sample)
INSERT INTO products (name, category, price, image, description, rating) VALUES
('Organic Tomatoes', 'Vegetables', 4.99, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80', 'Freshly picked organic tomatoes from local farms.', 4.8),
('Fresh Basil Bundle', 'Herbs', 2.49, 'https://images.unsplash.com/photo-1618164420084-29ec3ce4970f?auto=format&fit=crop&w=800&q=80', 'Aromatic fresh basil perfect for pesto.', 4.9);

-- Add more rows as needed for other tables.
