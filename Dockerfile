# Node.js official image
FROM node:20

# Workspace creation and configuration
WORKDIR /app

# Copy files
COPY . .

# Create the .env file
RUN cp .env.example .env

# Install dependencies 
RUN if [ -f package.json ]; then npm install; fi

# Install the data folder and generate the other formats (this will take long time)
RUN ./install_data.sh

# Install and build the client
RUN ./install_client.sh

# Port exposition
EXPOSE 3000

# Launch the app
CMD ["node", "index.js"]
