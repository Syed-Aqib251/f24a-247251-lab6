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

function recordItem(item, price) {
  const row = document.createElement("tr");
  for (const value of [item, price, 1]) {
    const cell = document.createElement("td");
    cell.textContent = String(value);
    row.append(cell);
  }
  slip.append(row);
  found.textContent = String(slip.children.length);
  dearest.textContent = String(Math.max(Number(dearest.textContent), price));
}

async function findItem() {
  if (findButton.disabled) return;
  const name = itemInput.value.trim().toLowerCase();
  statusLine.textContent = "Loading…";
  statusLine.dataset.state = "loading";
  findButton.disabled = true;
  card.setAttribute("aria-busy", "true");
  // Encode the name as one query value; prices always come from the reply.
  const response = await fetch(`/api/price?item=${encodeURIComponent(name)}`);
  const data = await response.json();
  cardName.textContent = data.item;
  cardPrice.textContent = String(data.price);
  statusLine.textContent = `${data.item}: Rs ${data.price}`;
  statusLine.dataset.state = "success";
  recordItem(data.item, data.price);
}

// Store the function reference; do not run a lookup while the page loads.
findButton.addEventListener("click", findItem);
document.getElementById("lookup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  findButton.click();
});
