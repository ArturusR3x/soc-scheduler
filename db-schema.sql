-- Members table
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- Shift schedule table
CREATE TABLE shifts (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_type INTEGER NOT NULL, -- 1, 2, 3, or 0 for off
  UNIQUE(member_id, shift_date)
);

-- Notes table
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  client VARCHAR(100),
  shift_type INTEGER,
  event_name VARCHAR(200),
  src_ip VARCHAR(50),
  dst_ip VARCHAR(50),
  hostname VARCHAR(100),
  description TEXT,
  action TEXT,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Replies table (for note replies)
CREATE TABLE replies (
  id SERIAL PRIMARY KEY,
  note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  shift_type INTEGER,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
