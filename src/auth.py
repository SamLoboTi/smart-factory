import hashlib
import secrets

class AuthManager:
    def __init__(self, db_manager):
        self.db = db_manager

    def hash_password(self, password, salt=None):
        """Hashes a password using PBKDF2-HMAC-SHA256 with a salt."""
        if not salt:
            salt = secrets.token_hex(16)
        # Simple sha256 with salt, 100k iterations
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return salt, key.hex()
    
    def verify_password(self, stored_salt, stored_hash, password):
        """Verifies a password against the stored hash and salt."""
        _, key = self.hash_password(password, stored_salt)
        return key == stored_hash

    def register_user(self, username, password, role='user'):
        """Registers a new user."""
        salt, password_hash = self.hash_password(password)
        self.db.create_user(username, password_hash, salt, role)

    def login(self, username, password):
        """
        Attemps to login. 
        Returns user dict if successful, None otherwise.
        """
        user = self.db.get_user_by_username(username)
        if not user:
            return None
        
        stored_hash = user['password_hash']
        stored_salt = user['salt']
        
        if self.verify_password(stored_salt, stored_hash, password):
            return user
        return None

    def check_permission(self, user, required_role):
        """
        Checks if the user has the required role.
        Hierarchy: admin > user
        """
        if not user: 
            return False
            
        user_role = user.get('role', 'user')
        
        if required_role == 'admin' and user_role != 'admin':
            return False
            
        return True
