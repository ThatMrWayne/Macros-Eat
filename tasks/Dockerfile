FROM python:3.9.5-slim

RUN mkdir /tasks

WORKDIR /tasks

COPY . .

RUN pip3 install celery redis eventlet==0.30.2

CMD ["celery", "-A", "task", "worker","--pool=eventlet","--concurrency=500","-l","INFO"]
