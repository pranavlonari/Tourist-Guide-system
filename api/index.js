"use strict";

const { app, ready } = require("../backend/src/server");

module.exports = async function handler(req, res) {
  try {
    await ready;
    return app(req, res);
  } catch (error) {
    console.error("Vercel application initialization failed:", error);
    return res.status(503).json({
      error: "The application could not connect to its required services.",
    });
  }
};
