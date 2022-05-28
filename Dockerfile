FROM python:3.9.5-slim

RUN mkdir /flask

WORKDIR /flask

COPY . .

RUN pip3 install -r requirements.txt

ENV FLASK_APP=app.py

RUN mkdir /log

EXPOSE 5000

CMD ["gunicorn", "--worker-class", "eventlet", "-w","1","-b","0.0.0.0:5000","--log-level=info","--error-logfile=./log/error.log","--access-logfile=./log/access.log","app:app"]


