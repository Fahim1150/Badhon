import { useEffect, useState } from "react";
import "./App.css";

const API_BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(
    /\/$/,
    ""
  );

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

/* ---------- Shared UI ---------- */

function Logo() {
  return (
    <a
      href="/"
      className="logo"
      onClick={(e) => {
        e.preventDefault();
        navigate("/");
      }}
    >
      <span className="logo-icon">♥</span>
      BADHON
    </a>
  );
}

function Header() {
  const token = localStorage.getItem("badhon_token");

  const handleLogout = () => {
    localStorage.removeItem("badhon_token");
    localStorage.removeItem("badhon_user");

    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const goTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <header className="site-header">
      <div className="container nav-container">
        <button className="logo-button" onClick={() => goTo("/")}>
          <span className="logo-icon">🩸</span>
          <span className="logo-text">BADHON</span>
        </button>

        <nav className="main-nav">
          <button onClick={() => goTo("/")}>Home</button>

          <button onClick={() => goTo("/requests")}>
            Find Blood
          </button>

          {token ? (
            <>
              <button onClick={() => goTo("/dashboard")}>
                Dashboard
              </button>

              <button
                className="nav-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => goTo("/login")}>
                Login
              </button>

              <button
                className="nav-register"
                onClick={() => goTo("/register")}
              >
                Register
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer id="contact" className="footer">
      <div className="container footer-content">
        <div>
          <Logo />

          <p>Connecting blood donors with people in need.</p>
        </div>

        <div className="footer-links">
          <a href="/">Home</a>
          <a href="/#about">About</a>
          <a href="/#how-it-works">How It Works</a>
          <a href="/#contact">Contact</a>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© 2026 BADHON. Built to help save lives.</p>
      </div>
    </footer>
  );
}

/* ---------- Home ---------- */

function Home() {
  return (
    <div className="app">
      <Header />

      <main>
        <section id="home" className="hero-section">
          <div className="container hero-content">
            <div className="hero-text">
              <span className="eyebrow">SAVE LIVES • DONATE BLOOD</span>

              <h1>
                Every Drop Can
                <span>Save a Life.</span>
              </h1>

              <p>
                BADHON connects blood donors with people who need blood.
                Find a donor, become a donor, and help build a stronger
                community.
              </p>

              <div className="hero-actions">
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => navigate("/requests")}
                >
                  Find Blood
                </button>

                <button
                  className="btn btn-outline btn-large"
                  onClick={() => navigate("/register")}
                >
                  Become a Donor
                </button>
              </div>

              <div className="hero-stats">
                <div>
                  <strong>24/7</strong>
                  <span>Community Support</span>
                </div>

                <div>
                  <strong>100%</strong>
                  <span>Donation Focused</span>
                </div>

                <div>
                  <strong>1</strong>
                  <span>Goal: Save Lives</span>
                </div>
              </div>
            </div>

            <div className="hero-card">
              <div className="blood-drop">♥</div>

              <h2>Someone needs blood.</h2>

              <p>
                Your donation could be the reason someone gets another chance
                at life.
              </p>

              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate("/register")}
              >
                Donate Blood
              </button>
            </div>
          </div>
        </section>

        <section id="about" className="section">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">WHY BADHON?</span>

              <h2>Connecting people when it matters most.</h2>

              <p>
                BADHON is designed to make blood donation easier, faster,
                and more accessible.
              </p>
            </div>

            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon">🩸</div>
                <h3>Find Blood</h3>
                <p>
                  Search for blood requests based on blood group and location.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🤝</div>
                <h3>Become a Donor</h3>
                <p>
                  Register as a donor and make yourself available to people
                  who need help.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📍</div>
                <h3>Local Connections</h3>
                <p>
                  Help connect donors and recipients within nearby areas.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section section-light">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">HOW IT WORKS</span>

              <h2>Three simple steps.</h2>
            </div>

            <div className="steps">
              <div className="step">
                <div className="step-number">01</div>
                <h3>Create an account</h3>
                <p>
                  Register on BADHON as a donor or a person looking for blood.
                </p>
              </div>

              <div className="step">
                <div className="step-number">02</div>
                <h3>Find a match</h3>
                <p>
                  Search available blood requests or donors based on your
                  requirements.
                </p>
              </div>

              <div className="step">
                <div className="step-number">03</div>
                <h3>Save a life</h3>
                <p>
                  Connect with the community and help someone receive the
                  blood they need.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container cta-content">
            <div>
              <span className="eyebrow">MAKE A DIFFERENCE</span>

              <h2>One donation can make a real difference.</h2>

              <p>
                Join BADHON and become part of a community that helps people
                when they need it most.
              </p>
            </div>

            <button
              className="btn btn-white btn-large"
              onClick={() => navigate("/register")}
            >
              Join BADHON
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ---------- Authentication ---------- */

function AuthPage({ mode }) {
  const isRegister = mode === "register";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (isRegister && !form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    if (isRegister && form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister
        ? "/auth/register"
        : "/auth/login";

      const body = isRegister
        ? {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }
        : {
          email: form.email.trim(),
          password: form.password,
        };

      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (isRegister) {
        setSuccess(
          "Registration successful. You can now log in to BADHON."
        );

        setForm({
          name: "",
          email: "",
          password: "",
        });
      } else {
        localStorage.setItem("badhon_token", data.token);
        localStorage.setItem(
          "badhon_user",
          JSON.stringify(data.user)
        );

        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Logo />

          <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>

          <p>
            {isRegister
              ? "Join BADHON and become part of the blood donation community."
              : "Sign in to continue to your BADHON account."}
          </p>
        </div>

        {error && <div className="form-message error">{error}</div>}

        {success && (
          <div className="form-message success">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <label>
              Full name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                autoComplete="name"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete={
                isRegister ? "new-password" : "current-password"
              }
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-large btn-full"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Login"}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button onClick={() => navigate("/login")}>
                Login
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button onClick={() => navigate("/register")}>
                Register
              </button>
            </>
          )}
        </div>

        <button
          className="back-home"
          onClick={() => navigate("/")}
        >
          ← Back to BADHON
        </button>
      </div>
    </div>
  );
}

/* ---------- Temporary Dashboard ---------- */

function Dashboard() {
  const user = JSON.parse(
    localStorage.getItem("badhon_user") || "{}"
  );

  const goTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <main className="dashboard-page">
      <div className="container dashboard-container">

        <section className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">
              BADHON Dashboard
            </p>

            <h1>
              Welcome, {user.name || "User"} 👋
            </h1>

            <p className="dashboard-intro">
              Manage your blood requests, donor information,
              and account from one place.
            </p>
          </div>

          <div className="dashboard-role">
            {user.role || "USER"}
          </div>
        </section>

        <section className="dashboard-actions">

          <button
            className="dashboard-action primary"
            onClick={() => goTo("/requests")}
          >
            <span className="action-icon">🩸</span>

            <div>
              <strong>Find Blood</strong>
              <span>
                Search for available blood requests
              </span>
            </div>
          </button>

          <button
            className="dashboard-action"
            onClick={() => goTo("/donor")}
          >
            <span className="action-icon">❤️</span>

            <div>
              <strong>Donor Profile</strong>
              <span>
                Manage your donor information
              </span>
            </div>
          </button>

          <button
            className="dashboard-action"
            onClick={() => goTo("/my-requests")}
          >
            <span className="action-icon">📋</span>

            <div>
              <strong>My Requests</strong>
              <span>
                View your blood request history
              </span>
            </div>
          </button>

        </section>

        <section className="dashboard-grid">

          <div className="dashboard-card">
            <h2>My Blood Requests</h2>

            <div className="empty-dashboard">
              <span>🩸</span>

              <h3>No requests yet</h3>

              <p>
                Your blood requests will appear here.
              </p>

              <button
                className="dashboard-button"
                onClick={() => goTo("/requests/new")}
              >
                Create Blood Request
              </button>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Donor Status</h2>

            <div className="donor-status">
              <div className="status-icon">
                ❤️
              </div>

              <div>
                <strong>Donor profile not completed</strong>

                <p>
                  Complete your donor profile so you can
                  help people who need blood.
                </p>
              </div>
            </div>

            <button
              className="dashboard-button secondary"
              onClick={() => goTo("/donor")}
            >
              Complete Donor Profile
            </button>
          </div>

        </section>

        <section className="dashboard-card account-card">
          <h2>Account Information</h2>

          <div className="account-info">

            <div>
              <span>Name</span>
              <strong>{user.name || "Not available"}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{user.email || "Not available"}</strong>
            </div>

            <div>
              <span>Role</span>
              <strong>{user.role || "USER"}</strong>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}

function DonorProfile() {
  const [form, setForm] = useState({
    bloodGroup: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    location: "",
    available: true,
    lastDonationDate: "",
    emergencyContact: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const goTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("badhon_token");

      if (!token) {
        goTo("/login");
        return;
      }

      const response = await fetch(`${API_BASE}/donors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: form.phone,
          bloodGroup: form.bloodGroup,
          district: form.location,
          available: form.available,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create donor profile"
        );
      }

      setMessage("Donor profile created successfully.");

    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <main className="donor-page">
      <div className="container donor-container">

        <div className="donor-header">
          <div>
            <p className="dashboard-eyebrow">
              Donor Profile
            </p>

            <h1>Become a BADHON donor</h1>

            <p>
              Add your information so people who need blood
              can find compatible donors.
            </p>
          </div>
        </div>

        <form
          className="donor-form"
          onSubmit={handleSubmit}
        >

          <section className="donor-form-section">
            <h2>Basic Information</h2>

            <div className="form-grid">

              <div className="form-group">
                <label htmlFor="bloodGroup">
                  Blood Group
                </label>

                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select blood group
                  </option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">
                  Date of Birth
                </label>

                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">
                  Gender
                </label>

                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select gender
                  </option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>

            </div>
          </section>

          <section className="donor-form-section">
            <h2>Location & Availability</h2>

            <div className="form-group">
              <label htmlFor="location">
                Location
              </label>

              <input
                id="location"
                name="location"
                type="text"
                placeholder="Example: Mirpur, Dhaka"
                value={form.location}
                onChange={handleChange}
                required
              />
            </div>

            <label className="availability-checkbox">
              <input
                type="checkbox"
                name="available"
                checked={form.available}
                onChange={handleChange}
              />

              <span>
                I am currently available to donate blood
              </span>
            </label>
          </section>

          <section className="donor-form-section">
            <h2>Donation History</h2>

            <div className="form-group">
              <label htmlFor="lastDonationDate">
                Last Donation Date
              </label>

              <input
                id="lastDonationDate"
                name="lastDonationDate"
                type="date"
                value={form.lastDonationDate}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className="donor-form-section">
            <h2>Emergency Contact</h2>

            <div className="form-group">
              <label htmlFor="emergencyContact">
                Emergency Contact
              </label>

              <input
                id="emergencyContact"
                name="emergencyContact"
                type="tel"
                placeholder="Emergency contact number"
                value={form.emergencyContact}
                onChange={handleChange}
              />
            </div>
          </section>

          {message && (
            <div className="form-success">
              {message}
            </div>
          )}

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="donor-form-actions">
            <button
              type="button"
              className="dashboard-button secondary"
              onClick={() => goTo("/dashboard")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="dashboard-button"
            >
              Save Donor Profile
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}

/* ---------- Router ---------- */

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const token = localStorage.getItem("badhon_token");

  if (path === "/dashboard" && !token) {
    window.history.replaceState({}, "", "/login");
    return <AuthPage mode="login" />;
  }

  if (path === "/register") {
    return <AuthPage mode="register" />;
  }

  if (path === "/login") {
    return <AuthPage mode="login" />;
  }

  if (path === "/dashboard") {
    return <Dashboard />;
  }

  if (path === "/donor") {
    if (!token) {
      window.history.replaceState({}, "", "/login");
      return <AuthPage mode="login" />;
    }

    return <DonorProfile />;
  }

  return <Home />;
}

export default App;