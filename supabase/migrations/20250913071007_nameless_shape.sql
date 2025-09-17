/*
  # Add PDF URL columns to events table

  1. New Columns
    - `invoice_pdf_url` (text, nullable) - URL to stored invoice PDF
    - `payment_pdf_url` (text, nullable) - URL to stored payment proof PDF

  2. Purpose
    - Enable file upload functionality for invoices and payment proofs
    - Support the status workflow system that requires these documents
*/

-- Add invoice PDF URL column
ALTER TABLE events ADD COLUMN IF NOT EXISTS invoice_pdf_url text;

-- Add payment PDF URL column  
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_pdf_url text;