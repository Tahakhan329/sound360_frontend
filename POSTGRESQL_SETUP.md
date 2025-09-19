# PostgreSQL Setup Guide for Sound360

## 🐘 PostgreSQL Installation and Configuration

### Option 1: Using Docker (Recommended)

#### Step 1: Install Docker
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# macOS
brew install docker docker-compose

# Windows
# Download Docker Desktop from https://www.docker.com/products/docker-desktop
```

#### Step 2: Start PostgreSQL with Docker
```bash
cd backend-api

# Start PostgreSQL and pgAdmin
docker-compose up -d

# Check if containers are running
docker-compose ps
```

#### Step 3: Verify Database Setup
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Connect to database
docker exec -it sound360_postgres psql -U sound360 -d sound360_db

# In PostgreSQL shell, check tables:
\dt
SELECT * FROM users;
\q
```

### Option 2: Manual PostgreSQL Installation

#### Ubuntu/Debian
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres psql
CREATE ROLE sound360 WITH LOGIN PASSWORD 'sound360';
ALTER ROLE sound360 CREATEDB;
CREATE DATABASE sound360_db OWNER sound360;
GRANT ALL PRIVILEGES ON DATABASE sound360_db TO sound360;
\q
```

#### macOS
```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create user and database
psql postgres
CREATE ROLE sound360 WITH LOGIN PASSWORD 'sound360';
ALTER ROLE sound360 CREATEDB;
CREATE DATABASE sound360_db OWNER sound360;
GRANT ALL PRIVILEGES ON DATABASE sound360_db TO sound360;
\q
```

#### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Open pgAdmin or psql and run:
```sql
CREATE ROLE sound360 WITH LOGIN PASSWORD 'sound360';
ALTER ROLE sound360 CREATEDB;
CREATE DATABASE sound360_db OWNER sound360;
GRANT ALL PRIVILEGES ON DATABASE sound360_db TO sound360;
```

## 🔧 Database Setup

### Step 1: Run Database Setup Script
```bash
cd backend-api

# Install Python dependencies first
pip install -r requirements.txt

# Run database setup
python database_setup.py
```

### Step 2: Verify Setup
```bash
# Test database connection
python -c "
from database_setup import test_database_connection
test_database_connection()
"
```

## 🌐 Access Database

### Using pgAdmin (Web Interface)
- **URL**: http://localhost:8080
- **Email**: admin@sound360.local
- **Password**: admin123

### Using Command Line
```bash
# Connect to database
psql postgresql://sound360:sound360@localhost:5432/sound360_db

# List tables
\dt

# Check users
SELECT * FROM users;

# Check conversations
SELECT COUNT(*) FROM conversations;
```

## 🔍 Troubleshooting

### Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# Check if port 5432 is open
netstat -tulpn | grep :5432

# Test connection
telnet localhost 5432
```

### Permission Issues
```bash
# Grant all permissions to sound360 user
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE sound360_db TO sound360;
\c sound360_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sound360;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sound360;
```

### Docker Issues
```bash
# Restart containers
docker-compose down
docker-compose up -d

# Check container logs
docker-compose logs postgres
```

## 📊 Default Data

The setup creates:
- **Default admin user**: admin@sound360.local
- **Sample users** for testing (Manager, Supervisor, Agent, Analyst)
- **All required tables** with proper indexes
- **Triggers** for automatic timestamp updates

## 🔐 Security Notes

For production:
1. Change default passwords
2. Use environment variables for credentials
3. Enable SSL connections
4. Configure firewall rules
5. Set up backup procedures

The database is now ready for Sound360 operations!