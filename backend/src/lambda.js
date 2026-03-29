import serverlessExpress from '@vendia/serverless-express';
import { getApp } from './app.js';

let cachedHandler;

export const handler = async (event, context) => {
  if (!cachedHandler) {
    const app = await getApp();
    cachedHandler = serverlessExpress({ app });
  }

  return cachedHandler(event, context);
};