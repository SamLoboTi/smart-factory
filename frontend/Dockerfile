FROM node:18-slim

WORKDIR /app

COPY package*.json .
RUN npm install

COPY . .

EXPOSE 5173

# Host 0.0.0.0 is required for Docker
CMD ["npm", "run", "dev", "--", "--host"]
