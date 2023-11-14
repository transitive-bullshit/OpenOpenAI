# OpenOpenAIAssistant <!-- omit in toc -->

<p>
  <a href="https://github.com/transitive-bullshit/OpenOpenAI/actions/workflows/test.yml"><img alt="Build Status" src="https://github.com/transitive-bullshit/OpenOpenAI/actions/workflows/test.yml/badge.svg" /></a>
  <a href="https://github.com/transitive-bullshit/OpenOpenAI/blob/main/license"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue" /></a>
  <a href="https://prettier.io"><img alt="Prettier Code Formatting" src="https://img.shields.io/badge/code_style-prettier-brightgreen.svg" /></a>
</p>

- [Intro](#intro)
- [TODO](#todo)
- [Development](#development)
  - [Environment](#environment)
- [License](#license)

## Intro

TODO

## TODO

- prefix ids (see [prisma 3391](https://github.com/prisma/prisma/issues/3391) and [prisma 6719](https://github.com/prisma/prisma/issues/6719))

- get hosted redis working
- handle locking thread and messages
- built-in retrieval tool
- built-in interpreter tool

## Development

- [node](https://nodejs.org/en) >= 18
- [pnpm](https://pnpm.io) >= 8

```bash
pnpm install
```

### Environment

```bash
cp .env.example .env
```

## License

MIT © [Travis Fischer](https://transitivebullsh.it)
