# MySQL Setup Guide for Sound360

## 🐬 MySQL Installation and Configuration

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

#### Step 2: Create Docker Compose for MySQL
Create `backend-api/docker-compose-mysql.yml`:

```yaml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: sound360_mysql
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: sound360_db
      MYSQL_USER: sound360
      MYSQL_PASSWORD: sound360
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql_init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    command: --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 30s
      timeout: 10s
      retries: 3

  # phpMyAdmin for database management
  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    container_name: sound360_phpmyadmin
    environment:
      PMA_HOST: mysql
      PMA_USER: sound360
      PMA_PASSWORD: sound360
      MYSQL_ROOT_PASSWORD: root123
    ports:
      - "8080:80"
    depends_on:
      - mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

#### Step 3: Start MySQL with Docker
```bash
cd backend-api

# Start MySQL and phpMyAdmin
docker-compose -f docker-compose-mysql.yml up -d

# Check if containers are running
docker-compose -f docker-compose-mysql.yml ps
```

#### Step 4: Verify Database Setup
```bash
# Check MySQL logs
docker-compose -f docker-compose-mysql.yml logs mysql

# Connect to database
docker exec -it sound360_mysql mysql -u sound360 -psound360 sound360_db

# In MySQL shell, check tables:
SHOW TABLES;
SELECT * FROM users;
EXIT;
```

### Option 2: Manual MySQL Installation

#### Ubuntu/Debian
```bash
# Install MySQL
sudo apt update
sudo apt install mysql-server

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure installation
sudo mysql_secure_installation

# Create user and database
sudo mysql -u root -p
CREATE DATABASE sound360_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sound360'@'localhost' IDENTIFIED BY 'sound360';
GRANT ALL PRIVILEGES ON sound360_db.* TO 'sound360'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### macOS
```bash
# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Create user and database
mysql -u root -p
CREATE DATABASE sound360_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sound360'@'localhost' IDENTIFIED BY 'sound360';
GRANT ALL PRIVILEGES ON sound360_db.* TO 'sound360'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Windows
1. Download MySQL from https://dev.mysql.com/downloads/mysql/
2. Install with default settings
3. Open MySQL Workbench or command line and run:
```sql
CREATE DATABASE sound360_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sound360'@'localhost' IDENTIFIED BY 'sound360';
GRANT ALL PRIVILEGES ON sound360_db.* TO 'sound360'@'localhost';
FLUSH PRIVILEGES;
```

## 🔧 Database Setup

### Step 1: Install Python MySQL Dependencies
```bash
cd backend-api

# Install Python dependencies
pip install PyMySQL cryptography

# Or install all requirements
pip install -r requirements.txt
```

### Step 2: Run Database Setup Script
```bash
# Run MySQL database setup
python mysql_setup.py
```

### Step 3: Verify Setup
```bash
# Test database connection
python -c "
from mysql_setup import test_mysql_connection
test_mysql_connection()
"
```

## 🌐 Access Database

### Using phpMyAdmin (Web Interface)
- **URL**: http://localhost:8080
- **Username**: sound360
- **Password**: sound360

### Using MySQL Command Line
```bash
# Connect to database
mysql -u sound360 -psound360 sound360_db

# List tables
SHOW TABLES;

# Check users
SELECT * FROM users;

# Check conversations
SELECT COUNT(*) FROM conversations;
```

### Using Sound360 Database Admin Panel
- **URL**: http://localhost:5173/database
- **Access**: Administrator role required
- **Features**: 
  - Browse all tables
  - Execute custom SQL queries
  - Search and filter data
  - Export data
  - Real-time table statistics

## 🔍 Troubleshooting

### Connection Issues
```bash
# Check if MySQL is running
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS

# Check if port 3306 is open
netstat -tulpn | grep :3306

# Test connection
telnet localhost 3306
```

### Permission Issues
```bash
# Grant all permissions to sound360 user
mysql -u root -p
GRANT ALL PRIVILEGES ON sound360_db.* TO 'sound360'@'localhost';
FLUSH PRIVILEGES;
```

### Docker Issues
```bash
# Restart containers
docker-compose -f docker-compose-mysql.yml down
docker-compose -f docker-compose-mysql.yml up -d

# Check container logs
docker-compose -f docker-compose-mysql.yml logs mysql
```

## 📊 Default Data

The setup creates:
- **Default admin user**: admin@sound360.local
- **Sample users** for testing (Manager, Supervisor, Agent, Analyst)
- **All required tables** with proper indexes
- **UTF8MB4 encoding** for full Unicode support including emojis

## 🔐 Security Notes

For production:
1. Change default passwords
2. Use environment variables for credentials
3. Enable SSL connections
4. Configure firewall rules
5. Set up backup procedures
6. Restrict database admin panel access

## 📈 Performance Optimization

### MySQL Configuration
Add to `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
query_cache_size = 64M
query_cache_type = 1
```

### Indexing
The setup automatically creates indexes for:
- User emails and roles
- Conversation timestamps and session IDs
- System metrics timestamps
- Foreign key relationships

The MySQL database is now ready for Sound360 operations with a built-in admin panel!