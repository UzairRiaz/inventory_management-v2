import dotenv from 'dotenv';
import { getApp } from './app.js';

dotenv.config();

const port = Number(process.env.PORT || 5000);

getApp()
  .then((app) => {
    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Backend startup failed', error);
    process.exit(1);
  });
