const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root first, then workspace root fallback.
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isLambdaTestEnabled =
  process.env.RUN_LAMBDATEST === 'true' &&
  Boolean(process.env.LT_USERNAME && process.env.LT_ACCESS_KEY);
const braveExecutablePath = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';

const localProject = {
  name: 'brave-local',
  use: {
    ...devices['Desktop Chrome'],
    browserName: 'chromium',
    headless: false,
    launchOptions: {
      executablePath: braveExecutablePath
    }
  }
};

const lambdaTestProject = isLambdaTestEnabled
  ? {
      name: 'chromium-lambdatest',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        headless: true,
        connectOptions: {
          wsEndpoint: `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(
            JSON.stringify({
              browserName: 'Chrome',
              browserVersion: 'latest',
              'LT:Options': {
                platform: 'Windows 11',
                build: 'Amazon Playwright Build',
                name: 'Amazon E2E',
                user: process.env.LT_USERNAME,
                accessKey: process.env.LT_ACCESS_KEY,
                video: true,
                network: true,
                console: true
              }
            })
          )}`
        }
      }
    }
  : null;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90 * 1000,
  expect: {
    timeout: 20 * 1000
  },
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://www.amazon.com',
    headless: false,
    trace: 'on',
    video: 'on',
    screenshot: 'on',
    actionTimeout: 20 * 1000,
    navigationTimeout: 45 * 1000
  },
  projects: lambdaTestProject ? [localProject, lambdaTestProject] : [localProject]
});
