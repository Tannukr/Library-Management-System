from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_security import UserMixin, RoleMixin

db = SQLAlchemy()

class RolesUsers(db.Model):
    __tablename__ = 'roles_users'
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column('user_id', db.Integer(), db.ForeignKey('user.id'))
    role_id = db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True)
    email = db.Column(db.String, unique=True)
    password = db.Column(db.String(255))
    active = db.Column(db.Boolean())
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False)
    ratings = db.relationship('Rating', backref='user', lazy=True)
    roles = db.relationship('Role', secondary='roles_users',
                            backref=db.backref('users', lazy='dynamic'))
                        

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

class Section(db.Model):
    __tablename__ = 'section'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String, nullable=False, unique=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    description = db.Column(db.String)
    #book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    books = db.relationship("Book", back_populates="section")

    def __repr__(self):
        return f"<Section {self.name}>"


class Book(db.Model):
    __tablename__ = 'books'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)
    content = db.Column(db.String, nullable=False)
    author = db.Column(db.String, nullable=False)
    unit=db.Column(db.Integer(),nullable=False)
    section_id = db.Column(db.Integer, db.ForeignKey('section.id'),nullable=False)  # Corrected here
    section = db.relationship("Section", back_populates="books")
    #ratings = db.relationship('Rating', back_populates='book')
    ratings = db.relationship('Rating', backref='book', lazy=True)

class Book_Request(db.Model):
    __tablename__ ="book_request"
    b_id = db.Column(db.Integer, primary_key=True)
    book_name = db.Column(db.String, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    date_issued = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    return_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    is_approved = db.Column(db.Boolean(), nullable=True, default=None)
    #user = db.relationship('User', backref=db.backref('book_requests', lazy=True))
    
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    read = db.Column(db.Boolean, default=False)


class Rating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    value = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)  # Corrected here
    book_id = db.Column(db.Integer, db.ForeignKey('books.id', ondelete='CASCADE'), nullable=False)
