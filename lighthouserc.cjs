module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        onlyCategories: ["performance"],
        chromeFlags: "--no-sandbox --headless=new --disable-dev-shm-usage",
      },
      url: [
        "http://127.0.0.1:3000/en",
        "http://127.0.0.1:3000/en/explore",
        "http://127.0.0.1:3000/en/objects",
        "http://127.0.0.1:3000/en/properties",
        "http://127.0.0.1:3000/en/services",
        "http://127.0.0.1:3000/en/events",
        "http://127.0.0.1:3000/en/blog",
        "http://127.0.0.1:3000/en/about",
        "http://127.0.0.1:3000/en/contact",
      ],
    },
    upload: {
      target: "filesystem",
      outputDir: "audit-results/v1-09-3-1/lighthouse",
    },
  },
};
