# 🧠 Awari Backend Assessment – Snappy-API

## A **NestJS + GraphQL + MongoDB + Redis** backend for real-time post engagement (likes/dislikes), using a mock authentication system.

## 1. Setup & Execution

### 1.1 Prerequisites

Make sure you have installed on your system:

- **Node.js** v20+
- **Docker** & **Docker Compose**
- **Git**

---

### 1.2 Clone & Run

git clone https://github.com/Kasie97/snappy-api.git
cd snappy-api
Local Run Command: docker compose up --build

This will automatically start:
NestJS API on port 3000
MongoDB on port 27017
Redis on port 6379

Then open your browser at: http://localhost:3000/graphql (API ENDPOINT)

### 1.3 Dockerfile

FROM node:22-alpine

WORKDIR /app

COPY package\*.json ./

RUN npm install

RUN npm install -g @nestjs/cli

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

### 1.4 Docker-compose.yml

services:
api:
build:
context: .
dockerfile: Dockerfile
container_name: snappy-api
restart: always
ports: - "3000:3000"
environment:
NODE_ENV: development
MONGO_URI: mongodb://mongo:27017/snappy
REDIS_HOST: redis
REDIS_PORT: 6379
MOCK_HMAC_SECRET: local-secret
depends_on: - mongo - redis
volumes: - .:/app - /app/node_modules
command: npm run start:dev

mongo:
image: mongo:7.0
container_name: mongo
restart: always
ports: - "27017:27017"
volumes: - mongo_data:/data/db

redis:
image: redis:7.2
container_name: redis
restart: always
ports: - "6380:6379"
volumes: - redis_data:/data

volumes:
mongo_data:
redis_data:

### 1.5 Environment Variables

MONGO_URI=mongodb+srv://pearl:<password>@cluster0.jtfeezz.mongodb.net/snappy?retryWrites=true&w=majority&tls=true
appName=SnappyAPi
REDIS_HOST=localhost
REDIS_PORT=6380

2. Design Decisions

### 2.1 Data Model (MongoDB Schema)

{
content: string;
author: ObjectId;
likes: ObjectId[];
dislikes: ObjectId[];
createdAt: Date;
updatedAt: Date;
}
likeCount / dislikeCount → computed dynamically (likes.length, dislikes.length)

Embedding vs Referencing → referencing is used (arrays of User IDs)

Easier to query and update

Prevents redundant data

### 2.2 Real-Time Flow

When a user executes likePost:
GraphQL mutation likePost(postId) is called.
PostsService updates MongoDB:
Adds user ID to likes
Removes from dislikes if necessary
A Redis PubSub event is published:

pubSub.publish(`postUpdated:${postId}`, { onPostUpdate: {...} })
Any active onPostUpdate subscriptions instantly receive updated counts.

Flow:
GraphQL Mutation → MongoDB Update → Redis PubSub Publish → GraphQL Subscription Broadcast

### 2.3 Security/Mock Authentication

Handled by MockAuthGuard
Extracts mock user from:
Header: x-user-id or x-username
Cookie: mock-user-id

Or generates one automatically

Injected into resolvers using:
@CurrentUser() user: { id: string }
This ensures every request has a valid user context for testing.

3. Testing & Verification

### 3.1 Test Case 1 – Like a Post (Mutation)

mutation LikePost($postId: ID!) {
likePost(postId: $postId) {
id
content
likeCount
dislikeCount
likedByUser
dislikedByUser
}
}
Variable needed to like a post:
{
"postId": "PLEASE_PUT_A_REAL_POST_ID_HERE"
}

### 3.2 Test Case 2 – Subscribe to Post Updates

subscription OnPostUpdate($postId: ID!) {
onPostUpdate(postId: $postId) {
postId
likeCount
dislikeCount
}
}

### 3.3 Test Scenario

Tab 1 → Open GraphQL Playground (https://localhost:3000/graphql) and run the Subscription above with a post ID.

Tab 2 → Run the Like Mutation for the same post ID.

Observe → Tab 1 updates instantly with new like/dislike counts.
