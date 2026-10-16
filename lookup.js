"use strict";

// These references do not change the sentence or figures in the HTML file.
const itemInput = document.getElementById("item");
const findButton = document.getElementById("find");
const statusLine = document.getElementById("status");
const card = document.getElementById("card");
const cardName = document.getElementById("card-name");
const cardPrice = document.getElementById("card-price");
const slip = document.getElementById("slip");
const found = document.getElementById("found");
const dearest = document.getElementById("dearest");
// Use the server's canonical name as the key so repeats share one row.
const lookups = new Map();

function recordItem(item, price) {
  let entry = lookups.get(item);
  if (entry) {
    entry.times += 1;
    entry.price = price;
    entry.priceCell.textContent = String(price);
    entry.timesCell.textContent = String(entry.times);
  } else {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const priceCell = document.createElement("td");
    const timesCell = document.createElement("td");
    nameCell.textContent = item;
    priceCell.textContent = String(price);
    timesCell.textContent = "1";
    row.append(nameCell, priceCell, timesCell);
    slip.append(row);
    entry = { price, times: 1, priceCell, timesCell };
    lookups.set(item, entry);
  }
  found.textContent = String(lookups.size);
  dearest.textContent = String(Math.max(0, ...Array.from(lookups.values(), (entry) => entry.price)));
}

function clearCard() {
  cardName.textContent = "";
  cardPrice.textContent = "";
}

async function findItem() {
  if (findButton.disabled) return;
  const name = itemInput.value.trim().toLowerCase();
  // An empty ask never reaches the server and never changes the record.
  if (!name) {
    statusLine.textContent = String(undefined);
    statusLine.dataset.state = "idle";
    return;
  }
  statusLine.textContent = "Loading…";
  statusLine.dataset.state = "loading";
  findButton.disabled = true;
  card.setAttribute("aria-busy", "true");

  try {
    // Encode the name as one query value; prices always come from the reply.
    const response = await fetch(`/api/price?item=${encodeURIComponent(name)}`);
    if (response.status === 404) {
      const missing = await response.json();
      clearCard();
      statusLine.textContent = `${missing.item} is not in the shop`;
      statusLine.dataset.state = "error";
      return;
    }
    if (!response.ok) throw new Error("The lookup request failed.");
    const data = await response.json();
    // A broken reply follows the same recovery path as a broken connection.
    if (typeof data.item !== "string" || !data.item ||
        typeof data.price !== "number" || !Number.isFinite(data.price) || data.price < 0) {
      throw new Error("The server returned an invalid item.");
    }
    cardName.textContent = data.item;
    cardPrice.textContent = String(data.price);
    statusLine.textContent = `${data.item}: Rs ${data.price}`;
    statusLine.dataset.state = "success";
    recordItem(data.item, data.price);
  } catch (error) {
    clearCard();
    statusLine.textContent = "The server is not answering.";
    statusLine.dataset.state = "error";
  } finally {
    // Success, unknown items and connection failures all release the button.
    findButton.disabled = false;
    card.setAttribute("aria-busy", "false");
  }
}

// Store the function reference; do not run a lookup while the page loads.
findButton.addEventListener("click", findItem);
document.getElementById("lookup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  findButton.click();
});
