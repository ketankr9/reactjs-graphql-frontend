# build environment
FROM node:14.4.0-alpine as build
ARG APP_DIR=/usr/src/app
RUN mkdir -p ${APP_DIR}
COPY src ${APP_DIR}/src
COPY public ${APP_DIR}/public
ENV PATH ${APP_DIR}/node_modules/.bin:$PATH
COPY package.json ${APP_DIR}
COPY package-lock.json ${APP_DIR}
WORKDIR ${APP_DIR}
RUN npm ci --silent
RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
