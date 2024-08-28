from flask import current_app as app, jsonify, request, render_template ,send_file
from flask_security import auth_required, roles_required, roles_accepted,current_user
from werkzeug.security import check_password_hash
from flask_restful import marshal, fields
from .models import *
from flask_restful import marshal, fields
from .sec import datastore
from .tasks import *

from celery.result import AsyncResult
import flask_excel as excel

from flask import Response
import io
import csv



@app.get('/')
def home():
    return render_template("index.html")


@app.post('/user-login')
def user_login():
    data = request.get_json()
    email = data.get('email')
    all_users = User.query.all()
    if not email:
        return jsonify({"message": "email not provided"}), 400

    user = datastore.find_user(email=email)

    if not user:
        return jsonify({"message": "User Not Found"}), 404
    print(f"User logging in: {user.username}")


    if check_password_hash(user.password, data.get("password")):
        return jsonify({"token": user.get_auth_token(), "email": user.email, "role": user.roles[0].name})
    else:
        return jsonify({"message": "Wrong Password"}), 400


user_fields = {
    "id": fields.Integer,
    "email": fields.String,
    "name":fields.String,
    "active": fields.Boolean,
}

@app.get('/users')
@auth_required("token")
# @roles_required("admin")
def all_users():
    users = User.query.all()
    
    if not users:
        return jsonify({"message": "No users found"}), 404
    return jsonify(marshal(users, user_fields))

section_fields = {
    'section_id': fields.Integer,
    'name': fields.String,
    'description': fields.String,
    'date_created': fields.String
}

@app.get('/get/section')
@auth_required("token")
#@roles_accepted('admin')
def get_section():
    sections = Section.query.all()
    if not sections:
        return jsonify({"message": "Section not found"}), 404
    
    print(sections)

    sections_list = [{'id': section.id, 'name': section.name, 'description': section.description, 'date_created': section.date_created.isoformat()} for section in sections]

    return jsonify(sections_list), 200

@app.route('/api/search', methods=['GET'])
def search():
    search_query = request.args.get('query', '')
    
    # Search for sections matching the query
    sections = Section.query.filter(
        (Section.name.ilike(f'%{search_query}%')) |
        (Section.description.ilike(f'%{search_query}%'))
    ).all()

    # Search for books matching the query
    books = Book.query.filter(
        (Book.name.ilike(f'%{search_query}%')) |
        (Book.author.ilike(f'%{search_query}%'))
    ).all()

    search_results = []

    for section in sections:
        section_info = {
            'type': 'section',
            'id': section.id,
            'name': section.name,
            'description': section.description,
        }
        search_results.append(section_info)

        for book in section.books:
            book_info = {
                'type': 'book',
                'id': book.id,
                'name': book.name,
                'author': book.author,
                'unit': book.unit
            }
            search_results.append(book_info)

    for book in books:
        # Ensure books not already added from the section loop are included
        book_info = {
            'type': 'book',
            'id': book.id,
            'name': book.name,
            'author': book.author,
            'unit': book.unit,
            }
        search_results.append(book_info)
        
        print(book_info)

    return jsonify(search_results)

@app.get('/get_all_info')
@auth_required("token")
@roles_required("admin")
def get_all_info():
    try:
        total_users = db.session.query(User).join(RolesUsers).join(Role).filter(Role.name == 'user').count()
        # total_users = User.query.count()
        print(total_users)
        total_sections = Section.query.count()
        total_books = Book.query.count()
        total_book_requests = Book_Request.query.count()
        #total_rating =
        print(total_book_requests) # Added to count book requests

        return jsonify({
            "total_users": total_users,
            "total_sections": total_sections,
            "total_books": total_books,
            "total_book_requests": total_book_requests  # Include in the response
        }), 200
    except Exception as e:
        print(f"Error occurred: {e}")
        return jsonify({"message": "An error occurred while retrieving information."}), 500

@app.route('/approved_books', methods=['GET'])
@auth_required("token")
def get_approved_books():
    try:
        user_id = current_user.id
        if not user_id:
            return {"message": "User ID is required"}, 400
        
        approved_requests = Book_Request.query.filter_by(user_id=user_id, is_approved=True).all()
        #approved_requests = Book_Request.query.filter_by(user_id=user_id, is_approved=True).all()
        if not approved_requests:
            return {"message": "No approved book requests found for this user"}, 404

        approved_books = []
        for request in approved_requests:
            #book = Book.query.filter_by(id=request.book_id).first()
            book = Book.query.filter_by(name=request.book_name).first()
            if book:
                approved_books.append({
                    "b_id":request.b_id,
                    "id":book.id,
                    "book_name": book.name,
                    "author": book.author,
                    "content": book.content,
                    "date_issued": request.date_issued,
                    "return_date": request.return_date
                })

        return jsonify(approved_books)
    except Exception as e:
        app.logger.error(f"Error fetching approved books: {e}")
        return {"message": "Internal server error"}, 500




@app.get('/download-csv/')
def download_csv():
    task = create_book_csv.delay()
    return jsonify({"task-id":task.id})

@app.get('/get-csv/<task_id>')
def get_csv(task_id):
    res = AsyncResult(task_id)
    if res.ready():
        filename = res.result
        try:
            return send_file(filename, as_attachment=True, download_name='test1.csv')
        except Exception as e:
            return jsonify({"message": f"Error sending file: {e}"}), 500
    else:
        return jsonify({"message": "Task Pending"}), 404



@app.route('/rating/<int:book_id>', methods=['POST'])
@auth_required("token")
def rating(book_id):
    user = current_user
    
    data = request.get_json()
    rating_value = data.get('rating')
    
    # Validate rating value
    if rating_value is not None:
        rating_value = int(rating_value)
        if 1 <= rating_value <= 5:
            existing_rating = Rating.query.filter_by(user_id=user.id, book_id=book_id).first()
            if existing_rating:
                existing_rating.value = rating_value
            else:
                new_rating = Rating(value=rating_value, user_id=user.id, book_id=book_id)
                db.session.add(new_rating)
            db.session.commit()
            return jsonify({"message": "You have rated this book successfully"})
    
    return jsonify({"message": "Invalid rating value"}), 400

@app.route('/return_book/<int:b_id>', methods=['POST'])
@auth_required("token")
@roles_required('user')
def return_book(b_id):
    user_id = current_user.id
    try:
        # Find the approved book request for the current user
        book_request = Book_Request.query.filter_by(id=b_id, user_id=current_user.id, is_approved=True).first()
        if not book_request:
            return {"message": "Approved book request not found"}, 404

        # Find the book associated with the request
        book = Book.query.filter_by(name=book_request.book_name).first()
        if book:
            # Update the book's available quantity
            book.unit += book_request.quantity

            # Delete the book request
            db.session.delete(book_request)
            db.session.commit()

            return {"message": "Book returned successfully"}, 200

        return {"message": "Book not found"}, 404

    except Exception as e:
        # Log the exception and return a generic error message
        app.logger.error(f"Exception occurred: {e}")
        return {"message": "An error occurred while processing the return."}, 500
