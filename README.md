# Project-Gingham
### Contributors: Sandro Ledesma, Vinh Le, Zak Wosewick

## Overview
Welcome to Phase 4's Project Gingham! This project is aimed to connect food lovers with farmers' markets while reducing waste and helping vendors sell out of product. Below are the steps you need to set up and run the project.
<img width="1280" alt="Homepage" src="https://github.com/zaklance/Project-Gingham/blob/main/client/src/assets/images/gingham-site.jpg?raw=true">


## Setting Up

## Running the Application
### Terminal 1, Frontend Setup

1. From root cd into client:
```
cd client
```
2. Install necessary packages for React:
```
npm install
npm install -g mjml
```
3. Run React:
```
npm run dev
```

### Terminal 2, Backend Setup

1. From root cd into server:
```
cd server
```
2. Install necessary packages for Python:
```
pipenv install
```
3. Set up Python environment
```
pipenv shell
```

### Terminal 3, Redis Setup

1. From root cd into server:
```
cd server
```
2. Start Redis:
```
redis-server
```

### Terminal 4, Celery Beat Setup

1. From root cd into server:
```
cd server
```
2. Start Celery Beat:
```
celery -A app.celery beat --loglevel=debug
```

### Terminal 5, Celery Default Worker Setup

1. From root cd into server:
```
cd server
```
2. Start Celery Worker:
```
celery -A app.celery worker -n default_worker -Q default --loglevel=info --concurrency=2
```

### Terminal 6, Celery Blog Worker Setup

1. From root cd into server:
```
cd server
```
2. Start Celery Worker:
```
celery -A app.celery worker -n blog_worker -Q blog_notifications --loglevel=debug --concurrency=1
```

### Terminal 7, Celery Image Worker Setup

1. From root cd into server:
```
cd server
```
2. Start Celery Worker:
```
celery -A app.celery worker -n image_worker -Q process_images --loglevel=debug --concurrency=1
```

### Terminal 8 (optional), Celery Flower Setup

1. From root cd into server:
```
cd server
```
2. Start Celery Flower:
```
celery -A app.celery flower --port=5555 --basic_auth=admin:admin
```


## Using the Application

1. Peruse the homepage
2. Click login/signup
3. Create an account and sign in
4. See what Vendors and Markets has to offer
5. Checkout with your basket!

