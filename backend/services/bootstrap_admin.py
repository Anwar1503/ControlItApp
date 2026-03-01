##creating a admin user on first basis

import os
import bcrypt
from datetime import datetime

def bootstrap_admin(users_collection, logger):
    logger.warning("BOOTSTRAP FUNCTION ENTERED")

    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        logger.error("Admin bootstrap failed: missing ENV vars")
        return

    admin_exists = users_collection.count_documents({"role": "admin"}) > 0
    if admin_exists:
        logger.info("Admin already exists. Bootstrap skipped.")
        return

    hashed_pw = bcrypt.hashpw(
        admin_password.encode(),
        bcrypt.gensalt()
    ).decode()

    users_collection.insert_one({
        "email": admin_email.lower(),
        "password": hashed_pw,
        "role": "admin",
        "created_at": datetime.utcnow()
    })

    logger.info("Admin user created successfully: %s", admin_email)

