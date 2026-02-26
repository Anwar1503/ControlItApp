"""
Setup script to initialize email credentials in MongoDB
Run this once to:
1. Generate encryption key
2. Store email credentials in database

Usage:
    python setup_email_credentials.py
"""

from pymongo import MongoClient
from cryptography.fernet import Fernet
import os
from getpass import getpass

def generate_encryption_key():
    """Generate a new Fernet encryption key"""
    key = Fernet.generate_key().decode()
    print("\n✓ Generated Encryption Key:")
    print(f"  {key}")
    print("\nAdd this to your .env file:")
    print(f"  ENCRYPTION_KEY={key}")
    return key


def setup_credentials(encryption_key=None):
    """Setup email credentials in MongoDB"""
    
    # Get MongoDB connection
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    print(f"\nConnecting to MongoDB at {MONGODB_URI}...")
    
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Verify connection
        client.admin.command('ping')
        print("✓ Connected to MongoDB")
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {e}")
        return False
    
    db = client["user_database"]
    credentials_collection = db["email_credentials"]
    
    # Get email and password from user
    print("\n=== Email Credentials Setup ===")
    email = input("Enter your Gmail address: ").strip()
    password = getpass("Enter your Gmail app password (won't be displayed): ")
    
    if not email or not password:
        print("✗ Email and password are required")
        return False
    
    # Get encryption key
    if not encryption_key:
        encryption_key = os.getenv('ENCRYPTION_KEY')
        if not encryption_key:
            print("\n! ENCRYPTION_KEY not found in .env")
            print("Generating a new one...")
            encryption_key = generate_encryption_key()
            print("\nPlease add this key to your .env file and run this script again.")
            return False
    
    try:
        # Encrypt password
        cipher = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
        encrypted_password = cipher.encrypt(password.encode()).decode('utf-8')
        
        # Store in database
        credential_data = {
            "type": "smtp",
            "email": email,
            "password": encrypted_password
        }
        
        # Check if credentials already exist
        existing = credentials_collection.find_one({"type": "smtp"})
        if existing:
            credentials_collection.update_one(
                {"type": "smtp"},
                {"$set": credential_data}
            )
            print("✓ Email credentials updated in database")
        else:
            credentials_collection.insert_one(credential_data)
            print("✓ Email credentials stored in database")
        
        print("\n=== Setup Complete ===")
        print("✓ Your email credentials are now stored securely in MongoDB")
        print("✓ Remove EMAIL_ADDRESS and EMAIL_PASSWORD from .env file")
        print("✓ Keep MONGO_URI and ENCRYPTION_KEY in .env")
        
        return True
    
    except Exception as e:
        print(f"✗ Error storing credentials: {e}")
        return False


if __name__ == "__main__":
    import sys
    
    print("=" * 50)
    print("Email Credentials Setup for Time-Based Break App")
    print("=" * 50)
    
    # Check if ENCRYPTION_KEY exists
    encryption_key = os.getenv('ENCRYPTION_KEY')
    
    if not encryption_key:
        print("\n! ENCRYPTION_KEY not found in environment")
        choice = input("\nDo you want to generate a new encryption key? (y/n): ").strip().lower()
        
        if choice == 'y':
            encryption_key = generate_encryption_key()
            proceed = input("\nHave you added the ENCRYPTION_KEY to your .env? (y/n): ").strip().lower()
            if proceed != 'y':
                print("Please add the key to .env and run this script again.")
                sys.exit(1)
        else:
            print("Please generate an encryption key first.")
            print("Python: from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
            sys.exit(1)
    
    # Setup credentials
    success = setup_credentials(encryption_key)
    sys.exit(0 if success else 1)
