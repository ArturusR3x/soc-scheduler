-- Members table
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  "group" VARCHAR(20),
  password VARCHAR(100)
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_type INTEGER NOT NULL, -- 1, 2, 3, or 0 for off
  UNIQUE(member_id, shift_date)
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL,
  shift_type INTEGER,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Replies to notes
CREATE TABLE IF NOT EXISTS replies (
  id SERIAL PRIMARY KEY,
  note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  shift_type INTEGER,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
