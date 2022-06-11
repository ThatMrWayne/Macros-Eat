#!/bin/bash
cd /home/ubuntu
sudo docker container stop flask-macroseat
sudo docker container rm flask-macroseat
sudo docker image rmi 298325099374.dkr.ecr.us-east-1.amazonaws.com/macroseat:latest
python3 test-redis.py 
aws ecr get-login-password --region us-east-1 |sudo docker login --username AWS --password-stdin 298325099374.dkr.ecr.us-east-1.amazonaws.com
sudo docker image pull 298325099374.dkr.ecr.us-east-1.amazonaws.com/macroseat:latest
