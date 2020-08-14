# OnlineGame
zip up the contents with a command like zip -r release.zip * and deploy on elastic beanstalk NodeJS from a local upload.
Configure the elastic beanstalk IAM permissions to have read/write access to the DynamoDB table used in app.js

Features:
Create a user account
Hashed & salted password saved to DDB
Token based auth remembers user with JWT

