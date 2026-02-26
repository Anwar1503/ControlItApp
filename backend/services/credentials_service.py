"""
Secure Email Credentials Management Service
Stores and retrieves email credentials from MongoDB with encryption
"""
from pymongo import MongoClient
from cryptography.fernet import Fernet
import os

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGODB_URI)
db = client["user_database"]
credentials_collection = db["email_credentials"]

# Encryption key from environment variable
# To generate a new key: from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')

if not ENCRYPTION_KEY:
    print("WARNING: ENCRYPTION_KEY not found in environment variables!")
    print("Generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'")
    ENCRYPTION_KEY = Fernet.generate_key()
else:
    ENCRYPTION_KEY = ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY

cipher = Fernet(ENCRYPTION_KEY)


def encrypt_password(password):
    """Encrypt a password using Fernet symmetric encryption"""
    return cipher.encrypt(password.encode()).decode('utf-8')


def decrypt_password(encrypted_password):
    """Decrypt an encrypted password"""
    try:
        return cipher.decrypt(encrypted_password.encode()).decode('utf-8')
    except Exception as e:
        print(f"Error decrypting password: {str(e)}")
        return None


def store_email_credentials(email, password):
    """
    Store email credentials in MongoDB with encrypted password
    
    Args:
        email (str): Email address
        password (str): Email password (will be encrypted)
    
    Returns:
        dict: Status and message
    """
    try:
        # Check if credentials already exist
        existing = credentials_collection.find_one({"type": "smtp"})
        
        encrypted_password = encrypt_password(password)
        
        credential_data = {
            "type": "smtp",
            "email": email,
            "password": encrypted_password
        }
        
        if existing:
            # Update existing credentials
            credentials_collection.update_one(
                {"type": "smtp"},
                {"$set": credential_data}
            )
            return {"status": "success", "message": "Email credentials updated successfully"}
        else:
            # Create new credentials
            credentials_collection.insert_one(credential_data)
            return {"status": "success", "message": "Email credentials stored successfully"}
    
    except Exception as e:
        return {"status": "error", "message": f"Failed to store credentials: {str(e)}"}


def get_email_credentials():
    """
    Retrieve email credentials from MongoDB (decrypted)
    
    Returns:
        tuple: (email, decrypted_password) or (None, None) if not found
    """
    try:
        creds = credentials_collection.find_one({"type": "smtp"})
        if creds:
            email = creds['email']
            password = decrypt_password(creds['password'])
            return email, password
        return None, None
    except Exception as e:
        print(f"Error retrieving credentials: {str(e)}")
        return None, None


def decrypt_email_password():
    """
    Retrieve only the decrypted password from stored credentials
    
    Returns:
        str: Decrypted password or None if not found
    """
    try:
        creds = credentials_collection.find_one({"type": "smtp"})
        if creds:
            return decrypt_password(creds['password'])
        return None
    except Exception as e:
        print(f"Error retrieving password: {str(e)}")
        return None


# Initialize credentials collection with indexes
def init_credentials_db():
    """Initialize credentials collection with proper indexes"""
    try:
        credentials_collection.create_index("type", unique=True)
        print("Credentials database initialized")
    except Exception as e:
        print(f"Error initializing credentials db: {str(e)}")
