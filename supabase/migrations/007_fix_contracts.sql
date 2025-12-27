-- FIX: Contracts - remover TODAS as constraints NOT NULL
ALTER TABLE contracts ALTER COLUMN title DROP NOT NULL;
ALTER TABLE contracts ALTER COLUMN total_value DROP NOT NULL;
ALTER TABLE contracts ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE contracts ALTER COLUMN vehicle_id DROP NOT NULL;
ALTER TABLE contracts ALTER COLUMN start_date DROP NOT NULL;
