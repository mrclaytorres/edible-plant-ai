// app.config.js
const isDev = process.env.APP_ENV !== "production";

export default {
  expo: {
    name: "EdiblePlantsAI",
    slug: "edible-plants-ai",
    version: "1.0.0",
    extra: {
      BASE_API_URI: isDev
        ? process.env.BASE_API_URI_LOCAL // local dev
        : process.env.BASE_API_URI_PROD, // production
    },
  },
};