"use strict";

let application;
let initialization;

module.exports = async function handler(req, res) {
  try {
    if (!application) {
      ({ app: application, ready: initialization } = require("../backend/src/server"));
    }
    await initialization;
    return application(req, res);
  } catch (error) {
    console.error("Vercel application initialization failed:", error);
    return res.status(503).json({
      error: "The application could not connect to its required services.",
    });
  }
};
