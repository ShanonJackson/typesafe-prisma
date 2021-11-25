# Typesafe REST API's in NextJS example
```bash
docker-compose --project-name typesafe-api up -d
npm i
npx prisma migrate dev
npx prisma generate
npm run dev
```

Types fully REST style API's on the body, query and response for type-safe API contracts that are guaranteed
at build time.

Error handling examples included in the posts API.