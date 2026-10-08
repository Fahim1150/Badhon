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
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = response.status;
    throw error;
  }

  return data;
}

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function isDonorProfileComplete(profile) {
  return (
    bloodGroups.includes(profile?.bloodGroup) &&
    /^01\d{9}$/.test((profile?.phone || "").trim()) &&
    (profile?.district || "").trim().length >= 2
  );
}

function getEligibilityDate(lastDonationDate) {
  if (!lastDonationDate) return null;

  const eligibilityDate = new Date(`${lastDonationDate}T00:00:00.000Z`);
  eligibilityDate.setUTCDate(eligibilityDate.getUTCDate() + 90);
  return eligibilityDate.toISOString().slice(0, 10);
}

function isDonorEligible(lastDonationDate) {
  const eligibilityDate = getEligibilityDate(lastDonationDate);
  return !eligibilityDate || eligibilityDate <= new Date().toISOString().slice(0, 10);
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

  window.location.href = "/";
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
  const [user] = useState(() => {
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

        const profileComplete = isDonorProfileComplete(data);
        setDonorAvailable(profileComplete && data.available === true);
        setDonorStatus(profileComplete ? "complete" : "incomplete");
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
          <button
            className="dashboard-button account-edit-button"
            onClick={() => goTo("/profile")}
          >
            Manage user and patient information
          </button>
        </section>
      </div>
    </main>
  );
}

function ProfileManagement() {
  const [account, setAccount] = useState({ name: "", email: "" });
  const [patient, setPatient] = useState({
    name: "",
    age: "",
    gender: "",
    bloodGroup: "",
    phone: "",
    address: "",
    disease: "",
    emergencyContact: "",
  });
  const [patientExists, setPatientExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [patientMessage, setPatientMessage] = useState("");
  const [accountError, setAccountError] = useState("");
  const [patientError, setPatientError] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfiles = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const token = localStorage.getItem("badhon_token");
        const headers = { Authorization: `Bearer ${token}` };
        const userData = await apiRequest("/users/me", { headers });
        let patientData = null;

        try {
          patientData = await apiRequest("/patients/me", { headers });
        } catch (error) {
          if (error.status !== 404) {
            throw error;
          }
        }

        if (!active) return;

        setAccount({ name: userData.name || "", email: userData.email || "" });
        if (patientData) {
          setPatient({
            name: patientData.name || "",
            age: patientData.age ?? "",
            gender: patientData.gender || "",
            bloodGroup: patientData.bloodGroup || "",
            phone: patientData.phone || "",
            address: patientData.address || "",
            disease: patientData.disease || "",
            emergencyContact: patientData.emergencyContact || "",
          });
          setPatientExists(true);
        } else {
          setPatientExists(false);
        }
      } catch (error) {
        if (active) setLoadError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfiles();
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const handleAccountChange = (event) => {
    setAccount((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handlePatientChange = (event) => {
    setPatient((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    setAccountError("");
    setAccountMessage("");
    setSavingAccount(true);

    try {
      const updated = await apiRequest("/users/me", {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("badhon_token")}` },
        body: JSON.stringify(account),
      });
      let storedUser = {};
      try {
        storedUser = JSON.parse(localStorage.getItem("badhon_user") || "{}");
      } catch {
        storedUser = {};
      }
      localStorage.setItem("badhon_user", JSON.stringify({
        ...storedUser,
        id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
      }));
      setAccount({ name: updated.name, email: updated.email });
      setAccountMessage("Account information updated.");
    } catch (error) {
      setAccountError(error.message);
    } finally {
      setSavingAccount(false);
    }
  };

  const savePatient = async (event) => {
    event.preventDefault();
    setPatientError("");
    setPatientMessage("");

    if (!/^01\d{9}$/.test(patient.phone.trim())) {
      setPatientError("Enter a valid Bangladesh mobile number (01XXXXXXXXX).");
      return;
    }

    if (!/^01\d{9}$/.test(patient.emergencyContact.trim())) {
      setPatientError("Enter a valid emergency contact (01XXXXXXXXX).");
      return;
    }

    setSavingPatient(true);

    try {
      const response = await apiRequest("/patients/me", {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("badhon_token")}` },
        body: JSON.stringify({ ...patient, age: Number(patient.age) }),
      });
      setPatientExists(true);
      setPatient({
        ...response.data,
        age: String(response.data.age),
      });
      setPatientMessage("Patient information saved.");
    } catch (error) {
      setPatientError(error.message);
    } finally {
      setSavingPatient(false);
    }
  };

  if (loading) {
    return (
      <main className="profile-page">
        <div className="container profile-container" role="status">
          <span className="state-spinner" aria-hidden="true" />
          <p>Loading your information...</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="profile-page">
        <div className="container profile-container">
          <h1>We couldn't load your information</h1>
          <div className="form-error" role="alert">{loadError}</div>
          <button className="dashboard-button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <div className="container profile-container">
        <header className="profile-header">
          <p className="dashboard-eyebrow">Your information</p>
          <h1>Manage your profile</h1>
          <p>Update your account details and the patient information used for blood requests.</p>
        </header>

        <form className="profile-card" onSubmit={saveAccount}>
          <div className="profile-card-heading">
            <div>
              <h2>Account information</h2>
              <p>These details are used to identify your BADHON account.</p>
            </div>
          </div>
          {accountMessage && <div className="form-success" role="status">{accountMessage}</div>}
          {accountError && <div className="form-error" role="alert">{accountError}</div>}
          <div className="profile-fields">
            <div className="form-group">
              <label htmlFor="account-name">Full name</label>
              <input id="account-name" name="name" value={account.name} onChange={handleAccountChange} minLength={2} maxLength={100} required autoComplete="name" />
            </div>
            <div className="form-group">
              <label htmlFor="account-email">Email</label>
              <input id="account-email" name="email" type="email" value={account.email} onChange={handleAccountChange} required autoComplete="email" />
            </div>
          </div>
          <div className="profile-actions">
            <button className="dashboard-button" type="submit" disabled={savingAccount}>
              {savingAccount ? "Saving..." : "Save account information"}
            </button>
          </div>
        </form>

        <form className="profile-card" onSubmit={savePatient}>
          <div className="profile-card-heading">
            <div>
              <h2>Patient information</h2>
              <p>{patientExists ? "Update the patient details on your account." : "No patient profile yet. Add details to prepare your patient information."}</p>
            </div>
            <span className={`profile-record-badge ${patientExists ? "profile-record-saved" : ""}`}>
              {patientExists ? "Saved" : "Not set up"}
            </span>
          </div>
          {patientMessage && <div className="form-success" role="status">{patientMessage}</div>}
          {patientError && <div className="form-error" role="alert">{patientError}</div>}
          <div className="profile-fields">
            <div className="form-group">
              <label htmlFor="patient-name">Patient full name</label>
              <input id="patient-name" name="name" value={patient.name} onChange={handlePatientChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="patient-age">Age</label>
              <input id="patient-age" name="age" type="number" min="0" max="150" value={patient.age} onChange={handlePatientChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="patient-gender">Gender</label>
              <select id="patient-gender" name="gender" value={patient.gender} onChange={handlePatientChange} required>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="patient-blood-group">Blood group</label>
              <select id="patient-blood-group" name="bloodGroup" value={patient.bloodGroup} onChange={handlePatientChange} required>
                <option value="">Select blood group</option>
                {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="patient-phone">Phone</label>
              <input id="patient-phone" name="phone" type="tel" value={patient.phone} onChange={handlePatientChange} placeholder="01XXXXXXXXX" inputMode="numeric" maxLength={11} required />
            </div>
            <div className="form-group">
              <label htmlFor="patient-emergency-contact">Emergency contact</label>
              <input id="patient-emergency-contact" name="emergencyContact" type="tel" value={patient.emergencyContact} onChange={handlePatientChange} placeholder="01XXXXXXXXX" inputMode="numeric" maxLength={11} required />
            </div>
            <div className="form-group profile-field-wide">
              <label htmlFor="patient-address">Address / location</label>
              <input id="patient-address" name="address" value={patient.address} onChange={handlePatientChange} minLength={2} required />
            </div>
            <div className="form-group profile-field-wide">
              <label htmlFor="patient-disease">Reason for request / condition</label>
              <textarea id="patient-disease" name="disease" value={patient.disease} onChange={handlePatientChange} rows="3" required />
            </div>
          </div>
          <div className="profile-actions">
            <button className="dashboard-button" type="submit" disabled={savingPatient}>
              {savingPatient ? "Saving..." : patientExists ? "Update patient information" : "Save patient information"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function DonorProfile() {
  const [form, setForm] = useState({
    bloodGroup: "",
    phone: "",
    district: "",
    lastDonationDate: "",
    available: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const goTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  useEffect(() => {
    const loadDonorProfile = async () => {
      setLoading(true);
      setLoadError(false);
      setError("");

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
          lastDonationDate: data.lastDonationDate
            ? new Date(data.lastDonationDate).toISOString().slice(0, 10)
            : "",
          available: isDonorProfileComplete(data) && data.available === true,
        });

        setProfile(data);
        setProfileExists(true);
      } catch (err) {
        setError(err.message);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    loadDonorProfile();
  }, [loadAttempt]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: type === "checkbox" ? checked : value,
      };

      if (!isDonorProfileComplete(updated)) {
        updated.available = false;
      }

      if (!isDonorEligible(updated.lastDonationDate)) {
        updated.available = false;
      }

      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const phone = form.phone.trim();
    const district = form.district.trim();

    if (!bloodGroups.includes(form.bloodGroup)) {
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
          lastDonationDate: form.lastDonationDate || null,
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
      setProfile(data);

      setForm({
        bloodGroup: data.bloodGroup || "",
        phone: data.phone || "",
        district: data.district || "",
        lastDonationDate: data.lastDonationDate
          ? new Date(data.lastDonationDate).toISOString().slice(0, 10)
          : "",
        available: isDonorProfileComplete(data) && data.available === true,
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
        <div className="donor-container donor-loading" role="status">
          <span className="state-spinner" aria-hidden="true" />
          <p>Loading your donor profile...</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="donor-page">
        <div className="donor-container">
          <div className="donor-header">
            <p className="dashboard-eyebrow">Donor Profile</p>
            <h1>We couldn't load your profile</h1>
          </div>
          <div className="form-error" role="alert">{error}</div>
          <button
            type="button"
            className="dashboard-button"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const eligibilityDate = getEligibilityDate(form.lastDonationDate);
  const donorEligible = isDonorEligible(form.lastDonationDate);

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

        <section
          className={`donor-readiness ${
            isDonorProfileComplete(form) && form.available
              ? "donor-readiness-available"
              : ""
          }`}
          aria-live="polite"
        >
          <span className="donor-readiness-icon" aria-hidden="true">
            {isDonorProfileComplete(form) && donorEligible
              ? form.available ? "✓" : "•"
              : "!"}
          </span>
          <div>
            <strong>
              {!isDonorProfileComplete(form)
                ? "Profile incomplete"
                : !donorEligible
                  ? "Within estimated cooldown"
                  : form.available
                  ? "Listed as available"
                  : "Currently unavailable"}
            </strong>
            <p>
              {!isDonorProfileComplete(form)
                ? "Add a valid blood group, Bangladesh mobile number, and location before turning on availability."
                : !donorEligible
                  ? `A 90-day interval estimate places your next availability date on ${eligibilityDate}. Donation center screening determines actual eligibility.`
                  : form.available
                  ? "Your profile is marked available. A donation center will confirm eligibility through screening."
                  : "Your complete profile is saved, but you are not listed as available."}
            </p>
            {profile && (
              <small>
                Donor: {profile.name} · {profile.email}
              </small>
            )}
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

        {!profileExists && !error && (
          <div className="donor-empty-state">
            <strong>Your donor profile is not set up yet.</strong>
            <p>Complete the details below to create your profile. It will remain unavailable until you choose to turn availability on.</p>
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

              <div className="form-group">
                <label htmlFor="lastDonationDate">
                  Last Donation Date
                </label>

                <input
                  id="lastDonationDate"
                  type="date"
                  name="lastDonationDate"
                  value={form.lastDonationDate}
                  onChange={handleChange}
                  max={new Date().toISOString().slice(0, 10)}
                />
                <small className="field-hint">
                  Optional. A 90-day interval is only an estimate; your donation center determines eligibility.
                </small>
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
                disabled={
                  (!isDonorProfileComplete(form) || !donorEligible) &&
                  !form.available
                }
                aria-label="List my donor profile as available"
              />

              <span>
                <strong>
                  {form.available ? "List me as available" : "Keep me unavailable"}
                </strong>
                <small>
                  {isDonorProfileComplete(form)
                    ? donorEligible
                      ? "Turn availability off whenever you are not ready to donate."
                      : `Availability returns on ${eligibilityDate}.`
                    : "Complete your donor information to enable this toggle."}
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

  if (path === "/profile") {
    if (!token) {
      window.history.replaceState({}, "", "/login");
      return <AuthPage mode="login" />;
    }

    return <ProfileManagement />;
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