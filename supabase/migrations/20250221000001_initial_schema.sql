CREATE TABLE IF NOT EXISTS states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

INSERT INTO states (code, name) VALUES
  ('AL', 'Alabama'),
  ('KY', 'Kentucky'),
  ('MA', 'Massachusetts'),
  ('MN', 'Minnesota'),
  ('NJ', 'New Jersey'),
  ('NV', 'Nevada'),
  ('OR', 'Oregon'),
  ('SC', 'South Carolina'),
  ('TX', 'Texas'),
  ('WA', 'Washington')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state_id UUID NOT NULL REFERENCES states(id),
  education_level TEXT NOT NULL,
  internet_access BOOLEAN NOT NULL,
  certifications BOOLEAN NOT NULL,
  agreement BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_state ON users(state_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  state_id UUID REFERENCES states(id)
);

CREATE INDEX IF NOT EXISTS idx_offers_state ON offers(state_id);

CREATE TABLE IF NOT EXISTS user_offers (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, offer_id)
);

CREATE INDEX IF NOT EXISTS idx_user_offers_user ON user_offers(user_id);

INSERT INTO offers (name, description, image_url, state_id)
SELECT 'National Discount Card', 'Save at participating retailers nationwide.', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM offers LIMIT 1);
INSERT INTO offers (name, description, image_url, state_id)
SELECT 'Texas State Benefit', 'Exclusive benefits for Texas residents.', NULL, (SELECT id FROM states WHERE code = 'TX' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM offers WHERE name = 'Texas State Benefit' LIMIT 1);
INSERT INTO offers (name, description, image_url, state_id)
SELECT 'Washington State Program', 'Program for Washington residents.', NULL, (SELECT id FROM states WHERE code = 'WA' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM offers WHERE name = 'Washington State Program' LIMIT 1);
