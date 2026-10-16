"use strict";
const { test } = require("node:test");
const { assert, page, reply, available } = require("./helpers.cjs");

test("a second item adds one distinct row and updates Dearest from the replies", async () => {
  const app = page(available);
  await app.find("pen");
  await app.find("pen");
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
  await app.find("ruler");
  assert.equal(app.elements.status.textContent, "ruler is not in the shop");
  assert.equal(app.elements["card-name"].textContent, "");
  assert.equal(app.elements["card-price"].textContent, "");
  assert.deepEqual(app.rows(), [["pen", "50", "1"]]);
  assert.equal(app.elements.found.textContent, "1");
  assert.equal(app.elements.dearest.textContent, "50");
});

test("empty and whitespace asks do not fetch or alter a populated card", async () => {
  const app = page(available);
  await app.find("pen");
  await app.find("   ");
  await app.find("");
  assert.equal(app.calls.length, 1);
  assert.equal(app.elements.status.textContent, "undefined");
  assert.equal(app.elements["card-name"].textContent, "pen");
  assert.equal(app.elements["card-price"].textContent, "50");
  assert.deepEqual(app.rows(), [["pen", "50", "1"]]);
});

test("a network failure clears the card without losing prior successful rows", async () => {
  let online = true;
  const app = page((url) => online ? available(url) : Promise.reject(new TypeError("Connection refused")));
  await app.find("pen");
  online = false;
  await app.find("copy");
  assert.equal(app.elements.status.textContent, "The server is not answering.");
  assert.equal(app.elements["card-name"].textContent, "");
  assert.equal(app.elements["card-price"].textContent, "");
  assert.deepEqual(app.rows(), [["pen", "50", "1"]]);
  assert.equal(app.elements.found.textContent, "1");
  assert.equal(app.elements.dearest.textContent, "50");
});

test("HTTP errors and malformed replies cannot add a slip row", async () => {
  for (const response of [reply("pen", 999, 500), reply("pen", "50"), reply("pen", -1), reply("pen", Infinity), reply("", 50), { ok: true, status: 200, json: async () => { throw new SyntaxError(); } }]) {
    const app = page(async () => response);
    await app.find("pen");
    assert.equal(app.elements.status.textContent, "The server is not answering.");
    assert.deepEqual(app.rows(), []);
    assert.equal(app.elements.found.textContent, "0");
  }
});

test("Loading disables Find, ignores duplicate asks, and finally restores it", async () => {
  let resolveReply;
  const pendingReply = new Promise((resolve) => { resolveReply = resolve; });
  const app = page(() => pendingReply);
  const pending = app.find("pen");
  assert.equal(app.elements.status.textContent, "Loading…");
  assert.equal(app.elements.find.disabled, true);
  assert.equal(app.elements.card.attributes["aria-busy"], "true");
  await app.find("copy");
  assert.equal(app.calls.length, 1);
  resolveReply(reply("pen", 50));
  await pending;
  assert.equal(app.elements.find.disabled, false);
  assert.equal(app.elements.card.attributes["aria-busy"], "false");
});

test("Find is restored after success, an unknown item, and a rejected request", async () => {
  const app = page(available);
  await app.find("pen");
  assert.equal(app.elements.find.disabled, false);
  await app.find("ruler");
  assert.equal(app.elements.find.disabled, false);
  await app.find("tea");
  assert.equal(app.elements.find.disabled, false);
  const offline = page(() => Promise.reject(new Error("offline")));
  await offline.find("pen");
  assert.equal(offline.elements.find.disabled, false);
  assert.equal(offline.elements.card.attributes["aria-busy"], "false");
});

test("loading the script and refreshing leave the file's initial state intact", async () => {
  const first = page(available);
  assert.equal(first.calls.length, 0);
  assert.equal(first.elements.status.textContent, "Enter an item name to look up its price.");
  assert.equal(first.elements["card-name"].textContent, "");
  assert.equal(first.elements["card-price"].textContent, "");
  assert.deepEqual(first.rows(), []);
  assert.equal(first.elements.found.textContent, "0");
  assert.equal(first.elements.dearest.textContent, "0");
  await first.find("copy");
  const refreshed = page(available);
  assert.equal(refreshed.calls.length, 0);
  assert.deepEqual(refreshed.rows(), []);
  assert.equal(refreshed.elements.found.textContent, "0");
  assert.equal(refreshed.elements.dearest.textContent, "0");
});

test("normalization and encoded input preserve the server's canonical item", async () => {
  const app = page(available);
  await app.find(" PeN ");
  await app.find("PEN");
  assert.deepEqual(app.rows(), [["pen", "50", "2"]]);
  await app.find("pen&item=copy");
  assert.equal(app.calls.at(-1), "/api/price?item=pen%26item%3Dcopy");
  assert.equal(app.rows().length, 1);
});

test("all prices are read from the reply and Dearest tracks updated prices", async () => {
  const replies = [reply("pen", 19), reply("copy", 27), reply("pen", 31), reply("pen", 11), reply("tea", 7)];
  const app = page(async () => replies.shift());
  await app.find("pen");
  await app.find("copy");
  await app.find("pen");
  assert.equal(app.elements.dearest.textContent, "31");
  await app.find("pen");
  assert.equal(app.elements.dearest.textContent, "27");
  await app.find("tea");
  assert.deepEqual(app.rows(), [["pen", "11", "3"], ["copy", "27", "1"], ["tea", "7", "1"]]);
  assert.equal(app.elements.found.textContent, "3");
  assert.equal(app.elements.dearest.textContent, "27");
});

test("Enter submits the form through the same Find handler", async () => {
  const app = page(available);
  let prevented = false;
  app.elements.item.value = "copy";
  app.elements["lookup-form"].listeners.submit({ preventDefault: () => { prevented = true; } });
  await new Promise(setImmediate);
  assert.equal(prevented, true);
  assert.deepEqual(app.rows(), [["copy", "80", "1"]]);
});

test("HTML retains the required empty elements, initial figures and no embedded prices", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const source = fs.readFileSync(path.join(__dirname, "..", "lookup.html"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "..", "lookup.js"), "utf8");
  assert.match(source, /id="card-name"><\/p>/);
  assert.match(source, /id="card-price"><\/span>/);
  assert.match(source, /<tbody id="slip"><\/tbody>/);
  assert.match(source, /id="found"[^>]*>0<\/p>/);
  assert.match(source, /id="dearest">0<\/span>/);
  assert.doesNotMatch(source + script, /\b(?:50|80|40)\b/);
  assert.match(source, /<button id="find" type="button">Find<\/button>/);
});
