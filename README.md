# Project-Gingham
### Contributors: Sandro Ledesma, Vinh Le, Zak Wosewick

## Overview
Welcome to Phase 4's Project Gingham! This project is aimed to connect food lovers with farmers markets while reducing waste and helping vendors sell out of product. Below are the steps you need to set up and run the project.
<img width="1280" alt="Homepage" src="https://raw.githubusercontent.com/zaklance/Project-Gingham/main/client/src/assets/images/gingham-site.png">


## Setting Up

### Create .env File
1. In the root folder create a .env file
2. In the terminal, generate a secret key:
```
python
>>> import secrets
>>> secrets.token_hex(16)
```
3. Add to .env file:
```
SECRET_KEY='YOUR SECRET KEY HERE'
```
4. Signup for google maps api and enter your key in the .env like the following
```
VITE_GOOGLE_KEY="YOUR API KEY HERE"
```

### Install Dependencies
1. From the root cd into server
3. From the root cd into client
4. Install necessary packages for React:

## Running the Application
### Terminal 1, Backend Setup

1. From root cd into server
2. Install necessary packages for Python:
```
pipenv install
```
3. Set up Python environment
```
pipenv shell
python app.py
```

### Terminal 2, Frontend Setup

1. From root cd into client
2. Install necessary packages for React:
```
npm install
```
3. Run React:
```
npm run dev
```

## Using the Application

1. Peruse the homepage
2. Click login/signup
3. Create an account and sign in
4. See what Vendors and Markets has to offer
5. Checkout with your basket!

