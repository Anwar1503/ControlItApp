"""
Secure Email Credentials Management Service
Stores and retrieves email credentials from MongoDB with encryption
Uses class-based architecture for better organization and maintainability
"""
from pymongo import MongoClient
from cryptography.fernet import Fernet
import os
from typing import Tuple, Dict, Optional
from .logger_service import setup_logger


class EmailCredentialService:
    """Service for managing email credentials with encryption"""

    def __init__(self):
        """Initialize the email credential service with MongoDB and encryption"""
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        self.client = MongoClient(self.mongodb_uri)
        self.db = self.client["user_database"]
        self.credentials_collection = self.db["email_credentials"]
        self.logger = setup_logger("EmailCredentialService-backend")
        
        # Initialize encryption
        self.encryption_key = self._initialize_encryption_key()
        self.cipher = Fernet(self.encryption_key)
        
        # Initialize database
        self._init_credentials_db()

    def _initialize_encryption_key(self) -> bytes:
        """
        Initialize encryption key from environment or generate a new one
        
        Returns:
            bytes: Encryption key for Fernet cipher
        """
        encryption_key = os.getenv('ENCRYPTION_KEY')
        
        if not encryption_key:
            self.logger.warning("ENCRYPTION_KEY not found in environment variables!")
            self.logger.warning("Generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'")
            encryption_key = Fernet.generate_key()
        else:
            encryption_key = encryption_key.encode() if isinstance(encryption_key, str) else encryption_key
        
        return encryption_key

    def _encrypt_password(self, password: str) -> str:
        """
        Encrypt a password using Fernet symmetric encryption
        
        Args:
            password (str): Plain text password to encrypt
            
        Returns:
            str: Encrypted password
        """
        try:
            encrypted = self.cipher.encrypt(password.encode()).decode('utf-8')
            self.logger.debug("Password encrypted successfully")
            return encrypted
        except Exception as e:
            self.logger.error(f"Error encrypting password: {str(e)}")
            raise

    def _decrypt_password(self, encrypted_password: str) -> Optional[str]:
        """
        Decrypt an encrypted password
        
        Args:
            encrypted_password (str): Encrypted password to decrypt
            
        Returns:
            str: Decrypted password or None if decryption fails
        """
        try:
            decrypted = self.cipher.decrypt(encrypted_password.encode()).decode('utf-8')
            self.logger.debug("Password decrypted successfully")
            return decrypted
        except Exception as e:
            self.logger.error(f"Error decrypting password: {str(e)}")
            return None

    def _init_credentials_db(self) -> None:
        """Initialize credentials collection with proper indexes"""
        try:
            self.credentials_collection.create_index("type", unique=True)
            self.logger.info("Credentials database initialized successfully")
        except Exception as e:
            self.logger.error(f"Error initializing credentials db: {str(e)}")

    def store_email_credentials(self, email: str, password: str) -> Dict[str, str]:
        """
        Store email credentials in MongoDB with encrypted password
        
        Args:
            email (str): Email address
            password (str): Email password (will be encrypted)
        
        Returns:
            dict: Status and message
            {
                "status": "success" or "error",
                "message": "Description of the result"
            }
        """
        try:
            # Validate inputs
            if not email or not password:
                return {"status": "error", "message": "Email and password are required"}
            
            # Check if credentials already exist
            existing = self.credentials_collection.find_one({"type": "smtp"})
            
            # Encrypt the password
            encrypted_password = self._encrypt_password(password)
            
            credential_data = {
                "type": "smtp",
                "email": email,
                "password": encrypted_password
            }
            
            if existing:
                # Update existing credentials
                self.credentials_collection.update_one(
                    {"type": "smtp"},
                    {"$set": credential_data}
                )
                self.logger.info(f"Email credentials updated for: {email}")
                return {"status": "success", "message": "Email credentials updated successfully"}
            else:
                # Create new credentials
                self.credentials_collection.insert_one(credential_data)
                self.logger.info(f"Email credentials stored for: {email}")
                return {"status": "success", "message": "Email credentials stored successfully"}
        
        except Exception as e:
            self.logger.error(f"Failed to store credentials: {str(e)}")
            return {"status": "error", "message": f"Failed to store credentials: {str(e)}"}

    def get_email_credentials(self) -> Tuple[Optional[str], Optional[str]]:
        """
        Retrieve email credentials from MongoDB (decrypted)
        
        Returns:
            tuple: (email, decrypted_password) or (None, None) if not found
        """
        try:
            creds = self.credentials_collection.find_one({"type": "smtp"})
            if creds:
                email = creds['email']
                password = self._decrypt_password(creds['password'])
                self.logger.debug(f"Credentials retrieved for: {email}")
                return email, password
            
            self.logger.debug("No email credentials found in database")
            return None, None
        
        except Exception as e:
            self.logger.error(f"Error retrieving credentials: {str(e)}")
            return None, None

    def get_email_password(self) -> Optional[str]:
        """
        Retrieve only the decrypted password from stored credentials
        
        Returns:
            str: Decrypted password or None if not found
        """
        try:
            creds = self.credentials_collection.find_one({"type": "smtp"})
            if creds:
                password = self._decrypt_password(creds['password'])
                self.logger.debug("Email password retrieved successfully")
                return password
            
            self.logger.debug("No email password found in database")
            return None
        
        except Exception as e:
            self.logger.error(f"Error retrieving password: {str(e)}")
            return None

    def get_email_address(self) -> Optional[str]:
        """
        Retrieve only the email address from stored credentials
        
        Returns:
            str: Email address or None if not found
        """
        try:
            creds = self.credentials_collection.find_one({"type": "smtp"})
            if creds:
                email = creds['email']
                self.logger.debug("Email address retrieved successfully")
                return email
            
            self.logger.debug("No email address found in database")
            return None
        
        except Exception as e:
            self.logger.error(f"Error retrieving email address: {str(e)}")
            return None

    def delete_email_credentials(self) -> Dict[str, str]:
        """
        Delete stored email credentials from MongoDB
        
        Returns:
            dict: Status and message
        """
        try:
            result = self.credentials_collection.delete_one({"type": "smtp"})
            
            if result.deleted_count > 0:
                self.logger.info("Email credentials deleted successfully")
                return {"status": "success", "message": "Email credentials deleted successfully"}
            else:
                self.logger.debug("No email credentials found to delete")
                return {"status": "info", "message": "No email credentials found to delete"}
        
        except Exception as e:
            self.logger.error(f"Error deleting credentials: {str(e)}")
            return {"status": "error", "message": f"Failed to delete credentials: {str(e)}"}

    def credentials_exist(self) -> bool:
        """
        Check if email credentials are stored
        
        Returns:
            bool: True if credentials exist, False otherwise
        """
        try:
            creds = self.credentials_collection.find_one({"type": "smtp"})
            exists = creds is not None
            self.logger.debug(f"Credentials exist: {exists}")
            return exists
        
        except Exception as e:
            self.logger.error(f"Error checking credentials existence: {str(e)}")
            return False

    def close_connection(self) -> None:
        """Close MongoDB connection"""
        try:
            self.client.close()
            self.logger.info("MongoDB connection closed")
        except Exception as e:
            self.logger.error(f"Error closing MongoDB connection: {str(e)}")


# Singleton instance for backward compatibility
_email_credential_service = None


def get_email_credential_service() -> EmailCredentialService:
    """
    Get or create a singleton instance of EmailCredentialService
    
    Returns:
        EmailCredentialService: Singleton instance
    """
    global _email_credential_service
    if _email_credential_service is None:
        _email_credential_service = EmailCredentialService()
    return _email_credential_service


# Legacy function interface for backward compatibility
def store_email_credentials(email: str, password: str) -> Dict[str, str]:
    """Legacy function interface"""
    return get_email_credential_service().store_email_credentials(email, password)


def get_email_credentials() -> Tuple[Optional[str], Optional[str]]:
    """Legacy function interface"""
    return get_email_credential_service().get_email_credentials()


def decrypt_email_password() -> Optional[str]:
    """Legacy function interface"""
    return get_email_credential_service().get_email_password()


def init_credentials_db() -> None:
    """Legacy function interface"""
    get_email_credential_service()._init_credentials_db()