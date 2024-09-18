# @adocasts.com/generate-models

> Generate Lucid Models from an existing database

[![npm-image]][npm-url] ![][typescript-image] [![license-image]][license-url]

Whether you're looking to start a new AdonisJS project for an existing database or
you've define your migrations and ran them, this package can help you get up and running by generating models to match your
database schema!

> Note that this likely won't be perfect, always be sure to double-check the files after they're generated.

Here's how it works:

1. It'll use AdonisJS to connect to your database
2. Once connected, it collects your tables, columns, and foreign keys
3. Then, it'll map out what your models should look like for the tables & columns
4. Finally, it'll then use your foreign keys to work backwards and build out your relationships

Here's what's required:

1. Your tables, columns, and foreign keys must be defined in your database
2. Your database must be well structured, deviations will cause anomolies in the generated relationships
3. Your AdonisJS application must have its database connection defined

## Installation

You can easily install and configure via the Ace CLI's `add` command.

```shell
node ace add @adocasts.com/generate-models
```

##### Manual Install & Configure

You can also manually install and configure if you'd prefer

```shell
npm install @adocasts.com/generate-models
```

```shell
node ace configure @adocasts.com/generate-models
```

## Generate Models Command

Right now we only offer one command, and that is the `generate:models` command.

```shell
node ace generate:models
```

This will generate your models and plop them at the location defined within your `adonisrc.ts` file, which is `app/models` by default.
If any of the models already exist in your project, those models will be skipped and will **not** be replaced.

[npm-image]: https://img.shields.io/npm/v/@adocasts.com/generate-models/latest.svg?style=for-the-badge&logo=npm
[npm-url]: https://www.npmjs.com/package/@adocasts.com/generate-models/v/latest 'npm'
[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[license-url]: LICENSE.md
[license-image]: https://img.shields.io/github/license/adocasts/generate-models?style=for-the-badge
