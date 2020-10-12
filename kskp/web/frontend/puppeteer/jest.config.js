module.exports = {
    "preset": "jest-puppeteer",
    setupFilesAfterEnv: [
      `${process.cwd()}/jest.setup.js`
    ]
  };