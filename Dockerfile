# Node.js official image
FROM node:20

# Workspace
WORKDIR /app

# Copy frontend sources (assume vuejs already compiled into assets/vuejs/)
COPY . .

# Install server-side dependencies
RUN npm install

# Expose the frontend port
EXPOSE 3000

# Start the express server
CMD ["node", "index.js"]
