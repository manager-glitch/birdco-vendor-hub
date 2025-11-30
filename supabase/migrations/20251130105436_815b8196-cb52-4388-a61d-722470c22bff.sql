-- Add chef-specific document types to vendor_documents table
-- The table will now handle documents for both vendors and chefs

-- Update the comment on vendor_documents table to reflect it handles both user types
COMMENT ON TABLE public.vendor_documents IS 'Stores documents for both vendors and chefs';

-- We'll handle different document types in the application logic
-- Vendor documents: public_liability_insurance, hygiene_rating, food_safety_certificate, allergen_information, signed_contract
-- Chef documents: food_safety_certificate, right_to_work, dbs_certificate, public_liability_insurance

-- No schema changes needed - the existing structure supports both user types
-- The document_type column already accepts text values for flexibility