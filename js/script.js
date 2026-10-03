// Feature button functionality
const feature1 = document.getElementById("feature1");
const feature2 = document.getElementById("feature2");
const feature3 = document.getElementById("feature3");
const feature4 = document.getElementById("feature4");
const feature5 = document.getElementById("feature5");
const featureDisplay = document.getElementsByClassName("feature-display")[0];

feature1.addEventListener("click", () => {
  featureDisplay.innerHTML = `
        
            <div class="feature-context">
              <div class="feature-text">
                <h4>Secure</h4>
                <h2>
                  Your conversations stay private until you decide otherwise
                </h2>
                <p>
                  Accord encrypts your messages and never shares them. You
                  choose who sees what and when.
                </p>
              </div>
              <div>
                <button>Learn more</button>
              </div>
            </div>
            <div class="feature-image">
              <img src="../assets/images/secure.jpg" alt="feature image" />
            </div>
        
    `;
});

feature2.addEventListener("click", () => {
  featureDisplay.innerHTML = `
        
            <div class="feature-context">
              <div class="feature-text">
                <h4>VERSIONING</h4>
                <h2>
                  Save all versions of your agreements
                </h2>
                <p>
                  Accord saves all versions of your conversations, so you can
                  always go back and see what was agreed upon.
                </p>
              </div>
              <div>
                <button>Learn more</button>
              </div>
            </div>
            <div class="feature-image">
              <img src="../assets/images/versioning.jpg" alt="feature image" />
            </div>
         
    `;
});

feature3.addEventListener("click", () => {
  featureDisplay.innerHTML = `
        
            <div class="feature-context">
              <div class="feature-text">
                <h4>TIMESTAMPS</h4>
                <h2>
                  Everything stays recorded and verifiable
                </h2>
                <p>
                  Worried about losing track of your agreements? Accord timestamps all your conversations, so you can always verify when something was agreed upon.
                </p>
              </div>
              <div>
                <button>Learn more</button>
              </div>
            </div>
            <div class="feature-image">
              <img src="../assets/images/time.jpg" alt="feature image" />
            </div>
         
    `;
});

feature4.addEventListener("click", () => {
  featureDisplay.innerHTML = `
        
            <div class="feature-context">
              <div class="feature-text">
                <h4>SIGNATURES</h4>
                <h2>
                  Sign agreements digitally and securely
                </h2>
                <p>
                  Accord offers a new signature experience that is secure, verifiable, and legally binding. 
                </p>
              </div>
              <div>
                <button>Learn more</button>
              </div>
            </div>
            <div class="feature-image">
              <img src="../assets/images/sign.jpg" alt="feature image" />
            </div>
         
    `;
});

feature5.addEventListener("click", () => {
  featureDisplay.innerHTML = `
        
            <div class="feature-context">
              <div class="feature-text">
                <h4>AI PERMISSIONS</h4>
                <h2>
                    AI Included? Yes, but only when you want it
                </h2>
                <p>
                  Accord AI known for its ability to assist with agreements, but we respect your privacy. You can choose when to use AI features and when to keep your conversations private.
                </p>
              </div>
              <div>
                <button>Learn more</button>
              </div>
            </div>
            <div class="feature-image">
              <img src="../assets/images/ai.jpg" alt="feature image" />
            </div>
         
    `;
});

// Feature Button Functionlity Ends
