from flask import Flask
from flask_security import SQLAlchemyUserDatastore, Security
from application.models import *
from config import DevelopmentConfig
from application.resources import api
from application.sec import datastore
from application.worker import celery_init_app
import flask_excel as excel
from celery.schedules import crontab
from application.tasks import *
from application.instances import *
from celeryconfig import timezone

def create_app():
    app = Flask(__name__)
    app.config.from_object(DevelopmentConfig)
    db.init_app(app)
    api.init_app(app)
    excel.init_excel(app)
    app.security = Security(app, datastore)
    cache.init_app(app)
    with app.app_context():
        import application.views

    return app

app = create_app()
celery_app = celery_init_app(app)


@celery_app.on_after_configure.connect
def set_up_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(crontab(hour=22, minute=1),send_reminder.s(),name="daily reminder"),
    sender.add_periodic_task(crontab(hour=22, minute=1),send_reminder_via_email.s(),name="monthly reminder")
    #sender.add_periodic_task(crontab(hour=8, minute=27, day_of_month='1'), send_reminder_via_email.s(), name="monthly reminder")





if __name__ == '__main__':
    app.run(debug=True)
    
    
    
#  python -m celery -A main:celery_app worker --loglevel INFO -c 1 -P solo
# python -m celery -A main:celery_app beat --loglevel=INFO
#~/go/bin/MailHog
#redis-cli SHUTDOWN

# cd /mnt/c/Users/tannu/OneDrive/Desktop/L
#  ps aux | grep redis-server
#  sudo systemctl stop redis
# source myenv/bin/activate
# celery -A main:celery_app beat -l INFO
# celery -A main:celery_app worker --loglevel INFO
# .\venv\Scripts\activate