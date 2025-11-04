# 🧠 Awari Backend Assessment – Snappy-API

## A **NestJS + GraphQL + MongoDB + Redis** backend for real-time post engagement (likes/dislikes), using a mock authentication system.

---

### 1. Setup & Execution

## 1.1 Prerequisites

Make sure you have installed on your system:

- **Node.js** v20+
- **Docker** & **Docker Compose**
- **Git**

---

## 1.2 Clone & Run

git clone https://github.com/Kasie97/snappy-api.git
cd snappy-api

## **Local Run Command:**

docker compose up --build

This will automatically start:

- NestJS API on port 3000
- MongoDB on port 27017
- Redis on port 6379

Then open your browser at: **http://localhost:3000/graphql** (API ENDPOINT)

---

### 1.3 Dockerfile

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g @nestjs/cli

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

---

### 1.4 Docker-compose.yml

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: snappy-api
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      MONGO_URI: mongodb://mongo:27017/snappy
      REDIS_HOST: redis
      REDIS_PORT: 6379
      MOCK_HMAC_SECRET: local-secret
    depends_on:
      - mongo
      - redis
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run start:dev

  mongo:
    image: mongo:7.0
    container_name: mongo
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7.2
    container_name: redis
    restart: always
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:

---

### 1.5 Environment Variables

MONGO_URI=mongodb+srv://pearl:<password>@cluster0.jtfeezz.mongodb.net/snappy?retryWrites=true&w=majority&tls=true
appName=SnappyAPi
REDIS_HOST=localhost
REDIS_PORT=6379

---

### 2. Design Decisions

## 2.1 Data Model (MongoDB Schema)

{
  content: string;
  author: ObjectId;
  likes: ObjectId[];
  dislikes: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

## 2.2 How the likeCount, dislikeCount, and the list of users who have interacted with a post is stored and managed

There are no explicit `likeCount` or `dislikeCount` fields in the database as the system doesn't store the number of likes or dislikes directly. Instead, it keeps a list of users by their ID which have liked or disliked a post.

This way, when it needs to show how many likes or dislikes a post has, it simply counts how many users are on each list.

So, every time a user likes a post, their ID is added to the "likes" list. If they had previously disliked the post, they're automatically removed from the "dislikes" list and added to the likes list. This ensures that a user cannot both like and dislike a post at the same time.

The same happens the other way around: when a user dislikes a post, they're added to the "dislikes" list and removed from the "likes" list if necessary.

These updates happen in one quick, safe database operation, which prevents errors, even if many people are liking or disliking posts at the same time.

To make checking and counting fast, the system also creates small shortcuts (called indexes) on the likes and dislikes lists. That way, like and dislike counts are computed dynamically from the array lengths of the `likes` and `dislikes` fields i.e:

likeCount = post.likes.length
dislikeCount = post.dislikes.length

and updated implicitly when users like/dislike/unlike/undislike a post.

It uses atomic MongoDB operations:

- `$addToSet` - to add a like/dislike
- `$pull` - to remove it

For example:

{ $pull: { dislikes: userObjectId }, $addToSet: { likes: userObjectId } }

is used to keep the likes and dislikes arrays consistent without extra read-modify-write cycles.

## 2.3 Data Modeling Approach

**Method used:** Referencing

The `likes` and `dislikes` fields each contain an array of `ObjectId` references to `User` documents.

**Justification:**

1. **Avoids Data Duplication:** Since each `User` is a separate document, if user data (username, email, etc.) changes, you don't need to update every `Post` that references them. Data duplication also makes it easy to query the database.

2. **Efficient Storage:** Only user `_id`s are stored in the post document instead of full user objects, saving space especially when many users like/dislike the same post.

3. **Supports Growth and Scalability:** Added to point 2, likes/dislikes count can grow to large numbers without inflating document size too drastically as each entry is a short ObjectId.

In general, using the Referencing Data Modeling Approach, given the scope of the project, aligns with MongoDB best practices for many-to-many relationships needed to execute a feature that allows many users to like many posts.

---

## 2.4 Real-Time Flow

When a user executes `likePost`:

1. GraphQL mutation `likePost(postId)` is called.
2. Resolver passes `postId` and the current user's id to `PostsService.likePost`.
3. `PostsService` updates MongoDB:
   - Validates that post with matching ID exists
   - Adds user ID to likes
   - Removes from dislikes if necessary
4. After saving the change, a Redis PubSub event is published:

pubSub.publish(`postUpdated:${postId}`, { onPostUpdate: {...} })

5. Any users watching that post in real-time (through a GraphQL subscription - `onPostUpdate`) automatically receive the updated numbers.

---

## 2.5 Security/Mock Authentication

The app does not use real logins during development — instead, it uses a "mock user" system to pretend each request comes from a user.

It extracts a mock user id from three sources (in order of precedence):

1. `x-user-id` HTTP header (if present and valid as an ObjectId).

2. `mock-user-id` cookie (set by the guard in dev when missing).

3. `x-username` HTTP header — converted deterministically into a 24-hex id using HMAC (so the same username yields same deterministic ObjectId while concealing the raw username).

If none is present — a new random ObjectId is generated and is set as a cookie `mock-user-id` for subsequent requests to persist the mock user.

Once identified, the app attaches that mock user info (like ID, username, and email) to the request.

This lets the backend treat every request as if it's from a real user — without needing any signup or login.

---

### 3. Testing & Verification

## 3.1 Test Case 1 – Like a Post (Mutation)

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

**Variable needed to like a post:**

{
  "postId": "PLEASE_PUT_A_REAL_POST_ID_HERE"
}
---


## 3.2 Test Case 2 – Subscribe to Post Updates

subscription OnPostUpdate($postId: ID!) {
  onPostUpdate(postId: $postId) {
    postId
    likeCount
    dislikeCount
  }
}

---

## 3.3 Test Scenario (For Subscription)

**Tab 1:**

- Open GraphQL Playground (https://localhost:3000/graphql)
- In the HTTP HEADERS drawer (Playground) add:

{ "x-username": "user-1" }

Example: `{ "x-username": "Adaobi" }`

Adding this ensures the mock user identity is deterministic and persists across requests/tabs.

Run the Subscription (`OnPostUpdate`) for the post you will test.

**Tab 2:**

- Open another GraphQL Playground tab on another browser (or another Window).

- Run the Like Mutation for the same post ID.

**Observed Outcome:**

Tab 1 updates instantly with new like/dislike counts.

---

## 3.4 Mutations & Example Operations (all available operations)

# Create A Post:

mutation {
  createPost(content: "Hello from Snappy Api!!") {
    id
    content
    likeCount
    dislikeCount
  }
}

# Subscribe to updates for the post:

subscription {
  onPostUpdate(postId: "6909d92018843e14dcf83903") {
    postId
    likeCount
    dislikeCount
    likerIds
    dislikerIds
  }
}

# Like A Post:

mutation {
  likePost(postId: "ID") {
    id
    content
    likeCount
    dislikeCount
    likedByUser
    dislikedByUser
  }
}

# Unlike a post (remove a like):

mutation {
  unlikePost(postId: "ID") {
    id
    content
    likeCount
    dislikeCount
    likedByUser
    dislikedByUser
    likerIds
  }
}

# Dislike a Post:

mutation DislikePost {
  dislikePost(postId: "ID") {
    id
    content
    likeCount
    dislikeCount
    likedByUser
    dislikedByUser
  }
}

# Undislike a post (remove a dislike):

mutation {
  undislikePost(postId: "ID") {
    id
    content
    likeCount
    dislikeCount
    likedByUser
    dislikedByUser
    likerIds
    dislikerIds
  }
}
