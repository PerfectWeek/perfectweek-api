FROM benardg/node-bcrypt

VOLUME /app
WORKDIR /app

EXPOSE 3000

CMD yarn install \
    && yarn run typeorm migration:up \
    && yarn run dev
