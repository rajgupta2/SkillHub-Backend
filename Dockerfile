FROM node:22-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .

#dummy database url to generate prisma client
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate
RUN npm run build
# Remove dev dependencies
RUN npm prune --omit=dev
EXPOSE 5000
CMD ["npm", "start"]