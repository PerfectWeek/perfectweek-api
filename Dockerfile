FROM benardg/node-bcrypt

VOLUME /app
WORKDIR /app

EXPOSE 3000

CMD yarn install \
    && yarn run typeorm migration:run \
    && yarn run dev
