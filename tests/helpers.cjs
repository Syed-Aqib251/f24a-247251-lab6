"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

// A small DOM adapter lets Node exercise the real page script without packages.
// Browser checks separately verify the HTML, rendering and actual interactions.
class Element {
  constructor() {
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.disabled = false;
    this.value = "";
    this.textContent = "";
  }
  append(...children) { this.children.push(...children); }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  click() { if (!this.disabled) return this.listeners.click?.(); }
}

function page(fetchImpl) {
  const ids = ["item", "find", "status", "card", "card-name", "card-price", "slip", "found", "dearest", "lookup-form"];
  const elements = Object.fromEntries(ids.map((id) => [id, new Element()]));
  elements.status.textContent = "Enter an item name to look up its price.";
  elements.found.textContent = "0";
  elements.dearest.textContent = "0";
  const calls = [];
  const context = {
    document: { getElementById: (id) => elements[id], createElement: () => new Element() },
    fetch: (url) => { calls.push(url); return fetchImpl(url); },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "lookup.js"), "utf8"), context);
  return {
    elements, calls,
    async find(name) {
      elements.item.value = name;
      await elements.find.click();
    },
    rows: () => elements.slip.children.map((row) => row.children.map((cell) => cell.textContent)),
  };
}

function reply(item, price, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => ({ item, price }) };
}

function available(url) {
  const item = new URL(url, "http://localhost").searchParams.get("item");
  const prices = { pen: 50, copy: 80, tea: 40 };
  return Promise.resolve(Object.hasOwn(prices, item) ? reply(item, prices[item]) : reply(item, undefined, 404));
}

module.exports = { assert, page, reply, available };
