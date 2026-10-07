/*  
   ACCORD — SIGNUP FLOW
     */

/*  
   1. ELEMENTS
     */

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");

const step1Section = document.querySelector(".step1-section");
const step2Section = document.querySelector(".step2-section");
const step3Section = document.querySelector(".step3-section");

const step1Submit = document.getElementById("step1-submit");
const step2Submit = document.getElementById("step2-submit");
const step3Submit = document.getElementById("step3-submit");

const emailInput = document.getElementById("signup-email");
const usernameInput = document.getElementById("signup-username");
const passwordInput = document.getElementById("signup-password");

const ninInput = document.getElementById("nin");
const locationInput = document.getElementById("location");

const preferenceButtons = document.querySelectorAll(".preference-btn");

const notification = document.getElementById("step-notification");
const notificationMessage = document.getElementById("notification-message");
const notificationClose = document.getElementById("notification-close");

/*
   The loading screen is intentionally NOT used yet.
   We will build that later.
*/

/*  
   2. SIGNUP STATE
     */

let currentStep = 1;

const signupData = {
  email: "",
  username: "",
  password: "",
  preference: "",
  nin: "",
  location: "",
};

/*  
   3. NOTIFICATION
     */

function showNotification(message) {
  if (!notification || !notificationMessage) {
    alert(message);
    return;
  }

  notificationMessage.textContent = message;

  notification.classList.add("show");

  clearTimeout(window.notificationTimer);

  window.notificationTimer = setTimeout(() => {
    notification.classList.remove("show");
  }, 5000);
}

function hideNotification() {
  if (!notification) return;

  notification.classList.remove("show");
}

if (notificationClose) {
  notificationClose.addEventListener("click", hideNotification);
}

/*  
   4. STEP DISPLAY
     */

function showStep(stepNumber) {
  currentStep = stepNumber;

  /* Hide all sections */

  if (step1Section) {
    step1Section.style.display = "none";
  }

  if (step2Section) {
    step2Section.style.display = "none";
  }

  if (step3Section) {
    step3Section.style.display = "none";
  }

  /* Remove active state */

  step1?.classList.remove("active");
  step2?.classList.remove("active");
  step3?.classList.remove("active");

  /* Show selected section */

  if (stepNumber === 1) {
    step1Section.style.display = "flex";
    step1.classList.add("active");
  }

  if (stepNumber === 2) {
    step2Section.style.display = "flex";
    step2.classList.add("active");
  }

  if (stepNumber === 3) {
    step3Section.style.display = "flex";
    step3.classList.add("active");
  }

  hideNotification();
}

/*  
   5. STEP 1 VALIDATION
     */

function validateStep1() {
  const email = emailInput.value.trim();
  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  /* Email */

  if (!email) {
    showNotification("Please enter your email address before continuing.");
    emailInput.focus();
    return false;
  }

  if (!emailInput.checkValidity()) {
    showNotification("Please enter a valid email address.");
    emailInput.focus();
    return false;
  }

  /* Username */

  if (!username) {
    showNotification("Please choose a username before continuing.");
    usernameInput.focus();
    return false;
  }

  /*
     Username rules:

     - 3–30 characters
     - Letters
     - Numbers
     - Underscores
  */

  const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;

  if (!usernamePattern.test(username)) {
    showNotification(
      "Username must be 3–30 characters and contain only letters, numbers or underscores.",
    );

    usernameInput.focus();
    return false;
  }

  /* Password */

  if (!password) {
    showNotification("Please create a password before continuing.");
    passwordInput.focus();
    return false;
  }

  if (password.length < 6) {
    showNotification("Your password should contain at least 6 characters.");

    passwordInput.focus();
    return false;
  }

  /* Save Step 1 */

  signupData.email = email;
  signupData.username = username;
  signupData.password = password;

  /*
     Keep the displayed username normalized.
     This means MaryDoe and marydoe are treated
     as the same username.
  */

  usernameInput.value = username;

  return true;
}

/*  
   6. STEP 2 VALIDATION
     */

function validateStep2() {
  if (!signupData.preference) {
    showNotification(
      "Please select how you intend to use Accord before continuing.",
    );

    return false;
  }

  return true;
}

/*  
   7. STEP 3 VALIDATION
     */

function validateStep3() {
  const nin = ninInput.value.trim();
  const location = locationInput.value.trim();

  /* NIN */

  if (!nin) {
    showNotification("Please provide your NIN before continuing.");
    ninInput.focus();
    return false;
  }

  /*
     For the current demo we only require
     that a NIN value exists.

     We are NOT attempting to verify it
     against a government service yet.
  */

  /* Location */

  if (!location) {
    showNotification("Please provide your current location before continuing.");

    locationInput.focus();
    return false;
  }

  /* Save Step 3 */

  signupData.nin = nin;
  signupData.location = location;

  return true;
}

/*  
   8. STEP 1 → STEP 2
     */

if (step1Submit) {
  step1Submit.addEventListener("click", (event) => {
    event.preventDefault();

    if (!validateStep1()) {
      return;
    }

    step1.classList.add("completed");

    showStep(2);
  });
}

/*  
   9. STEP 2 → STEP 3
     */

if (step2Submit) {
  step2Submit.addEventListener("click", (event) => {
    event.preventDefault();

    if (!validateStep2()) {
      return;
    }

    step2.classList.add("completed");

    showStep(3);
  });
}

/*  
   10. STEP 3 → ACCOUNT CREATION
     */

if (step3Submit) {
  step3Submit.addEventListener("click", async (event) => {
    event.preventDefault();

    if (!validateStep3()) {
      return;
    }

    await createAccount();
  });
}

/*  
   11. PREFERENCE SELECTION
     */

preferenceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    /* Remove previous selection */

    preferenceButtons.forEach((item) => {
      item.classList.remove("selected");
    });

    /* Select current button */

    button.classList.add("selected");

    /*
       Expected HTML:

       <button
         class="preference-btn"
         data-preference="ai">
         Just here for the AI
       </button>
    */

    signupData.preference = button.dataset.preference;

    hideNotification();
  });
});

/*  
   12. STEP INDICATOR NAVIGATION
     */

/*
   STEP 1

   Always accessible because the user should
   be able to return and edit their information.
*/

if (step1) {
  step1.addEventListener("click", () => {
    showStep(1);
  });
}

/*
   STEP 2

   Requires Step 1.
*/

if (step2) {
  step2.addEventListener("click", () => {
    if (!signupData.email || !signupData.username || !signupData.password) {
      showNotification("Please complete Step 1 before proceeding to Step 2.");

      return;
    }

    showStep(2);
  });
}

/*
   STEP 3

   Requires Step 1 AND Step 2.
*/

if (step3) {
  step3.addEventListener("click", () => {
    if (!signupData.email || !signupData.username || !signupData.password) {
      showNotification("Please complete Step 1 before proceeding to Step 3.");

      return;
    }

    if (!signupData.preference) {
      showNotification("Please complete Step 2 before proceeding to Step 3.");

      return;
    }

    showStep(3);
  });
}

/*  
   13. SUPABASE ACCOUNT CREATION
     */

async function createAccount() {
  try {
    /*
       Make sure the Supabase client exists.
    */

    if (!supabaseClient) {
      throw new Error(
        "Supabase is not connected. Please check your Supabase configuration.",
      );
    }

    /*
       Create the authentication account.

       Email + password are managed by
       Supabase Auth.
    */

    const { data, error } = await supabaseClient.auth.signUp({
      email: signupData.email,
      password: signupData.password,
    });

    if (error) {
      throw error;
    }

    const user = data.user;

    if (!user) {
      throw new Error("Account could not be created.");
    }

    /*
       IMPORTANT:

       Supabase may require email confirmation.

       If email confirmation is enabled and Supabase
       does not return a session, we cannot insert
       into our protected tables yet.
    */

    if (!data.session) {
      showNotification(
        "Your account was created. Please confirm your email address, then log in to continue.",
      );

      /*
         We keep the signup information temporarily
         so it can be completed after login.
      */

      sessionStorage.setItem(
        "accord_pending_signup",
        JSON.stringify({
          userId: user.id,
          username: signupData.username,
          preference: signupData.preference,
          nin: signupData.nin,
          location: signupData.location,
        }),
      );

      return;
    }

    /*
       At this point the user has an authenticated
       Supabase session, so RLS allows us to create
       their profile.
    */

    /* =====================================================
       CREATE PROFILE
       ===================================================== */

    const { error: profileError } = await supabaseClient
      .from("profiles")
      .insert({
        id: user.id,
        username: signupData.username,
        preference: signupData.preference,
        location: signupData.location,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);

      /*
         Handle duplicate username.
      */

      if (
        profileError.code === "23505" ||
        profileError.message?.toLowerCase().includes("duplicate")
      ) {
        showNotification(
          "That username is already taken. Please choose another username.",
        );

        showStep(1);

        usernameInput.focus();

        return;
      }

      throw new Error(
        "Your account was created, but we could not create your profile.",
      );
    }

    /* =====================================================
       CREATE IDENTITY VERIFICATION RECORD
       ===================================================== */

    const { error: verificationError } = await supabaseClient
      .from("identity_verifications")
      .insert({
        user_id: user.id,
        nin: signupData.nin,
        status: "pending",
      });

    if (verificationError) {
      console.error("Identity verification error:", verificationError);

      /*
         The account and profile exist, but the
         verification record failed.
      */

      showNotification(
        "Your account was created, but we could not save your identity information. Please try again.",
      );

      return;
    }

    /* =====================================================
       SIGNUP COMPLETE
       ===================================================== */

    showNotification("Your Accord account has been created successfully.");

    /*
       Give the notification a moment to appear,
       then take the user into Accord.
    */

    setTimeout(() => {
      window.location.href = "../../messages.html";
    }, 1200);
  } catch (error) {
    console.error("Signup error:", error);

    const message = error?.message || "";

    /*
       Email already registered
    */

    if (message.toLowerCase().includes("already registered")) {
      showNotification(
        "An account with this email already exists. Please log in instead.",
      );

      return;
    }

    /*
       Duplicate username
    */

    if (message.toLowerCase().includes("username")) {
      showNotification(
        "That username is already taken. Please choose another username.",
      );

      showStep(1);

      usernameInput.focus();

      return;
    }

    /*
       Password problem
    */

    if (message.toLowerCase().includes("password")) {
      showNotification(
        "Your password does not meet the required security requirements.",
      );

      return;
    }

    /*
       Generic error
    */

    showNotification(
      message ||
        "Something went wrong while creating your account. Please try again.",
    );
  }
}

/*  
   14. INITIAL STATE
     */

showStep(1);
