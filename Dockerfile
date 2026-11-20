# Етап 1: збирання React-клієнта
FROM node:20-alpine AS client
WORKDIR /client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Етап 2: Ruby-сервер, що віддає API та зібраний клієнт
FROM ruby:3.3-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential libpq-dev \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server/Gemfile server/Gemfile.lock* ./
RUN bundle install
COPY server/ ./
COPY db ./db
COPY --from=client /client/dist ./public
ENV RACK_ENV=production
EXPOSE 10000
CMD ruby bin/prepare_db.rb && exec bundle exec ruby app.rb
