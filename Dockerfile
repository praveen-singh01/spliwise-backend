# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port (Cloud Run will set PORT env variable)
EXPOSE 8080

# Start the application
CMD ["node", "src/server.js"]
