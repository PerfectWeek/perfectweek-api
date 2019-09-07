FROM benardg/node-bcrypt

# Set workdir
WORKDIR /app

# Install node dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Setup env
ENV PORT 80
ENV ASSETS_ROOT_DIR /assets

# Copy source files
COPY ./ ./

# Startup command
CMD yarn run start
