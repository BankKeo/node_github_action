# 1. Base image with Node
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# 4. Install all dependencies (you need devDeps for tsc)
RUN npm install

# 5. Copy the rest of the source code
COPY . .

# ⬇️ Add this line to include environment variables
COPY .env .env

# 6. Build the TypeScript code
RUN npm run build

# 7. Expose the port your app runs on
EXPOSE 3001

# 8. Run the compiled JavaScript
CMD ["node", "dist/index.js"]