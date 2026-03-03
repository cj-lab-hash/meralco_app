-- A) Dedicated schema for this second app
CREATE SCHEMA IF NOT EXISTS meralco_app;

-- B) (Optional but recommended) App-specific user
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'meralco_user') THEN
    CREATE USER meralco_user WITH PASSWORD 'change_this_password';
  END IF;
END $$;

GRANT USAGE ON SCHEMA meralco_app TO meralco_user;
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA meralco_app TO meralco_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA meralco_app TO meralco_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA meralco_app GRANT ALL ON TABLES    TO meralco_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA meralco_app GRANT ALL ON SEQUENCES TO meralco_user;

-- C) Your app's table (aligned to current code)
-- NOTE: You’re currently using a column literally named "date".
-- We'll keep it (quoted) so your existing rendering logic works.
CREATE TABLE IF NOT EXISTS meralco_app.records (
  id                SERIAL PRIMARY KEY,
  actual_bill       NUMERIC,
  total_consumption NUMERIC,
  rate              NUMERIC,
  current_reading   NUMERIC,
  previous_reading  NUMERIC,
  gen_previous      NUMERIC,
  gen_current       NUMERIC,
  gen_consumption   NUMERIC,
  gen_bill          NUMERIC,
  jm_bill           NUMERIC,
  "date"            TEXT
);