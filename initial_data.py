from main import  app
from application.sec import datastore
from application.models import db, Role
from flask_security import hash_password
from werkzeug.security import generate_password_hash

with app.app_context():
    db.create_all()
       
    # Create roles if they don't exist
    if not datastore.find_role("admin"):
        datastore.create_role(name="admin", description="User is an admin")
    if not datastore.find_role("user"):
        datastore.create_role(name="user", description="User is a user")
    
    db.session.commit()

    # Create users if they don't exist
    if not datastore.find_user(email="admin@gmail.com"):
        datastore.create_user(email="admin@gmail.com", password=generate_password_hash("admin"), roles=["admin"])
    if not datastore.find_user(email="user1@gmail.com"):  # Fixed typo here
        datastore.create_user(email="user1@gmail.com", password=generate_password_hash("user1"), roles=["user"])
    # if not datastore.find_user(email="user2@gmail.com"):  # Fixed typo here
    #     datastore.create_user(email="user1@gmail.com", password=generate_password_hash("user1"), roles=["user"],active=False)


    db.session.commit()
