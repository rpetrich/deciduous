# Stage 1: Build the static assets using Chainguard's Node image.
# This image provides a secure, minimal Node.js environment.
FROM cgr.dev/chainguard/node:latest-dev AS builder

# Set the working directory inside the builder container.
WORKDIR /app

# Download and unpack the repository into /app while setting correct ownership.
# (Note: Using ADD with a Git URL downloads the repository archive.)
ADD --chown=node:node https://github.com/rpetrich/deciduous.git /app/

# Install dependencies and build the application.
RUN npm install && npm run build

# Stage 2: Serve the built static files using Chainguard's distroless Nginx image.
# This image is designed with a minimal footprint and enhanced security,
# containing only what is required to run Nginx. Its default document root is /usr/share/nginx/html.
FROM cgr.dev/chainguard/nginx

# Copy static files from the builder stage into the Nginx document root.
# Files are assigned to the nginx user and given read permissions.
COPY --from=builder --chown=nginx:nginx --chmod=400 ["/app/deciduous-logo-dark.png", \
        "/app/deciduous-logo.png", \
        "/app/favicon.ico", \
        "/app/index.html", \
        "/app/layout.js", \
	"/usr/share/nginx/html/"]

# Expose port 8080 since Nginx listens on this port by default.
EXPOSE 8080
