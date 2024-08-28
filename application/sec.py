from flask_security import SQLAlchemyUserDatastore
from .models import *
datastore = SQLAlchemyUserDatastore(db, User, Role)