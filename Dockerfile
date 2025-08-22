# Base image
FROM node:18

# Set environment variables for Foundry
ENV FOUNDRY_HOME=/root/.foundry
ENV PATH="$FOUNDRY_HOME/bin:$PATH"

# Install dependencies for Foundry + curl + git + build tools
RUN apt-get update && apt-get install -y \
  curl \
  git \
  build-essential \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install Foundry
RUN mkdir -p $FOUNDRY_HOME/bin && \
  curl -L https://foundry.paradigm.xyz | bash && \
  foundryup

# Set working directory
WORKDIR /usr/src/app

# Copy package.json & install Node.js dependencies
COPY main_api_js/package*.json ./
RUN npm install --production

# Copy rest of the project
COPY main_api_js ./main_api_js
COPY dev_api_foundry ./dev_api_foundry

# Set default workdir inside container
WORKDIR /usr/src/app/main_api_js/src

# Expose API port
EXPOSE 5000

# Default command
CMD ["node", "app.js"]
