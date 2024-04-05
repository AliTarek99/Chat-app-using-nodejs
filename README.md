## Introduction
This is a chatting application API that I built using ExpressJS. Users can create an account and start chatting with their friends either in private chats or in group chats, user can add profile picture, send images, text messages, and voice messages.

## API Documentation
You can find the API documentation <a href="https://documenter.getpostman.com/view/33536415/2sA35K2gDw">here</a>. I wrote the documentation using Postman while testing the API so all the endpoints have brief description attached to them and some examples of the request and response structure.

## Overview
- I used relational database and parameterized queries with MySQL server for the database.
- All passwords are hashed using bcrypt and JWT tokens expire after 1 hour for security reasons.
- Authentication and authorization are implemented on all the endpoints with sensitive information.
- For handling file upload I used Multer and added authorization in the diskStorage functions.
- For sending emails I used Mailjet API.
- I used socket.io to handle websocket requests and to forward received messages to the receiver.

## Note
The API will not work without your keys and database user data because all the API keys have been changed.

## Database design
![image](https://github.com/AliTarek99/Chat-app-using-nodejs/assets/120846112/1fe960be-5c2b-48c9-8872-96afa3948346)
