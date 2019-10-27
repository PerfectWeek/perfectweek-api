# API

[![Build Status](https://travis-ci.org/PerfectWeek/perfectweek-api.svg?branch=master)](https://travis-ci.org/PerfectWeek/perfectweek-api)

PerfectWeek web API

## Prerequisites

- GIT LFS: see [https://git-lfs.github.com/](https://git-lfs.github.com/)
- docker, docker-compose: see [https://docs.docker.com/install/overview/](https://docs.docker.com/install/overview/)

> Be sure to enable GIT LFS. If you don't, some assets will be incorrectly fetched.
> You can do so by running `git lfs install`

## Quickstart

### Start the development server

To start the development server, run the following from the route of the repository:

```sh
docker-compose up api
```

You can also start the database independently:

```sh
docker-compose up -d db
# "-d" is used to start the container in the background
```

### Stop process

To stop all running containers:

```sh
docker-compose down
```

If you also want to delete the local data (like the database and stored images), run the following:

```sh
docker-compose down -v
```

## Deployment

### Environment configuration

The following environment variables are available. Do not forget to assign values
to the ones without defaults.

| Variable name | Description | Default value |
|----|----|----|
| **PORT** | The port on which the server will accept connections | `80` |
| **DATABASE_URL** | The database connection | `undefined` |
| **JWT_SECRET_KEY** | The key used to cipher JWT tokens | `undefined` |
| **ASSETS_ROOT_DIR** | The directory inside of which uploaded assets will be saved | `/assets` |

### Database migration

Before, running new releases, you will have to make sure that the database
schema is up to date.

You can do so by running the command:

```sh
yarn run typeorm migration:run
```

> Note: Make sure to have the variable `DATABASE_URL` set.

### Docker image

To deploy the projet (in a production environment), you can use the provided
Dockerfile.

```sh
# Build docker image
docker build -t perfectweek-api .

# Create and run the container
docker create --name api -p 80:80 perfectweek-api
docker start api
```

> Note: Additional environment variables might be required to run the
> container correctly.

> You can provide environment variables from the command line using the "-e"
> option. See: [Docker run documentation](https://docs.docker.com/engine/reference/commandline/run/#set-environment-variables--e---env---env-file).
