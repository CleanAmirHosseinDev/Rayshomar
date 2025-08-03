document
  .getElementById("createElectionForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const NUM_OF_CANDIDATES = document.getElementById("numOfCandidates").value;
    const voters = document
      .getElementById("voters")
      .value.split(",")
      .map((v) => v.trim());
    // const NUM_OF_VOTES = document.getElementById("numOfVotes").value;
    const NUM_OF_VOTES = document
      .getElementById("numOfVotes")
      .value.split(",")
      .map((v) => v.trim());

    const token = localStorage.getItem("token");

    try {
      const response = await fetch("/election", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, NUM_OF_CANDIDATES, voters, NUM_OF_VOTES }),
      });
      const data = await response.text();
      if (response.ok) {
        alert("Election created successfully!");
      } else {
        alert(data);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while creating the election.");
    }
  });
