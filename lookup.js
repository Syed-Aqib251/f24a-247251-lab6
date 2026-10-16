"use strict";

// These references do not change the sentence or figures in the HTML file.
const itemInput = document.getElementById("item");
const findButton = document.getElementById("find");
const statusLine = document.getElementById("status");
const card = document.getElementById("card");
const cardName = document.getElementById("card-name");
const cardPrice = document.getElementById("card-price");

async function findItem() {
  const name = itemInput.value.trim().toLowerCase();
}

// Store the function reference; do not run a lookup while the page loads.
findButton.addEventListener("click", findItem);
document.getElementById("lookup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  findButton.click();
});
