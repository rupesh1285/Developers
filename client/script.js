/* ================= LOGIN LOGIC ================= */
async function login() {
  // 1. Get values from the input fields
  const emailElement = document.getElementById("email");
  const passwordElement = document.getElementById("password");

  if (!emailElement || !passwordElement) {
    console.error("Email or Password inputs not found!");
    return;
  }

  const email = emailElement.value;
  const password = passwordElement.value;

  try {
    // 2. Send data to backend
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    // 3. Handle Success
    if (response.ok) {
      // Save the token
      localStorage.setItem("token", data.token);
      
      // Redirect to your MAIN page (problems.html)
      window.location.href = "problems.html"; 
    } 
    // 4. Handle Error
    else {
      const msgElement = document.getElementById("message");
      if(msgElement) {
        msgElement.innerText = data.message;
      } else {
        alert("Login failed: " + data.message);
      }
    }
  } catch (err) {
    console.error("Login Error:", err);
    alert("Something went wrong connecting to the server.");
  }
}