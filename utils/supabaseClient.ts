
import { createClient } from '@supabase/supabase-js';

// Note: The key provided 'rvddbgirgevteifjjjud' appears to be a project reference rather than an API key.
// In a production environment, ensure you are using the 'anon' public API key (starts with 'ey...').
// However, per instructions, using the provided strings.
const supabaseUrl = 'https://rvddbgirgevteifjjjud.supabase.co';
const supabaseKey = 'sb_publishable_s4U5py44CncLoJmNOPxFKA_JHACcSlQ';

export const supabase = createClient(supabaseUrl, supabaseKey);

/*
  Expected Database Schema:
  
  Table: stock
  - id (text, primary key)
  - itemCode (text)
  - pcs (numeric/int)
  - kgs (numeric)
  - expiryDate (text/date)
  - location (text)
  - entryDate (text/timestamptz)

  Table: transactions
  - id (text, primary key)
  - type (text)
  - item (jsonb) - Stores the full StockItem object
  - timestamp (text/timestamptz)
  - fromLocation (text, nullable)
  - toLocation (text, nullable)
  - username (text)

  Table: users
  - username (text, primary key)
  - password (text)
  - role (text)

  Table: item_codes
  - code (text, primary key)
*/
