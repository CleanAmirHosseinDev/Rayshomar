FROM node:18

# Install Foundry (latest stable) without manpages to prevent curl tar error
ENV PATH="/root/.foundry/bin:$PATH"
RUN curl -L https://foundry.paradigm.xyz | bash && foundryup


# Create working directory
WORKDIR /usr/src/app

# Copy package.json & install dependencies
COPY main_api_js/package*.json ./
RUN npm install

# Copy rest of the code
COPY main_api_js ./main_api_js
COPY dev_api_foundry ./dev_api_foundry

# Set default workdir
WORKDIR /usr/src/app/main_api_js/src

# Expose port (adjustable by each service)
EXPOSE 5000

# Set default command (can be overridden)
CMD ["node", "app.js"]
