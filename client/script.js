async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const response = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (response.ok) {
    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";
  } else {
    document.getElementById("message").innerText = data.message;
  }
}


async function loadDashboard() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const response = await fetch("http://localhost:5000/api/progress/summary", {
    headers: {
      "Authorization": "Bearer " + token
    }
  });

  const data = await response.json();

  document.getElementById("total").innerText = data.totalProblems;
  document.getElementById("solved").innerText = data.solvedProblems;
  document.getElementById("percentage").innerText = data.percentage;

  document.getElementById("progressBar").style.width =
    data.percentage + "%";
}

// Auto-run if dashboard page
if (window.location.pathname.includes("dashboard.html")) {
  loadDashboard();
}

async function loadProblems() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const resProblems = await fetch("http://localhost:5000/api/problems");
  const problems = await resProblems.json();

  const resProgress = await fetch("http://localhost:5000/api/progress", {
    headers: { "Authorization": "Bearer " + token }
  });
  const progress = await resProgress.json();

  const solvedIds = progress.map(p => p.problem._id);

  const container = document.getElementById("problemList");
  container.innerHTML = "";

  problems.forEach(problem => {
    const div = document.createElement("div");

    const isSolved = solvedIds.includes(problem._id);

    div.innerHTML = `
      <p>
        <strong>${problem.title}</strong>
        (${problem.difficulty})
        <button onclick="markSolved('${problem._id}')"
          ${isSolved ? "disabled" : ""}>
          ${isSolved ? "Solved" : "Mark Solved"}
        </button>
      </p>
    `;

    container.appendChild(div);
  });
}

async function markSolved(problemId) {
  const token = localStorage.getItem("token");

  await fetch("http://localhost:5000/api/progress/" + problemId, {
    method: "POST",
    headers: { "Authorization": "Bearer " + token }
  });

  loadProblems(); // refresh list
}

// Auto-run if problems page
if (window.location.pathname.includes("problems.html")) {
  loadProblems();
}