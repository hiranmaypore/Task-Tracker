# 🎓 Interview Preparation: TaskTracker

This guide contains technical and behavioral questions based on the TaskTracker implementation. Use these to prepare for SDE/Full-Stack interviews.

---

## 🏗️ System Design & Architecture

### **Q: Explain the Event-Driven Architecture in your project.**

**A:** "In TaskTracker, I used an event-driven pattern for features like activity logging and automation. When a user creates a task, the `TasksService` triggers an `ActivityLog`. This log creates an `Event`. The `AutomationService` listens for these events, matches them against user-defined rules, and if a match is found, it adds a job to a BullMQ queue for asynchronous execution (like sending an email). This decouples the core business logic from side effects, ensuring the API remains fast."

### **Q: Why use Redis and BullMQ instead of just processing everything in the API thread?**

**A:** "Processing heavy tasks like sending emails or third-party API calls (Google Calendar) in the main API thread would block the Event Loop, increasing response latency. By using Redis and BullMQ, I offload these tasks to background workers. If an email fails, BullMQ provides built-in retry logic, which makes the system much more resilient."

---

## 🟩 NestJS & Backend

### **Q: How did you implement RBAC (Role-Based Access Control)?**

**A:** "I implemented RBAC at two levels. First, global roles (USER, ADMIN) using custom decorators and guards. Second, project-level roles (OWNER, EDITOR, VIEWER) stored in a `ProjectMember` join model. I created a `ProjectMemberGuard` that checks the joining of `userId` and `projectId` in the database before allowing access to specific endpoints."

### **Q: How does Prisma work with MongoDB in your project?**

**A:** "Prisma provides a type-safe abstraction over MongoDB. Since MongoDB is schema-less, Prisma's `schema.prisma` acts as the source of truth for the application's data structure. Even though it's NoSQL, I utilized Prisma's relationship features to manage connections between Users, Projects, and Tasks with clean syntax while still benefiting from MongoDB's scalability."

---

## 🟦 React & Frontend

### **Q: How do you handle real-time updates in the frontend?**

**A:** "I used Socket.io-client. When a user enters a project page, they are joined to a 'room' specific to that project ID. When any team member makes a change, the backend emits an event to that room. The frontend listens for these events (e.g., `task_updated`) and updates the local state or triggers a refetch, ensuring everyone sees the latest data instantly without refreshing."

### **Q: Explain your styling strategy with Tailwind CSS v4.**

**A:** "I used Tailwind CSS v4 to build a design system with a 'Modern Retro' aesthetic. I leveraged new v4 features like improved `@apply` directives and cleaner configuration. The UI focuses on bold borders, vibrant colors, and accessibility. I also used Framer Motion for micro-animations to make the interface feel premium and responsive."

---

## 🗄️ Database & Performance

### **Q: How did you optimize analytics queries?**

**A:** "For metrics like 'Daily Active Users', I used MongoDB's Aggregation Pipelines (`$group`, `$match`, `$size`). To ensure these don't slow down the database as it grows, I implemented indexes on `userId` and `createdAt`. Furthermore, I wrapped these results in a Redis cache with a 60-second TTL, reducing the load on MongoDB for frequently visited dashboard views."

### **Q: What is a Compound Index and why did you use one?**

**A:** "A compound index is an index on multiple fields. In the `Event` model, I created a compound index on `[userId, createdAt]`. This is highly efficient for queries that want to 'get the latest events for a specific user', as the database can find the user and sort by date in a single index scan."

---

## 📅 Google Integration & OAuth2

### **Q: Describe the OAuth2 flow you implemented.**

**A:** "I implemented the Authorization Code Flow. 1. The user is redirected to Google. 2. After consent, Google sends an 'authorization code' to my callback URL. 3. My backend exchanges this code for an `access_token` and a `refresh_token`. 4. The tokens are stored securely in the DB. I also implemented logic to automatically use the `refresh_token` when the `access_token` expires, ensuring the calendar sync remains seamless without re-login."

---

## 🏆 Behavioral & Conflict Resolution

### **Q: Tell me about a difficult bug you fixed during this project.**

**A:** "We faced a deployment issue on Render where the server couldn't find the `dist/main.js` file. I realized that loose script files in the root folder were being compiled by NestJS, which caused it to create a nested `dist/src` structure. I fixed this by updating the `tsconfig.build.json` to explicitly exclude root scripts, ensuring a consistent and predictable production build."
