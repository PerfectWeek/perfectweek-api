FROM benardg/node-bcrypt

VOLUME /app
WORKDIR /app

CMD yarn install \
    && yarn run typeorm migration:run \
    && yarn run dev
