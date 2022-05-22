FROM python:3.9.5-slim

RUN mkdir /flask

WORKDIR /flask

COPY . .

RUN pip3 install -r requirements.txt

ENV FLASK_APP=app.py

EXPOSE 5000

CMD ["gunicorn", "--worker-class", "eventlet", "-w","1","-b","0.0.0.0:5000","--log-level=info","app:app"]


