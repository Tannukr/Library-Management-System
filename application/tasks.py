from celery import shared_task
from .models import *
from flask import Response
import io
import csv
import flask_excel as excel
#import pandas as pd 
import os
from smtplib import SMTP
from datetime import datetime as date, timedelta
from flask import render_template_string
from celery.schedules import crontab
from httplib2 import Http
from json import dumps
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from email import encoders
from email.mime.base import MIMEBase

# @shared_task(ignore_result=False)
# def create_book_csv():
#     # Fetch books from the database
#     books = Book.query.with_entities(Book.name, Book.content, Book.author, Book.unit, Book.section_id).all()
    
#     # Convert to a list of dictionaries
#     book_list = [{'Name': book.name, 'Content': book.content, 'Author': book.author, 'Unit': book.unit} for book in books]
    
#     # Create a DataFrame
#     df = pd.DataFrame(book_list)
    
#     # Define the filename and path
#     filename = 'test1.csv'  
    
#     # Save the DataFrame to a CSV file
#     df.to_csv(filename, index=False)
    
#     # Check if the file was created
#     if not os.path.isfile(filename):
#         raise Exception(f"File {filename} was not created")
    
#     # Return the filename for further use
#     return filename

@shared_task(ignore_result=False)
def create_book_csv():
    # Fetch books from the database
    books = Book.query.with_entities(Book.name, Book.content, Book.author, Book.unit, Book.section_id).all()
    
    # Define the filename and path
    filename = 'test1.csv'
    
    # Write the CSV file
    try:
        with open(filename, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            # Write the header
            writer.writerow(['Name', 'Content', 'Author', 'Unit'])
            # Write the data rows
            for book in books:
                writer.writerow([book.name, book.content, book.author, book.unit])
    except Exception as e:
        raise Exception(f"Error writing CSV file: {str(e)}")
    
    # Check if the file was created
    if not os.path.isfile(filename):
        raise Exception(f"File {filename} was not created")
    
    # Return the filename for further use
    return filename

@shared_task(ignore_result=True)
def daily_reminder(to, subject):
    #users =User.query.all()
    users = User.query.filter(User.roles.any(Role.name == "user")).all()
    for user in users:
        send_message(user.email, subject, "hello")
    return 'OK'


@shared_task(ignore_result=False)
def send_reminder():
    try:
        """Google Chat incoming webhook quickstart."""
        url = "https://chat.googleapis.com/v1/spaces/AAAAIlzx5S8/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=geHTrY_ASp6yYHphRsRdhsm84UkOJooBbTLFZ4YmblE"
        #all_users = User.query.filter(User.roles.any(Role.name == "user")).all()
        all_users = User.query.filter(User.roles.any(name="user")).all()
        #all_users = User.query.all()
    
        for user in all_users:
            latest_orders = Book_Request.query.filter_by(user_id=user.id, is_approved=True).all()
            if latest_orders is None:
                bot_message = {'text': f'Hello {user.username}.. You have not read  anything yet. Please visit our site to rad.'}
                message_headers = {"Content-Type": "application/json; charset=UTF-8"}
                http_obj = Http()
                response = http_obj.request(
                    uri=url,
                    method="POST",
                    headers=message_headers,
                    body=dumps(bot_message),
                )
                print(response)
            else:
                bot_message = {'text': f'Hello {user.username}.. It has been more than 24 hours since your last Visit to our app. Please visit our site to read again.'}
                message_headers = {"Content-Type": "application/json; charset=UTF-8"}
                http_obj = Http()
                response = http_obj.request(
                    uri=url,
                    method="POST",
                    headers=message_headers,
                    body=dumps(bot_message),
                )
                print(response)
            
    except Exception as e:
        print(f"An error occurred: {str(e)}")
    return "reminder will be sent shortly..."

SMTP_HOST = "localhost"
SMTP_PORT = 1025  
SENDER_EMAIL = "tannu@gmail.com"
SENDER_PASSWORD = ''

def send_message(to, subject, content_body):
    msg = MIMEMultipart()
    msg['To'] = to
    msg['Subject'] = subject
    msg['From'] = SENDER_EMAIL
    msg.attach(MIMEText(content_body, 'html'))
    client = SMTP(host=SMTP_HOST, port=SMTP_PORT)
    client.send_message(msg)  
    client.quit()

def send_email(to_address, subject, message, content="text", attachment_file=None):
    msg = MIMEMultipart()
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_address
    msg["Subject"] = subject
    if content == "html":      
        msg.attach(MIMEText(message, "html"))
    else:
        msg.attach(MIMEText(message, "plain"))
        
    if attachment_file:
        with open(attachment_file, "rb") as attachment:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename= {attachment_file}",
            )
            msg.attach(part)

    s = smtplib.SMTP(host=SMTP_HOST, port=SMTP_PORT)
    s.login(SENDER_EMAIL, SENDER_PASSWORD)
    s.send_message(msg)
    s.quit()
    return True

@shared_task(ignore_result=False)
def send_reminder_via_email():
    #all_users = User.query.all()
    all_users = User.query.filter(User.roles.any(name="user")).all()
    for user in all_users:
        bookings = Book_Request.query.filter_by(user_id=user.id, is_approved=True).all()
        if bookings:
            email_content = render_template_string(
                """
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                        }
                        h2 {
                            color: #333;
                        }
                        ul {
                            list-style-type: none;
                            padding: 0;
                        }
                        li {
                            margin-bottom: 10px;
                        }
                    </style>
                </head>
                <body>
                    <h2>Your Book Details</h2>
                    <p>Hello {{ user.username }},</p>
                    <p>Here are your recent bookings:</p>
                    <ul>
                        {% for booking in bookings %}
                            <li>
                                <strong>Book:</strong> {{ booking.book_name }}<br>
                                <strong>Quantity:</strong> {{ booking.quantity }}<br>
                                <strong>Issue Date:</strong> {{ booking.date_issued }}<br>
                                <strong>Return Date:</strong> {{ booking.return_date }}
                            </li>
                            <br>
                        {% endfor %}
                    </ul>
                </body>
                </html>
                """,
                user=user,
                bookings=bookings,
            )

            send_email(
                to_address=user.email,
                subject="Your Recent Book Details",
                message=email_content,
                content="html",
            )
    
    return "Reminder emails sent successfully"
