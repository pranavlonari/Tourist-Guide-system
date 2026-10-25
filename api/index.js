"use strict";

const { app, ready } = require("../backend/src/server");

module.exports = async function handler(req, res) {
  await ready;
  return app(req, res);
};
