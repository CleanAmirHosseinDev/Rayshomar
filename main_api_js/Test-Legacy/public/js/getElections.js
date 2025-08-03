// logic for getting elections

async function fetchData() {
  try {
    const token = localStorage.getItem("token");
    //get data from backend
    const response = await fetch("/vote", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("not found status", response.status === 404);
    if (response.status === 404) {
      const h1Elem = document.getElementById("status");
      h1Elem.innerHTML = "you have no access to any election ";
      throw new Error(
        `HTTP error! status: ${response.status} You have no access to any election`
      );
    }
    const data = await response.json();
    console.log(data); // This will log the data after it's fetched
    return data; // This ensures fetchData resolves with the fetched data
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    throw error; // Rethrow the error to handle it outside fetchData if necessary
  }
}

function renderList(data) {
  const ulElement = document.getElementById("dynamic-list");
  ulElement.innerHTML = "";
  data.forEach((item) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    const nameDiv = document.createElement("div");
    const addressDiv = document.createElement("div");

    link.href = `castVote?contractAddress=${item.contractAddress}`;
    link.className = "election-link";

    nameDiv.className = "election-name";
    addressDiv.className = "election-address";

    nameDiv.textContent = `Name: ${item.name}`;
    addressDiv.textContent = `Address: ${item.contractAddress}`;

    link.appendChild(nameDiv);
    link.appendChild(addressDiv);
    li.appendChild(link);

    ulElement.appendChild(li);
  });
}

async function main() {
  const data = await fetchData();
  console.log(data);
  renderList(data);
}

main();
