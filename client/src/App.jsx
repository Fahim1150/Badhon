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

/* ---------- Dashboard ---------- */

function Dashboard() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("badhon_user") || "{}");
    } catch {
      return {};
    }
  });

  const [donorStatus, setDonorStatus] = useState("loading");
  const [donorAvailable, setDonorAvailable] = useState(false);
  const [donorError, setDonorError] = useState("");

  const goTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      const token = localStorage.getItem("badhon_token");

      if (!token) {
        goTo("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/donors/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 404) {
          setDonorStatus("incomplete");
          return;
        }

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("badhon_token");
          localStorage.removeItem("badhon_user");
          goTo("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Unable to load donor status");
        }

        setDonorAvailable(data.available === true);
        setDonorStatus("complete");
      } catch (err) {
        setDonorStatus("error");
        setDonorError(err.message || "Unable to load donor status");
      }
    };

    loadDashboardData();
  }, []);

  const displayName = user.name?.trim() || "User";
  const displayEmail = user.email?.trim() || "Not available";
  const displayRole = user.role?.trim() || "USER";

  return (
    <main className="dashboard-page">
      <div className="container dashboard-container">
        <section className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">BADHON Dashboard</p>
            <h1>Welcome, {displayName} 👋</h1>
            <p className="dashboard-intro">
              Your BADHON account at a glance. Manage your profile and keep
              your donor information ready when it matters.
            </p>
          </div>

          <div className="dashboard-role">{displayRole}</div>
        </section>

        <section className="dashboard-summary" aria-label="Account summary">
          <div className="summary-card">
            <span className="summary-icon">👤</span>
            <div>
              <span className="summary-label">Account</span>
              <strong>Active</strong>
            </div>
          </div>

          <div className="summary-card">
            <span className="summary-icon">❤️</span>
            <div>
              <span className="summary-label">Donor profile</span>
              {donorStatus === "loading" ? (
                <strong className="summary-muted">Checking...</strong>
              ) : donorStatus === "complete" ? (
                <strong className={donorAvailable ? "summary-success" : "summary-warning"}>
                  {donorAvailable ? "Available" : "Unavailable"}
                </strong>
              ) : donorStatus === "incomplete" ? (
                <strong className="summary-warning">Not completed</strong>
              ) : (
                <strong className="summary-muted">Unavailable</strong>
              )}
            </div>
          </div>

          <div className="summary-card">
            <span className="summary-icon">🩸</span>
            <div>
              <span className="summary-label">Blood requests</span>
              <strong className="summary-muted">Coming next</strong>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">Quick actions</p>
              <h2>What would you like to do?</h2>
            </div>
          </div>

          <div className="dashboard-actions">
            <button
              className="dashboard-action"
              onClick={() => goTo("/donor")}
            >
              <span className="action-icon">❤️</span>
              <div>
                <strong>
                  {donorStatus === "complete"
                    ? "Manage Donor Profile"
                    : "Complete Donor Profile"}
                </strong>
                <span>
                  Keep your blood group, location, phone, and availability up
                  to date.
                </span>
              </div>
              <span className="action-arrow">→</span>
            </button>

            <div className="dashboard-action dashboard-action-disabled">
              <span className="action-icon">🩸</span>
              <div>
                <strong>Find Blood</strong>
                <span>
                  Blood search and request matching will be available in the
                  next workflow stage.
                </span>
              </div>
              <span className="action-badge">Next</span>
            </div>

            <div className="dashboard-action dashboard-action-disabled">
              <span className="action-icon">📋</span>
              <div>
                <strong>My Requests</strong>
                <span>
                  Request history will appear here after the blood-request
                  workflow is added.
                </span>
              </div>
              <span className="action-badge">Next</span>
            </div>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-heading-row">
              <div>
                <p className="card-eyebrow">Donor readiness</p>
                <h2>Your donor profile</h2>
              </div>
              <span
                className={`status-badge ${
                  donorStatus === "complete"
                    ? "status-complete"
                    : donorStatus === "incomplete"
                      ? "status-incomplete"
                      : donorStatus === "error"
                        ? "status-error"
                        : "status-loading"
                }`}
              >
                {donorStatus === "complete"
                  ? donorAvailable
                    ? "Available"
                    : "Unavailable"
                  : donorStatus === "incomplete"
                    ? "Incomplete"
                    : donorStatus === "error"
                      ? "Unavailable"
                      : "Checking"}
              </span>
            </div>

            {donorStatus === "loading" && (
              <div className="dashboard-state loading-state">
                <span className="state-spinner" aria-hidden="true" />
                <div>
                  <strong>Checking your donor profile</strong>
                  <p>Please wait a moment.</p>
                </div>
              </div>
            )}

            {donorStatus === "complete" && (
              <div className="dashboard-state">
                <span className="state-icon success-icon">✓</span>
                <div>
                  <strong>
                    {donorAvailable
                      ? "Your donor profile is complete and available."
                      : "Your donor profile is complete but unavailable."}
                  </strong>
                  <p>
                    {donorAvailable
                      ? "Your profile can be considered when compatible donors are searched."
                      : "Turn on availability from your donor profile when you are ready to donate."}
                  </p>
                </div>
              </div>
            )}

            {donorStatus === "incomplete" && (
              <div className="dashboard-state">
                <span className="state-icon warning-icon">!</span>
                <div>
                  <strong>Complete your donor profile.</strong>
                  <p>
                    Add your blood group, location, phone number, and
                    availability to prepare your account for donation.
                  </p>
                </div>
              </div>
            )}

            {donorStatus === "error" && (
              <div className="dashboard-state">
                <span className="state-icon error-icon">!</span>
                <div>
                  <strong>We couldn't check your donor profile.</strong>
                  <p>{donorError}</p>
                </div>
              </div>
            )}

            <button
              className="dashboard-button"
              onClick={() => goTo("/donor")}
            >
              {donorStatus === "complete"
                ? "Manage Donor Profile"
                : "Open Donor Profile"}
            </button>
          </div>

          <div className="dashboard-card">
            <div className="card-heading-row">
              <div>
                <p className="card-eyebrow">Next steps</p>
                <h2>Keep your account ready</h2>
              </div>
            </div>

            <div className="next-step-list">
              <div className="next-step">
                <span className="next-step-number">01</span>
                <div>
                  <strong>Complete your donor profile</strong>
                  <p>Make sure your donor information is accurate.</p>
                </div>
              </div>

              <div className="next-step">
                <span className="next-step-number">02</span>
                <div>
                  <strong>Keep availability updated</strong>
                  <p>Update your donor availability whenever it changes.</p>
                </div>
              </div>

              <div className="next-step next-step-muted">
                <span className="next-step-number">03</span>
                <div>
                  <strong>Blood-request workflow</strong>
                  <p>This will be added in the next project segment.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-card account-card">
          <div className="card-heading-row">
            <div>
              <p className="card-eyebrow">Account</p>
              <h2>Account information</h2>
            </div>
          </div>

          <div className="account-info">
            <div>
              <span>Name</span>
              <strong>{displayName}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{displayEmail}</strong>
            </div>
            <div>
              <span>Role</span>
              <strong>{displayRole}</strong>
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
    phone: "",
    district: "",
    available: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const goTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  useEffect(() => {
    const loadDonorProfile = async () => {
      const token = localStorage.getItem("badhon_token");

      if (!token) {
        goTo("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/donors/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.status === 404) {
          setProfileExists(false);
          return;
        }

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("badhon_token");
          localStorage.removeItem("badhon_user");
          goTo("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load donor profile"
          );
        }

        setForm({
          bloodGroup: data.bloodGroup || "",
          phone: data.phone || "",
          district: data.district || "",
          available: data.available ?? true,
        });

        setProfileExists(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDonorProfile();
  }, []);

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

    const phone = form.phone.trim();
    const district = form.district.trim();

    if (!form.bloodGroup) {
      setError("Please select your blood group.");
      return;
    }

    if (!/^01\d{9}$/.test(phone)) {
      setError("Please enter a valid Bangladesh mobile number (01XXXXXXXXX).");
      return;
    }

    if (district.length < 2) {
      setError("Please enter your district or location.");
      return;
    }

    setSaving(true);

    const token = localStorage.getItem("badhon_token");

    if (!token) {
      goTo("/login");
      return;
    }

    try {
      const url = profileExists
        ? `${API_BASE}/donors/me`
        : `${API_BASE}/donors`;

      const method = profileExists ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone,
          bloodGroup: form.bloodGroup,
          district,
          available: form.available,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save donor profile"
        );
      }

      setProfileExists(true);

      setForm({
        bloodGroup: data.bloodGroup || "",
        phone: data.phone || "",
        district: data.district || "",
        available: data.available ?? true,
      });

      setMessage(
        profileExists
          ? "Donor profile updated successfully."
          : "Donor profile created successfully."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="donor-page">
        <div className="donor-container">
          <p>Loading donor profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="donor-page">
      <div className="donor-container">
        <div className="donor-header">
          <p className="dashboard-eyebrow">Donor Profile</p>

          <h1>
            {profileExists
              ? "Manage your donor profile"
              : "Become a BADHON donor"}
          </h1>

          <p>
            Add your information so people who need blood can
            find compatible donors.
          </p>
        </div>

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

        <form
          className="donor-form"
          onSubmit={handleSubmit}
        >
          <section className="donor-form-section">
            <h2>Donor Information</h2>

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
                <label htmlFor="phone">
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                  inputMode="numeric"
                  maxLength={11}
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="district">
                  Location / District
                </label>

                <input
                  id="district"
                  type="text"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder="e.g. Mirpur, Dhaka"
                  required
                />
              </div>
            </div>
          </section>

          <section className="donor-form-section">
            <h2>Availability</h2>

            <label className="availability-checkbox">
              <input
                type="checkbox"
                name="available"
                checked={form.available}
                onChange={handleChange}
              />

              <span>
                <strong>I am currently available to donate blood</strong>
                <small>
                  Turn this off whenever you are not available.
                </small>
              </span>
            </label>
          </section>

          <div className="donor-form-actions">
            <button
              type="button"
              className="dashboard-button dashboard-button-secondary"
              onClick={() => goTo("/dashboard")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="dashboard-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : profileExists
                  ? "Update Donor Profile"
                  : "Create Donor Profile"}
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