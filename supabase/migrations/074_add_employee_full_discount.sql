-- Add employee_full discount type for 100% employee discount
ALTER TYPE discount_type ADD VALUE IF NOT EXISTS 'employee_full';
