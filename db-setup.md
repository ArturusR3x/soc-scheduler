# PostgreSQL Setup for SOC Scheduler

## 1. Install PostgreSQL
- Download and install from https://www.postgresql.org/download/
- Start the PostgreSQL service.

## 2. Create Database and User
Open a terminal and run:
```sh
psql -U postgres
```
Then in the psql prompt:
```sql
CREATE DATABASE soc_scheduler;
CREATE USER soc_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE soc_scheduler TO soc_user;
```

## 3. Apply Schema
Exit psql and run:
```sh
psql -U soc_user -d soc_scheduler -f db-schema.sql
```
Or, inside psql:
```sql
\c soc_scheduler
-- Paste the contents of db-schema.sql here
```

## 3a. Add Group Column and Insert Initial Users
First, add a group column to the members table:
```sql
ALTER TABLE members ADD COLUMN "group" VARCHAR(20);
```

Then, insert the users with their default group:
```sql
INSERT INTO members (name, "group") VALUES
  ('Basuki Rachmad', 'NORTH'),
  ('Lexiandy Kuswandana', 'SOUTH'),
  ('Hansel Daniel Susanto', 'SOUTH'),
  ('Febrian Sulistyono', 'NORTH'),
  ('Ni Made Meliana Listyawati', 'NORTH'),
  ('Zachrun Puady Thahir', 'SOUTH'),
  ('Hafidz Jaelani', 'BACKEND'),
  ('Arthur Jeremy', 'BACKEND'),
  ('Andika Kusriyanto', 'BACKEND');
```

## 3b. Allow Group Change via Web
- The web app should provide a UI for users to request/change their group.
- The backend should have an API endpoint (see previous instructions) to update the "group" column for a member.
- Changes will be reflected in the database and can be used for scheduling, filtering, etc.

## 4. Connection String Example
```
postgresql://soc_user:admin123@localhost:5432/soc_scheduler
```

## 5. Backend Setup: Install Dependencies
Run this in your project folder:
```sh
npm install express pg
```

## 6. Next Steps
- Use this connection string in your backend (Node.js, Python, etc.).
- Let me know if you need backend code to connect and use the database!

## 7. How to Check Your Database Data

To view the data in your tables, use the psql command line:

```sh
psql -U soc_user -d soc_scheduler
```

Then, inside the psql prompt, run:

```sql
-- List all tables
\dt

-- View all members
SELECT * FROM members;

-- View all shifts
SELECT * FROM shifts;

-- View all notes
SELECT * FROM notes;
```

You can use similar SELECT queries for other tables.  
Type `\q` to exit psql.

## 8. How to Make the Backend Reachable to the Database

- Make sure your backend uses the correct connection string:
  ```
  postgresql://soc_user:admin123@localhost:5432/soc_scheduler
  ```
- The database server (`postgres`) must be running.
- The backend server and database should be on the same machine or network.
- Your backend code should use a PostgreSQL client library (like `pg` for Node.js) and connect using the connection string above.

**Example (Node.js):**
```js
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: 'postgresql://soc_user:admin123@localhost:5432/soc_scheduler'
});
```

- If you get connection errors, check:
  - PostgreSQL is running (`sudo service postgresql status` or `pg_ctl status`)
  - The user/password/database are correct
  - The port (5432) is open and not blocked by firewall
  - Your backend dependencies are installed (`npm install pg`)

## 9. How to Use the Connection String

- You should put the connection string directly into your backend code when creating the database client.

**Example (Node.js/Express):**
```js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://soc_user:admin123@localhost:5432/soc_scheduler'
});

// Now use pool to query the database
const result = await pool.query('SELECT * FROM members');
```

- You do **not** run the connection string separately; it is used by your backend code to connect to PostgreSQL.

- For security and flexibility, you can also store the connection string in an environment variable (e.g., `.env` file) and read it in your code:
```js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```
Then set `DATABASE_URL=postgresql://soc_user:admin123@localhost:5432/soc_scheduler` in your environment.

## Do I Need a Database Config File?

- **Not required**, but recommended for maintainability and security.
- You can put your PostgreSQL connection string directly in your backend code (as you do now).
- For production or team projects, create a config file (e.g. `.env` or `db.config.js`) to store your database credentials and import them in your backend code.

**Example using .env file:**
```
DATABASE_URL=postgresql://soc_user:admin123@localhost:5432/soc_scheduler
```

**Example usage in backend code:**
```js
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

- This keeps your credentials out of source code and makes it easier to change environments.

## Troubleshooting: pg_ctl: no database directory specified and environment variable PGDATA unset

- This error means PostgreSQL does not know where your data directory is.
- To fix, you need to specify the data directory or set the PGDATA environment variable.

**How to check status with PGDATA:**
```sh
# Example: if your data directory is at C:\Program Files\PostgreSQL\15\data
pg_ctl status -D "C:\Program Files\PostgreSQL\15\data"
```

**Or set PGDATA environment variable:**
```sh
# Windows (PowerShell)
$env:PGDATA="C:\Program Files\PostgreSQL\15\data"
pg_ctl status

# Windows (cmd)
set PGDATA=C:\Program Files\PostgreSQL\15\data
pg_ctl status
```

- Replace the path with your actual PostgreSQL data directory.
- You can find your data directory in your PostgreSQL installation or by checking your `postgresql.conf` file.
