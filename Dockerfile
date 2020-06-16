# build environment
FROM node:14.4.0-alpine as build
RUN mkdir -p /usr/app/src
WORKDIR /usr/app
COPY src /usr/app/src
COPY public /usr/app/src
ENV PATH /usr/app/node_modules/.bin:$PATH
COPY package.json /usr/app
COPY package-lock.json /usr/app
RUN npm ci --silent
RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY --from=build /usr/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
