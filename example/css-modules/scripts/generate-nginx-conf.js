console.log(
`# NOTE: This file uses the nginx.conf from the official nginx docker image as a
# starting point. Feel free to customize as you see fit, but remember things may
# break if you change configurations you aren't familiar with.
#
# NOTE: Although we don't define it here, this container will be run
# non-daemonized so that docker can manage the process. The official nginx
# container specifies the non daemon option on its own so adding it here will
# cause a duplication error when you try to run nginx.

user nginx;
worker_processes 1;

error_log /var/log/nginx/error.log warn;
pid       /var/run/nginx.pid;


events {
  worker_connections 1024;
}


http {
  include      /etc/nginx/mime.types;
  default_type application/octet-stream;

  log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';

  access_log /var/log/nginx/access.log main;

  sendfile on;
  #tcp_nopush on;

  keepalive_timeout 65;

  # CUSTOM CONFIG
  # This is how we host our static React site.
  server {

    # Listen on this port. This would be 80 or 443 on a prod server. Adjust this
    # to suit your own needs.
    listen 80;

    # Server base URL goes here if applicable
    #server_name trustar.co;

    location / {

      # Enable gzip. NOTE: text/html files are always gzipped when enabled
      gzip on;
      gzip_min_length 1000;
      gzip_types text/plain text/css application/javascript application/json image/x-icon;

      # The location of the static files to server
      root /var/www/html;

      # Remove trailing slashes. /about/ -> /about
      # This is important because of how static files are generated.
      rewrite ^/(.*)/$ /$1 permanent;

      # If migrating from a dynamic site you may want to redirect requests to a
      # certain path to a different server. This example redirects all traffic
      # to /blog to blog.example.com
      #rewrite ^/blog(.*)$ $scheme://blog.example.com$1 redirect;

      # Use 404.html as the error page
      error_page 404 /404.html;

      # If a matching file can't be found, handle this request as a 404, which
      # will return the 404 page because of the above directive
      try_files $uri $uri.html $uri/index.html =404;

    }

  }
}`
);
