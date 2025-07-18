#======Node.js official image
FROM node:20

#------Workspace creation and configuration
WORKDIR /app

# Copy files
COPY . .

# Create the .env file
RUN cp .env.example .env

#------Install dependencies
RUN if [ -f package.json ]; then npm install; fi

#------Install and build the client
RUN ./install_client.sh

#------Install the data folder and generate the other formats (this will take a while)
#---Fist install verovio
# Install tools to build verovio
RUN apt-get update && apt-get install -y cmake g++-12 pip python3-venv librsvg2-bin

# Clone and build verovio
RUN git clone https://github.com/rism-ch/verovio
WORKDIR /app/verovio
RUN git checkout develop-humdrum
WORKDIR /app/verovio/tools
RUN cmake ../cmake
RUN make
RUN make install

#---Then install the data folder
WORKDIR /app

# run the data installation script
RUN ./install_data.sh

#------Port exposition
EXPOSE 3000

# Launch the app
CMD ["node", "index.js"]
