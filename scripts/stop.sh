#!/bin/bash
cd /home/ubuntu
sudo docker container stop flask-macroseat
sudo docker container rm flask-macroseat
sudo docker image rmi 298325099374.dkr.ecr.us-east-1.amazonaws.com/macroseat:latest