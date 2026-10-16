"use strict";
const { test } = require("node:test");
const { assert, page, reply, available } = require("./helpers.cjs");

test("a second item adds one distinct row and updates Dearest from the replies", async () => {
  const app = page(available);
  await app.find("pen");
  // Until the final recovery topic, reset the disabled control between asks.
  app.elements.find.disabled = false;
  await app.find("pen");
  app.elements.find.disabled = false;
  await app.find("copy");
  assert.deepEqual(app.rows(), [["pen", "50", "2"], ["copy", "80", "1"]]);
  assert.equal(app.elements.found.textContent, "2");
  assert.equal(app.elements.dearest.textContent, "80");
  assert.equal(app.elements["card-name"].textContent, "copy");
  assert.equal(app.elements["card-price"].textContent, "80");
});

test("an unknown item blanks the card and preserves the slip and figures", async () => {
  const app = page(available);
  await app.find("pen");
  app.elements.find.disabled = false;
  await app.find("ruler");
  assert.equal(app.elements.status.textContent, "ruler is not in the shop");
  assert.equal(app.elements["card-name"].textContent, "");
  assert.equal(app.elements["card-price"].textContent, "");
  assert.deepEqual(app.rows(), [["pen", "50", "1"]]);
  assert.equal(app.elements.found.textContent, "1");
  assert.equal(app.elements.dearest.textContent, "50");
});
