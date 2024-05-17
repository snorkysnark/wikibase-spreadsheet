# Wikidata Editor

### Как запустить локально

#### Wikibase:

Открыть [.env](docker/.env) и придумать себе `ADMIN_PASSWORD`

```sh
cd docker
docker compose -f docker-compose.yml -f docker-compose.extra.yml up -d
```

Если все заработало, через некоторое время появятся:

- http://localhost:8030/wiki/Main_Page - интерфейс wikidata
- http://localhost:8834/ - сервис sparql запросов

У меня иногда не с первого раза запускалось, надо смотреть в логи сервисов

#### Редактор:

```sh
npm install
npm run dev
```

Заходим на http://localhost:5173/, можно залогиниться как `admin` или в вики создать другого пользователя
