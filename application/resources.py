from flask_restful import Resource, Api, reqparse, fields, marshal_with, marshal,request
from flask_security import auth_required, roles_accepted, current_user, roles_required
from werkzeug.security import generate_password_hash
from flask import jsonify
from datetime import datetime
from .models import *
from .sec import *
from .instances import cache

api = Api(prefix='/api')

parser_user = reqparse.RequestParser()
parser_user.add_argument('name', type=str, help='Name is required and should be a string', required=True)
parser_user.add_argument('email', type=str, help='Email should be a string', required=True)
parser_user.add_argument('password', type=str, help='Password should be a string', required=True)

class UserRegistrationResource(Resource):
    def post(self):
        data = parser_user.parse_args()
        
        existing_user = User.query.filter_by(email=data.get('email')).first()
        if existing_user:
            return {'message': 'Email is already registered'}, 400

        new_user = datastore.create_user(
            username=data.get('name'),
            email=data.get('email'),
            password=generate_password_hash(data.get('password')),
            active=True
        )
        print(new_user.username)
        datastore.add_role_to_user(new_user, 'user')
        db.session.commit()
        return {'message': 'User registered successfully'}, 201

api.add_resource(UserRegistrationResource, '/user-registration')

parser_parser = reqparse.RequestParser()
parser_parser.add_argument('name', type=str, help='Name is required and should be a string', required=True)
parser_parser.add_argument('description', type=str, help='Description is required and should be a string', required=True)
parser_parser.add_argument('date_created', type=str, help='Date Created is required and should be a string', required=True)

# Define fields for marshaling section data
section_fields = {
    'section_id': fields.Integer(attribute='id'),
    'name': fields.String,
    'description': fields.String,
    'date_created': fields.String
}

class SectionResource(Resource):
    @auth_required("token")
    @roles_accepted('admin')
    @marshal_with(section_fields)
    def get(self):
        sections = Section.query.all()
        print(sections)
        sections_list = [{'id': section.id, 'name': section.name, 'description': section.description, 'date_created': section.date_created.isoformat()} for section in sections]
        print(sections_list)
        return sections, 200

    @auth_required("token")
    @roles_accepted('admin')
    def post(self):
        args = parser_parser.parse_args()
        existing_section = Section.query.filter_by(name=args['name']).first()
        if existing_section:
            return {"message": "Section already exists. Please choose a different name."}, 400

        date_created = datetime.strptime(args['date_created'], '%Y-%m-%d')
        section = Section(name=args['name'], description=args['description'], date_created=date_created)
        db.session.add(section)
        db.session.commit()
        return {"message": "Section Added"}, 201

    @auth_required("token")
    @roles_accepted('admin')
    def put(self, section_id):
        args = parser_parser.parse_args()
        section = Section.query.get(section_id)
        if not section:
            return {"message": "Section not found"}, 404

        section.name = args['name']
        section.description = args['description']
        section.date_created = datetime.strptime(args['date_created'], '%Y-%m-%d')

        db.session.commit()
        return {"message": "Section updated", "section": marshal(section, section_fields)}, 200

    @auth_required("token")
    @roles_accepted('admin')
    def delete(self, section_id):
        section = Section.query.get(section_id)
        if not section:
            return {"message": "Section not found"}, 404
        
        books = Book.query.filter_by(section_id=section_id).all()
        for book in books:
            db.session.delete(book)
        
        db.session.delete(section)
        db.session.commit()

        return {"message": "Section and associated books deleted"}, 200
    
api.add_resource(SectionResource, '/section', '/section/<int:section_id>')


parser_book = reqparse.RequestParser()
parser_book.add_argument('name', type=str, help='Name is required and should be a string', required=True)
parser_book.add_argument('content', type=str, help='Content is required and should be a string', required=True)
parser_book.add_argument('author', type=str, help='Author is required and should be a string', required=True)
parser_book.add_argument('unit', type=int, help='Unit is required and should be an integer', required=True)
parser_book.add_argument('section_id', type=int, help='Section ID is required and should be an integer', required=True)

book_fields = {
    'book_id': fields.Integer(attribute='id'),
    'name': fields.String,
    'content': fields.String,
    'author': fields.String,
    'unit': fields.Integer,
    'section': fields.Nested({
        'id': fields.Integer,
        'name': fields.String,
        'description': fields.String,
        'date_created': fields.String
    }),
}

book_fields_user = {
    'book_id': fields.Integer(attribute='id'),
    'name': fields.String,
    'author': fields.String,
    'content': fields.String,
    'unit': fields.Integer,
    'section': fields.Nested({
        'id': fields.Integer,
        'name': fields.String,
        'description': fields.String,
        'date_created': fields.String
    }),
}

# class BookResource(Resource):
#     @auth_required("token")
#     @cache.cached(timeout=20)
#     def get(self, section_id=None):
#         section_id = request.args.get('section_id')
#         print(section_id)
        
#         if section_id:
#             section = Section.query.get(section_id)
#             if not section:
#                 return {"message": "Section not found"}, 404
            
#             books = Book.query.filter_by(section_id=section_id).all()
#             print(books)
#         # else:
#         #     books = Book.query.all()
#         #     print(books)

#         if "admin" in current_user.roles:
#             return marshal(books, book_fields)
#         elif "user" in current_user.roles:
#             return marshal(books, book_fields_user)
#         else:
#             return {"message": "Unauthorized"}, 403

class BookResource(Resource):
    @auth_required("token")
    def get(self, section_id=None):
        section_id = request.args.get('section_id')
        print(section_id)
        
        if section_id:
            section = Section.query.get(section_id)
            if not section:
                return {"message": "Section not found"}, 404
            
            books = Book.query.filter_by(section_id=section_id).all()
            print(books)
        else:
            books = Book.query.all()
            print(books)
        avg_ratings = {}
        for book in books:
            if not book.ratings:
                avg_ratings[book.id] = 0
                print(f"Book ID {book.id} '{book.name}' has no ratings.")
            else:
                ratings = [rating.value for rating in book.ratings]
                avg_rating = round(sum(ratings) / len(ratings)) if len(ratings) > 0 else 0
                avg_ratings[book.id] = avg_rating
                print(f"Book ID {book.id} '{book.name}' average rating: {avg_rating}")

        sorted_books = sorted(books, key=lambda book: avg_ratings[book.id], reverse=True)
        
        book_data = []
        for book in sorted_books:
            book_info = marshal(book, book_fields if "admin" in current_user.roles else book_fields_user)
            book_info['average_rating'] = avg_ratings[book.id]
            book_data.append(book_info)

        if "admin" in current_user.roles:
            return marshal(books, book_fields)
        elif "user" in current_user.roles:
            return marshal(books, book_fields_user)
        else:
            return {"message": "Unauthorized"}, 403


    @auth_required("token")
    @roles_accepted('admin')
    def post(self):
        args = parser_book.parse_args()
        print(args)  # Log the parsed arguments
        section_id = args.get("section_id")
        section = Section.query.get(section_id)
        
        if not section:
            return {"message": "Section not found"}, 404

        existing_book = Book.query.filter_by(name=args.get("name")).first()
        if existing_book:
            return {"message": "Book name already exists, please choose a different name."}, 400

        new_book = Book(
            name=args.get("name"),
            content=args.get("content"),
            author=args.get("author"),
            unit=args.get("unit"),
            section_id=section_id
        )

        db.session.add(new_book)
        db.session.commit()
        
        # Optional: Associate the book with the section if needed
        section.books.append(new_book)
        db.session.commit()

        return {"message": "Book Added", "book_id": new_book.id}, 201

    @auth_required("token")
    @roles_accepted('admin')
    def put(self, book_id):
        args = parser_book.parse_args()
        print(args)  # Log the parsed arguments

        # Find the book by book_id
        book = Book.query.get(book_id)
        if book is None:
            return {"message": "Book not found"}, 404
        
        section_id = args.get("section_id")
        section = Section.query.get(section_id)
        
        if not section:
            return {"message": "Section not found"}, 404
        
        # Update the book fields
        book.name = args.get("name", book.name)
        book.content = args.get("content", book.content)
        book.author = args.get("author", book.author)
        book.unit = args.get("unit", book.unit)
        
        # Optional: Associate the book with the section if needed
        book.section = section
        
        db.session.commit()
        
        return {"message": "Book updated"},201

    @auth_required("token")
    @roles_accepted('admin')
    def delete(self, book_id):
        book = Book.query.get(book_id)
        if book is None:
            return {"message": "Book not found"}, 404

        Rating.query.filter_by(book_id=book_id).delete()
    
        db.session.delete(book)
        db.session.commit()
        return {"message": "Book deleted"}


api.add_resource(BookResource, '/books', '/books/<int:book_id>')

parser_request_book = reqparse.RequestParser()
parser_request_book.add_argument('book_name', type=str, help='Book Name is required and should be a string', required=True)
parser_request_book.add_argument('quantity', type=int, help='Quantity should be an integer', required=True)
parser_request_book.add_argument('date_issued', type=str, help='Date Issued is required and should be a string', required=True)
parser_request_book.add_argument('return_date', type=str, help='Date Return is required and should be a string', required=True)

parser_approve_decline_request = reqparse.RequestParser()
parser_approve_decline_request.add_argument('is_approved', type=bool, required=True, help="Approval status is required")

# Response Fields
book_request_fields = {
    'b_id': fields.Integer,
    'book_name': fields.String,
    'quantity': fields.Integer,
    'date_issued': fields.String(attribute=lambda x: x.date_issued.strftime('%Y-%m-%d')),
    'return_date': fields.String(attribute=lambda x: x.return_date.strftime('%Y-%m-%d')),
    'is_approved': fields.Boolean
}



class BookRequestResource(Resource):
    @auth_required("token")
    @roles_required('user')
    def post(self):
        args = parser_request_book.parse_args()
        book_name = args.get('book_name')
        quantity = args.get('quantity')
        date_issued = datetime.strptime(args.get('date_issued'), '%Y-%m-%d')
        return_date = datetime.strptime(args.get('return_date'), '%Y-%m-%d')
        user_id = current_user.id

        # Begin a transaction to maintain consistency
        try:
            # Check if the book exists and get the available quantity
            book = Book.query.filter_by(name=book_name).first()
            if not book:
                return {"message": "Book not found"}, 404

            available_quantity = book.unit

            # Ensure the requested quantity does not exceed available quantity
            if quantity > available_quantity:
                return {"message": "Requested quantity exceeds available stock."}, 400

            # Check if the user has already requested 5 books (only unapproved requests)
            existing_requests_count = Book_Request.query.filter_by(user_id=user_id, is_approved=False).count()
            if quantity >= 5:
                return {"message": "You cannot request more than 5 books."}, 403

            # Reduce the book's unit
            book.unit -= quantity
            if book.unit < 0:
                # If reducing the unit goes below 0, return an error
                return {"message": "Requested quantity exceeds available stock after update."}, 400

            # Create a new book request
            book_request = Book_Request(
                book_name=book_name,
                quantity=quantity,
                date_issued=date_issued,
                return_date=return_date,
                user_id=user_id
            )

            db.session.add(book_request)
            db.session.commit()

            return {"message": "Book request submitted"}, 201
        except Exception as e:
            # Log the exception if needed
            print(f"Exception occurred: {e}")
            return {"message": "An error occurred while processing your request."}, 500
        
    @auth_required("token")
    @roles_required('admin')
    @cache.cached(timeout=20)
    def get(self):
        book_request = Book_Request.query.all()
        if not book_request:
            return {"message": "Book request not found"}, 404
        print(book_request)
        return marshal(book_request,book_request_fields)
    
    @auth_required("token")
    @roles_required('admin')
    def put(self, b_id):
        args = parser_approve_decline_request.parse_args()
        is_approved = args.get('is_approved')

        try:
            book_request = Book_Request.query.get(b_id)
            if not book_request:
                return {"message": "Book request not found"}, 404

            book_request.is_approved = is_approved

            if not is_approved:
                book = Book.query.filter_by(name=book_request.book_name).first()
                book.unit += book_request.quantity
                
            
            db.session.commit()
            status = "approved" if is_approved else "declined"
            return {"message": f"Book request {status} successfully"}, 200
        except Exception as e:
            print(f"Exception occurred: {e}")
            return {"message": "An error occurred while processing the request."}, 500

        
        
    @auth_required("token")
    
    def delete(self, b_id):
        try:
            book_request = Book_Request.query.get(b_id)
            print(book_request)
            if not book_request:
                return {"message": "Book request not found"}, 404

            if book_request.is_approved:
                book = Book.query.filter_by(name=book_request.book_name).first()
                if book:
                    book.unit += book_request.quantity

            db.session.delete(book_request)
            db.session.commit()

            return {"message": "Book request deleted successfully"}, 200
        except Exception as e:
            print(f"Exception occurred: {e}")
            return {"message": "An error occurred while deleting the request."}, 500

api.add_resource(BookRequestResource, '/book_request','/book_request/<int:b_id>')



