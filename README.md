
# Macros Eat

<p align="center">
  <img width="200" src="https://d2fbjpv4bzz3d2.cloudfront.net/macroseat_logo.png">
</p>

Macros Eat aims to help you record your daily diet with personalized diet plans focusing on macronutrients and provide consulting service chatting with nutritionist online in real-time. 

🖥️ Website URL : https://www.macroseat.xyz/

Test account and password : test@gmail.com / wayne123WAYNE




## Demo

![image](demo/demo2_1.gif)

![image](demo/demo1_1.gif)




## Table of Contents

- [Main Features](#main-features)
- [Backend Technique](#backend-technique)
  - [Infrastructure](#infrastructure)
  - [Environment](#environment)
  - [Cloud Service (AWS)](#cloud-service-(AWS))
  - [Database](#database)
  - [Networking](networking)
  - [Third Party Library](#third-party-library)
  - [Version Control](#version-control)
  - [Key Points](#key-points)
- [Architecture](#Architecture)
  - [Server Architecture](#server-architecture)
  - [Socket Architecture](#socket-architecture)
- [Database Schema](#database-schema)
- [Frontend Technique](#frontend-technique)
- [API Doc](#api-doc)
- [Contact](#contact)


## Main Features

- Setup CI/CD pipeline with github action and AWS ECR / CodeDeploy.
- Memebr System 
  - User can sign in locally or with Google account (OAuth2.0).
  - User authentication with Json Web Token. 
- Diet Record Features
  - User can customize personalized food and diet plans based on individual needs.
  - Supports searching for all food existing in this website.
  - Visualize macronutrients consuming status.
  - Supports recording daily weight.
- Online Consulting Service 
  - live chat with nutritionist online.
  - Showing online/offline status of general user and nutritionist.
  - Showing the number of unread messages. 
  - Supports tracing historical messages.
  - User can see all nutritionists but nutritionists can only see users who have consulting history with them.
  - Web notification on receiving message.
### Backend Technique

#### Infrastructure
- Containerize 
- docker-compose 

#### Language / Web Framework
- Python / Flask

#### WSGI Server
- Gunicorn

#### Cloud Service (AWS)
- EC2
- RDS
- S3, CloudFront
- ElastiCache
- Elastic Container Registry
- CodeDeploy

#### Database
- MySQL
- MongoDB
- Redis

#### Networking
- HTTP & HTTPS
- Domain Name System (DNS)
- NGINX
- SSL (Let's Encrypt)

#### Third Party Library
- Flask-SocketIO
- Celery
- oauthlib

#### Version Cotrol
- Git/GitHub

#### Key Points
- MVC Pattern
- Socket IO





## Architecture

- Server Architecture
![Logo](https://d2fbjpv4bzz3d2.cloudfront.net/server_archi.png)

- Socket Architecture

#### User and nutritionist get online.
![Logo](demo/socket.drawio.png)

#### Retrieving historical messages.
![Logo](demo/socket2.drawio.png)

#### Send messages.
![Logo](https://d2fbjpv4bzz3d2.cloudfront.net/socket3.drawio.png)




## Database Schema
![Logo](https://d2fbjpv4bzz3d2.cloudfront.net/database.png)
## Frontend Technique

- HTML
- JavaScript
- CSS
- AJAX
- Third Party Library
  - chart.js 
  - moment.js 
## API Doc

[API doc](https://app.swaggerhub.com/apis/mrwayne/macros-eat/1.0.0-oas3)
## Contact

👨🏻‍💻 許哲瑋 Che Wei Hsu 

📬 Email : whph60308@gmail.com
