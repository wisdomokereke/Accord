document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const submitButton = document.getElementById("submit-btn");
  const loadScreen = document.getElementById("load-screen");

  if (!loginForm) {
    console.error("Login form not found.");
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showLoginError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      // Find the Supabase Auth email belonging to this username.
      const { data: email, error: usernameError } = await supabaseClient.rpc(
        "get_auth_email_by_username",
        {
          requested_username: username,
        },
      );

      if (usernameError) {
        console.error("Username lookup error:", usernameError);
        throw new Error("Invalid username or password.");
      }

      if (!email) {
        throw new Error("Invalid username or password.");
      }

      // Sign in using the actual Supabase Auth email.
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase login error:", error);
        throw new Error("Invalid username or password.");
      }

      if (!data.session) {
        throw new Error("Login could not be completed.");
      }

      console.log("Login successful.");

      // Show loading screen before redirecting.
      if (loadScreen) {
        loadScreen.style.display = "flex";
      }

      window.location.href = "../../messages.html";
    } catch (error) {
      console.error("Login error:", error);

      setLoading(false);

      showLoginError(error.message || "Unable to log in. Please try again.");
    }
  });

  function setLoading(isLoading) {
    if (isLoading) {
      submitButton.disabled = true;
      submitButton.textContent = "Logging in...";
    } else {
      submitButton.disabled = false;
      submitButton.textContent = "Log in";
    }
  }

  function showLoginError(message) {
    // Remove an existing error if there is one.
    const existingError = document.getElementById("login-error");

    if (existingError) {
      existingError.remove();
    }

    const errorElement = document.createElement("p");

    errorElement.id = "login-error";
    errorElement.textContent = message;

    errorElement.style.marginTop = "12px";
    errorElement.style.color = "#b42318";
    errorElement.style.fontSize = "14px";

    loginForm.appendChild(errorElement);
  }
});
