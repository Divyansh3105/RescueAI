export const env = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://rescueai:rescueai@localhost:5432/rescueai',
  port: Number(process.env.PORT ?? 3000),
};
