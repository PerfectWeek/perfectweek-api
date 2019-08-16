# API

[![Build Status](https://travis-ci.org/PerfectWeek/perfectweek-api.svg?branch=master)](https://travis-ci.org/PerfectWeek/perfectweek-api)

PerfectWeek web API

## Prerequisites

- docker
- docker-compose

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
