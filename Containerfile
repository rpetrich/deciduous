FROM docker.io/library/httpd:2.4.48-alpine
LABEL Florian Dubourg <florian@dubourg.lu>

COPY . /usr/local/apache2/htdocs/
RUN rm -rf /usr/local/apache2/htdocs/Containerfile /usr/local/apache2/htdocs/.git
