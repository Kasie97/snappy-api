# 🧠 Awari Backend Assessment – Real-Time Engagement API

A **NestJS + GraphQL + MongoDB + Redis** backend for real-time post engagement (likes/dislikes), using a mock authentication system.

---

## 🚀 1. Setup & Execution

### 🧩 Prerequisites

Make sure you have installed:
- **Node.js** v20+
- **Docker** & **Docker Compose**
- **Git**

---

### 🧱 Clone & Run

```bash
git clone https://github.com/YOUR_USERNAME/snappy-api.git
cd awari-backend-assessment-api
docker-compose up
This will automatically start:

🧩 NestJS API → port 3000

🍃 MongoDB → port 27017

🧠 Redis → port 6379

Then open your browser at:
👉 http://localhost:3000/graphql

⚙️ 2. Environment Variables
Create a file named .env in the project root:

MONGO_URI=mongodb+srv://pearl:zuzwang@cluster0.jtfeezz.mongodb.net/snappy?retryWrites=true&w=majority&tls=true
appName=SnappyAPi
REDIS_HOST=localhost
REDIS_PORT=6380
url: 'ws://localhost:3000/graphql'


🧰 3. Docker Setup
Below are the Docker files you need in the project root.

🐳 Dockerfile
dockerfile
Copy code
# Use Node.js LTS
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the NestJS app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]
🧩 docker-compose.yml

version: '3.9'

services:
  api:
    build: .
    container_name: snappy-api
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - mongo
      - redis
    volumes:
      - .:/usr/src/app
    command: npm run start:dev

  mongo:
    image: mongo:6
    container_name: snappy-mongo
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7
    container_name: snappy-redis
    restart: always
    ports:
      - "6379:6379"

volumes:
  mongo_data:
Run everything with one command:

bash
Copy code
docker-compose up
🧩 4. Design Decisions
🧠 Data Model (MongoDB Schema)
ts
Copy code
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

⚡ Real-Time Flow
When a user executes likePost:

GraphQL mutation likePost(postId) is called.

PostsService updates MongoDB:

Adds user ID to likes

Removes from dislikes if necessary

A Redis PubSub event is published:

ts
Copy code
pubSub.publish(`postUpdated:${postId}`, { onPostUpdate: {...} })
Any active onPostUpdate subscriptions instantly receive updated counts.

Flow:
GraphQL Mutation → MongoDB Update → Redis PubSub Publish → GraphQL Subscription Broadcast

🔐 Mock Authentication
Handled by MockAuthGuard

Extracts mock user from:

Header: x-user-id or x-username

Cookie: mock-user-id

Or generates one automatically

Injected into resolvers using:

ts
Copy code
@CurrentUser() user: { id: string }
This ensures every request has a valid user context for testing.

🧪 5. Testing & Verification
✅ Test Case 1 – Like a Post (Mutation)
graphql
Copy code
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
Variables:

json
Copy code
{
  "postId": "PUT_A_REAL_POST_ID_HERE"
}
✅ Test Case 2 – Subscribe to Post Updates
graphql
Copy code
subscription OnPostUpdate($postId: ID!) {
  onPostUpdate(postId: $postId) {
    postId
    likeCount
    dislikeCount
  }
}
🧭 Test Scenario
Tab 1 → Open GraphQL Playground and run the Subscription above with a post ID.

Tab 2 → Run the Like Mutation for the same post ID.

Observe → Tab 1 updates instantly with new like/dislike counts.

Alternatively, you can run the included script:

bash
Copy code
ts-node test-subscription.ts
Just replace the placeholder PUT_A_REAL_POST_ID_HERE in the script.

🧩 6. Stack Overview
Component	Description
NestJS	Backend framework
GraphQL	Query interface
MongoDB	Persistent storage
Redis (PubSub)	Real-time event broadcasting
MockAuthGuard	Simulated authentication

⏰ 7. Submission Deadline
Submit your public GitHub repository within 96 hours (4 days) of receiving the instructions.

Ensure the project is runnable with a single command:

bash
Copy code
docker-compose up
🎙️ 8. Interview Preparation
Be ready to discuss:

Schema design and choice of data modeling

Real-time system scalability with Redis PubSub

How to extend mock authentication into real JWT auth

Handling concurrency and atomic updates for reactions

✅ 9. Author
Your Name
📧 your.email@example.com
🕸️ GitHub: your-username

yaml
Copy code

---

This `README.md` is:
- **Fully compliant** with the submission document.
- **Self-contained** (includes Dockerfile & Compose setup).
- **Reviewer-ready** — they can clone, `docker-compose up`, and test immediately.

Would you like me to also generate a **`.env.example` file** to accompany it (so reviewers know what variables to set)?































<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
