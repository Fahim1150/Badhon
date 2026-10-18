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
  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Unable to connect. Check your connection and try again.");
  }

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

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("badhon_user") || "{}");
  } catch {
    return {};
  }
}

function GlobalResponsiveStyles() {
  return (
    <style>{`
      @media (max-width: 900px) {
        .hero-content {
          grid-template-columns: 1fr;
          gap: 32px;
        }

        .feature-grid,
        .steps,
        .dashboard-summary,
        .dashboard-actions,
        .dashboard-grid {
          grid-template-columns: 1fr;
        }

        .dashboard-header,
        .cta-content,
        .nav-container,
        .footer-content {
          flex-direction: column;
          align-items: flex-start;
        }

        .main-nav {
          flex-wrap: wrap;
        }
      }

      @media (max-width: 640px) {
        .hero-section {
          padding: 58px 0;
        }

        .auth-card {
          padding: 24px 18px;
        }

        .hero-text h1 {
          font-size: clamp(2.5rem, 11vw, 3.6rem);
        }

        .section-heading h2,
        .cta-content h2,
        .dashboard-header h1 {
          font-size: clamp(2rem, 7vw, 2.8rem);
        }

        .main-nav {
          width: 100%;
        }

        .main-nav button {
          flex: 1 1 calc(50% - 8px);
        }

        .dashboard-card,
        .feature-card,
        .step {
          padding: 18px;
        }

        .dashboard-action {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      .role-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px 10px;
        border-radius: 999px;
        background: #fee2e2;
        color: #991b1b;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }

      .admin-panel {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-top: 20px;
      }

      .admin-stat {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 18px;
      }

      .admin-stat-label {
        display: block;
        margin-bottom: 10px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #6b7280;
      }

      .admin-stat-value {
        font-size: 28px;
        font-weight: 800;
        color: #111827;
      }

      .admin-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 22px;
      }

      .admin-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 14px;
      }

      .admin-table th,
      .admin-table td {
        text-align: left;
        padding: 12px 10px;
        border-bottom: 1px solid #f3f4f6;
        font-size: 14px;
      }

      .admin-table th {
        color: #6b7280;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      @media (max-width: 640px) {
        .admin-panel {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}

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
  const user = getStoredUser();
  const userRole = (user.role || "").toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("badhon_token");
    localStorage.removeItem("badhon_user");
    sessionStorage.setItem("badhon_notice", "You have been logged out.");
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
          <button onClick={() => goTo("/requests")}>Find Blood</button>

          {token ? (
            <>
              {userRole === "ADMIN" && <button onClick={() => goTo("/admin")}>Admin</button>}
              <button onClick={() => goTo("/dashboard")}>Dashboard</button>
              <button onClick={() => goTo("/profile")}>Profile</button>
              <button className="nav-logout" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => goTo("/login")}>Login</button>
              <button className="nav-register" onClick={() => goTo("/register")}>Register</button>
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

function Feedback({ type, children }) {
  const isError = type === "error";

  return (
    <div
      className={`feedback-state feedback-${type}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      {children}
    </div>
  );
}

function Home() {
  const [notice] = useState(() => sessionStorage.getItem("badhon_notice") || "");

  useEffect(() => {
    if (notice) {
      sessionStorage.removeItem("badhon_notice");
    }
  }, [notice]);

  return (
    <div className="app">
      <GlobalResponsiveStyles />
      <Header />

      {notice && (
        <div className="container home-notice">
          <Feedback type="success">{notice}</Feedback>
        </div>
      )}

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
                BADHON connects blood donors with people who need blood. Find a donor,
                become a donor, and help build a stronger community.
              </p>

              <div className="hero-actions">
                <button className="btn btn-primary btn-large" onClick={() => navigate("/requests")}>Find Blood</button>
                <button className="btn btn-outline btn-large" onClick={() => navigate("/register")}>Become a Donor</button>
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
              <p>Your donation could be the reason someone gets another chance at life.</p>
              <button className="btn btn-primary btn-full" onClick={() => navigate("/register")}>Donate Blood</button>
            </div>
          </div>
        </section>

        <section id="about" className="section">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">WHY BADHON?</span>
              <h2>Connecting people when it matters most.</h2>
              <p>BADHON is designed to make blood donation easier, faster, and more accessible.</p>
            </div>

            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon">🩸</div>
                <h3>Find Blood</h3>
                <p>Search for blood requests based on blood group and location.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🤝</div>
                <h3>Become a Donor</h3>
                <p>Register as a donor and make yourself available to people who need help.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📍</div>
                <h3>Local Connections</h3>
                <p>Help connect donors and recipients within nearby areas.</p>
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
                <p>Register on BADHON as a donor or a person looking for blood.</p>
              </div>

              <div className="step">
                <div className="step-number">02</div>
                <h3>Find a match</h3>
                <p>Search available blood requests or donors based on your requirements.</p>
              </div>

              <div className="step">
                <div className="step-number">03</div>
                <h3>Save a life</h3>
                <p>Connect with the community and help someone receive the blood they need.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container cta-content">
            <div>
              <span className="eyebrow">MAKE A DIFFERENCE</span>
              <h2>One donation can make a real difference.</h2>
              <p>Join BADHON and become part of a community that helps people when they need it most.</p>
            </div>

            <button className="btn btn-white btn-large" onClick={() => navigate("/register")}>Join BADHON</button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function AuthPage({ mode }) {
  const isRegister = mode === "register";

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const body = isRegister
        ? { name: form.name.trim(), email: form.email.trim(), password: form.password }
        : { email: form.email.trim(), password: form.password };

      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (isRegister) {
        setSuccess("Registration successful. You can now log in to BADHON.");
        setForm({ name: "", email: "", password: "" });
      } else {
        localStorage.setItem("badhon_token", data.token);
        localStorage.setItem("badhon_user", JSON.stringify(data.user));
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
      <GlobalResponsiveStyles />
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

        {error && <Feedback type="error">{error}</Feedback>}
        {success && <Feedback type="success">{success}</Feedback>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <label>
              Full name
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Enter your name" autoComplete="name" />
            </label>
          )}

          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
          </label>

          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter your password" autoComplete={isRegister ? "new-password" : "current-password"} />
          </label>

          <button type="submit" className="btn btn-primary btn-large btn-full" disabled={loading}>
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? (
            <>
              Already have an account? <button onClick={() => navigate("/login")}>Login</button>
            </>
          ) : (
            <>
              Don't have an account? <button onClick={() => navigate("/register")}>Register</button>
            </>
          )}
        </div>

        <button className="back-home" onClick={() => navigate("/")}>← Back to BADHON</button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [user] = useState(() => getStoredUser());
  const [donorStatus, setDonorStatus] = useState("loading");
  const [donorAvailable, setDonorAvailable] = useState(false);
  const [donorError, setDonorError] = useState("");
  const [requestsSummary, setRequestsSummary] = useState({ total: 0, active: 0, pending: 0, matched: 0, myRequests: 0 });
  const [recentRequests, setRecentRequests] = useState([]);

  const goTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const isAdmin = (user.role || "").toUpperCase() === "ADMIN";

  useEffect(() => {
    const loadDashboardData = async () => {
      const token = localStorage.getItem("badhon_token");

      if (!token) {
        goTo("/login");
        return;
      }

      try {
        const data = await apiRequest("/donors/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profileComplete = isDonorProfileComplete(data);
        setDonorAvailable(profileComplete && data.available === true);
        setDonorStatus(profileComplete ? "complete" : "incomplete");
      } catch (err) {
        if (err.status === 404) {
          setDonorStatus("incomplete");
        } else if (err.status === 401 || err.status === 403) {
          localStorage.removeItem("badhon_token");
          localStorage.removeItem("badhon_user");
          goTo("/login");
          return;
        } else {
          setDonorStatus("error");
          setDonorError(err.message || "Unable to load donor status");
        }
      }

      try {
        const reqData = await apiRequest("/blood-requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (Array.isArray(reqData)) {
          const active = reqData.filter((r) => r.status === "Pending" || r.status === "Matched");
          const mine = reqData.filter((r) => {
            const reqUser = r.requester?._id || r.requester;
            const myId = user.id || user._id;
            return reqUser && myId && reqUser.toString() === myId.toString();
          });
          setRequestsSummary({
            total: reqData.length,
            active: active.length,
            pending: reqData.filter((r) => r.status === "Pending").length,
            matched: reqData.filter((r) => r.status === "Matched").length,
            myRequests: mine.length,
          });
          setRecentRequests(active.slice(0, 4));
        }
      } catch {
        // supplementary metrics
      }
    };

    loadDashboardData();
  }, [user._id, user.id]);

  const displayName = user.name?.trim() || "";
  const displayEmail = user.email?.trim() || "";
  const displayRole = user.role?.trim() || "";
  const hasAccountInformation = Boolean(displayName && displayEmail);

  return (
    <>
      <Header />
      <main className="dashboard-page">
        <GlobalResponsiveStyles />
        <div className="container dashboard-container">
          <section className="dashboard-header">
            <div>
              <p className="dashboard-eyebrow">BADHON Dashboard</p>
              <h1>{displayName ? `Welcome, ${displayName}` : "Welcome to BADHON"}</h1>
              <p className="dashboard-intro">
                Your BADHON account at a glance. Manage your profile and keep your donor information ready when it matters.
              </p>
            </div>

            <div className="dashboard-role">
              {isAdmin ? <span className="role-chip">Admin</span> : displayRole || "Role not set"}
            </div>
          </section>

          <section className="dashboard-summary" aria-label="Account summary">
            <div className="summary-card">
              <span className="summary-icon">👤</span>
              <div>
                <span className="summary-label">Account</span>
                <strong className={hasAccountInformation ? "summary-success" : "summary-warning"}>
                  {hasAccountInformation ? "Active" : "Information needed"}
                </strong>
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

            <div className="summary-card" onClick={() => goTo("/requests")} style={{ cursor: "pointer" }}>
              <span className="summary-icon">🩸</span>
              <div>
                <span className="summary-label">Blood requests</span>
                {requestsSummary.active > 0 ? (
                  <strong className="summary-success">
                    {requestsSummary.active} Active Request{requestsSummary.active !== 1 ? "s" : ""}
                  </strong>
                ) : requestsSummary.total > 0 ? (
                  <strong className="summary-muted">
                    {requestsSummary.total} Total Requests
                  </strong>
                ) : (
                  <strong className="summary-muted">No active requests</strong>
                )}
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
              <button className="dashboard-action" onClick={() => goTo("/donor")}>
                <span className="action-icon">❤️</span>
                <div>
                  <strong>{donorStatus === "complete" ? "Manage Donor Profile" : "Complete Donor Profile"}</strong>
                  <span>Keep your blood group, location, phone, and availability up to date.</span>
                </div>
                <span className="action-arrow">→</span>
              </button>

              <button className="dashboard-action primary" onClick={() => goTo("/requests")}>
                <span className="action-icon">🩸</span>
                <div>
                  <strong>Find Blood Requests</strong>
                  <span>Browse emergency requests, accept to donate, or manage patient requests.</span>
                </div>
                <span className="action-arrow">→</span>
              </button>

              <button className="dashboard-action" onClick={() => goTo("/requests?create=true")}>
                <span className="action-icon">➕</span>
                <div>
                  <strong>Post Blood Request</strong>
                  <span>Need blood for a patient? Create an emergency request for donors.</span>
                </div>
                <span className="action-arrow">→</span>
              </button>

              {isAdmin && (
                <button className="dashboard-action" onClick={() => goTo("/admin")}>
                  <span className="action-icon">⚙️</span>
                  <div>
                    <strong>Admin Panel</strong>
                    <span>Review user and donor activity from one place.</span>
                  </div>
                  <span className="action-arrow">→</span>
                </button>
              )}
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="dashboard-card">
              <div className="card-heading-row">
                <div>
                  <p className="card-eyebrow">Donor readiness</p>
                  <h2>Your donor profile</h2>
                </div>
                <span className={`status-badge ${donorStatus === "complete" ? "status-complete" : donorStatus === "incomplete" ? "status-incomplete" : donorStatus === "error" ? "status-error" : "status-loading"}`}>
                  {donorStatus === "complete" ? (donorAvailable ? "Available" : "Unavailable") : donorStatus === "incomplete" ? "Incomplete" : donorStatus === "error" ? "Unavailable" : "Checking"}
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
                    <strong>{donorAvailable ? "Your donor profile is complete and available." : "Your donor profile is complete but unavailable."}</strong>
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
                    <p>Add your blood group, location, phone number, and availability to prepare your account for donation.</p>
                  </div>
                </div>
              )}

              {donorStatus === "error" && (
                <div className="dashboard-state" role="alert">
                  <span className="state-icon error-icon">!</span>
                  <div>
                    <strong>We couldn't check your donor profile.</strong>
                    <p>{donorError}</p>
                  </div>
                </div>
              )}

              <button className="dashboard-button" onClick={() => goTo("/donor")}>
                {donorStatus === "complete" ? "Manage Donor Profile" : "Open Donor Profile"}
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

                <div className="next-step" onClick={() => goTo("/requests")} style={{ cursor: "pointer" }}>
                  <span className="next-step-number">03</span>
                  <div>
                    <strong>Blood-request management</strong>
                    <p>Create and monitor blood requests, or respond to save a life.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {recentRequests.length > 0 && (
            <section className="dashboard-section" style={{ marginTop: "32px" }}>
              <div className="dashboard-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <p className="dashboard-eyebrow">Emergency calls</p>
                  <h2>Active blood requests</h2>
                </div>
                <button className="btn btn-outline" onClick={() => goTo("/requests")}>
                  View all blood requests →
                </button>
              </div>

              <div className="requests-grid">
                {recentRequests.map((req) => (
                  <div key={req._id} className={`request-card ${req.urgency === "Emergency" ? "emergency-card" : ""}`}>
                    <div className="request-card-top">
                      <span className="blood-badge">{req.bloodGroup}</span>
                      <div className="badge-group">
                        <span className={`urgency-badge urgency-${req.urgency}`}>{req.urgency}</span>
                        <span className={`status-tag status-${req.status}`}>{req.status}</span>
                      </div>
                    </div>

                    <div className="request-card-info">
                      <h3>
                        {req.patientName} <span className="units-tag">{req.requiredUnits} Unit{req.requiredUnits > 1 ? "s" : ""}</span>
                      </h3>
                      <div className="request-card-details">
                        <div className="request-detail-row">
                          <span className="request-detail-icon">📍</span>
                          <span>{req.hospital ? `${req.hospital}, ` : ""}{req.location}</span>
                        </div>
                        <div className="request-detail-row">
                          <span className="request-detail-icon">📞</span>
                          <a href={`tel:${req.contactNumber}`} style={{ color: "inherit", textDecoration: "none" }}>
                            {req.contactNumber}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="request-card-actions">
                      <button className="btn-sm btn-secondary" onClick={() => goTo("/requests")}>
                        View in Blood Requests →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
                <strong>{displayName || "Not provided"}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{displayEmail || "Not provided"}</strong>
              </div>
              <div>
                <span>Role</span>
                <strong>{displayRole || "Not available"}</strong>
              </div>
            </div>

            {!hasAccountInformation && (
              <Feedback type="warning">
                Some account information is missing. Add your name and email to complete your account details.
              </Feedback>
            )}

            <button className="dashboard-button account-edit-button" onClick={() => goTo("/profile")}>
              Manage user and patient information
            </button>
          </section>
        </div>
      </main>
    </>
  );
}

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAdminData = async () => {
      const token = localStorage.getItem("badhon_token");
      const storedUser = getStoredUser();

      if (!token) {
        navigate("/login");
        return;
      }

      if ((storedUser.role || "").toUpperCase() !== "ADMIN") {
        sessionStorage.setItem("badhon_notice", "Admin access required.");
        navigate("/dashboard");
        return;
      }

      try {
        const [userResponse, donorResponse] = await Promise.all([
          apiRequest("/users", { headers: { Authorization: `Bearer ${token}` } }),
          apiRequest("/donors", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setUsers(Array.isArray(userResponse) ? userResponse : []);
        setDonors(Array.isArray(donorResponse) ? donorResponse : []);
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem("badhon_token");
          localStorage.removeItem("badhon_user");
          sessionStorage.setItem("badhon_notice", "Please log in again.");
          navigate("/login");
          return;
        }

        setError(err.message || "Unable to load admin data.");
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="dashboard-page">
          <GlobalResponsiveStyles />
          <div className="container dashboard-container">
            <div className="dashboard-state loading-state">
              <span className="state-spinner" aria-hidden="true" />
              <div>
                <strong>Loading admin overview</strong>
                <p>Please wait a moment.</p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="dashboard-page">
        <GlobalResponsiveStyles />
        <div className="container dashboard-container">
          <section className="dashboard-header">
            <div>
              <p className="dashboard-eyebrow">Administration</p>
              <h1>Admin control center</h1>
              <p className="dashboard-intro">Review key user and donor activity for the BADHON platform.</p>
            </div>
            <span className="role-chip">Admin</span>
          </section>

          {error && <Feedback type="error">{error}</Feedback>}

          <div className="admin-panel">
            <div className="admin-stat">
              <span className="admin-stat-label">Total users</span>
              <div className="admin-stat-value">{users.length}</div>
            </div>

            <div className="admin-stat">
              <span className="admin-stat-label">Donor profiles</span>
              <div className="admin-stat-value">{donors.length}</div>
            </div>

            <div className="admin-stat">
              <span className="admin-stat-label">Access level</span>
              <div className="admin-stat-value">ADMIN</div>
            </div>
          </div>

          <div className="dashboard-grid" style={{ marginTop: "24px" }}>
            <div className="admin-card">
              <div className="card-heading-row">
                <div>
                  <p className="card-eyebrow">Users</p>
                  <h2>Registered accounts</h2>
                </div>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="3">No users found.</td>
                    </tr>
                  ) : (
                    users.slice(0, 6).map((user) => (
                      <tr key={user._id || user.id || user.email}>
                        <td>{user.name || "Unknown"}</td>
                        <td>{user.email || "—"}</td>
                        <td>{user.role || "USER"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-card">
              <div className="card-heading-row">
                <div>
                  <p className="card-eyebrow">Donors</p>
                  <h2>Donor records</h2>
                </div>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Blood group</th>
                    <th>District</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.length === 0 ? (
                    <tr>
                      <td colSpan="3">No donor profiles found.</td>
                    </tr>
                  ) : (
                    donors.slice(0, 6).map((donor) => (
                      <tr key={donor._id || donor.id || donor.email || donor.phone}>
                        <td>{donor.name || donor.email || "Unknown"}</td>
                        <td>{donor.bloodGroup || "—"}</td>
                        <td>{donor.district || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
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

      localStorage.setItem(
        "badhon_user",
        JSON.stringify({
          ...storedUser,
          id: updated._id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
        })
      );

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
      <>
        <Header />
        <main className="profile-page">
          <GlobalResponsiveStyles />
          <div className="container profile-container" role="status">
            <span className="state-spinner" aria-hidden="true" />
            <p>Loading your information...</p>
          </div>
        </main>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <Header />
        <main className="profile-page">
          <GlobalResponsiveStyles />
          <div className="container profile-container">
            <h1>We couldn't load your information</h1>
            <Feedback type="error">{loadError}</Feedback>
            <button className="dashboard-button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
              Try again
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="profile-page">
        <GlobalResponsiveStyles />
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

            {accountMessage && <Feedback type="success">{accountMessage}</Feedback>}
            {accountError && <Feedback type="error">{accountError}</Feedback>}

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

            {patientMessage && <Feedback type="success">{patientMessage}</Feedback>}
            {patientError && <Feedback type="error">{patientError}</Feedback>}

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
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
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
    </>
  );
}


function DonorDirectory() {
  const [donors, setDonors] = useState([]);
  const [bloodGroup, setBloodGroup] = useState("");
  const [district, setDistrict] = useState("");
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDonors = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (bloodGroup) params.set("bloodGroup", bloodGroup);
        if (district.trim()) params.set("district", district.trim());
        if (availability) params.set("available", availability);

        const query = params.toString();
        const endpoint = `/donors/search${query ? `?${query}` : ""}`;

        const data = await apiRequest(endpoint);

        if (!cancelled) {
          setDonors(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load donors.");
          setDonors([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDonors();

    return () => {
      cancelled = true;
    };
  }, [bloodGroup, district, availability]);

  return (
    <main className="page-container donor-directory-page">
      <section className="page-header">
        <h1>Find Blood Donors</h1>
        <p>
          Search for compatible blood donors by blood group
          and district.
        </p>
      </section>

      <section className="donor-search-filters">
        <div className="form-group">
          <label htmlFor="donor-district">District / City</label>
          <input
            id="donor-district"
            type="text"
            placeholder="Enter district or city..."
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="donor-blood-group">Blood Group</label>
          <select
            id="donor-blood-group"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
          >
            <option value="">All blood groups</option>
            {bloodGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="donor-availability">Availability</label>
          <select
            id="donor-availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="">All donors</option>
            <option value="true">Available only</option>
            <option value="false">Unavailable / Cooldown</option>
          </select>
        </div>
      </section>

      {loading && <p className="donor-status-message">Searching donors...</p>}

      {!loading && error && (
  <p role="alert" className="donor-error">{error}</p>
)}

      {!loading && !error && donors.length === 0 && (
        <div className="donor-empty-state">
          <h3>No donors found</h3>
          <p>
            Try another blood group or district.
          </p>
        </div>
      )}

      {!loading && !error && donors.length > 0 && (
        <>
          <p className="donor-results-count">
  Found {donors.length} donor
  {donors.length !== 1 ? "s" : ""}.
</p>

          <div className="donor-directory-grid">
            {donors.map((donor) => (
              <article
                className="donor-directory-card"
                key={donor._id}
              >
                <div className="donor-directory-card-header">
                  <h3>{donor.name}</h3>

                  <span
                    className={`availability-badge ${
                      donor.available
                        ? "available"
                        : donor.eligible === false
                        ? "cooldown"
                        : "unavailable"
                    }`}
                  >
                    {donor.available
                      ? "Available"
                      : donor.eligible === false
                      ? "In Cooldown"
                      : "Unavailable"}
                  </span>
                </div>

                <p>
  <strong>Blood Group:</strong>{" "}
  <span className="donor-blood-chip">{donor.bloodGroup}</span>
</p>

                <p>
                  <strong>District:</strong>{" "}
                  {donor.district}
                </p>

                {donor.available && donor.phone ? (
                  <a
                    className="primary-button donor-call-button"
                    href={`tel:${donor.phone}`}
                  >
                    Call Donor
                  </a>
                ) : (
                  <p className="donor-contact-private">
                    Contact details are not available.
                  </p>
                )}
              </article>
            ))}
          </div>
        </>
      )}
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
        const data = await apiRequest("/donors/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setForm({
          bloodGroup: data.bloodGroup || "",
          phone: data.phone || "",
          district: data.district || "",
          lastDonationDate: data.lastDonationDate ? new Date(data.lastDonationDate).toISOString().slice(0, 10) : "",
          available: isDonorProfileComplete(data) && data.available === true,
        });

        setProfile(data);
        setProfileExists(true);
      } catch (err) {
        if (err.status === 404) {
          setProfileExists(false);
          return;
        }

        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem("badhon_token");
          localStorage.removeItem("badhon_user");
          goTo("/login");
          return;
        }

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

    const token = localStorage.getItem("badhon_token");

    if (!token) {
      goTo("/login");
      return;
    }

    setSaving(true);

    try {
      const method = profileExists ? "PUT" : "POST";
      const data = await apiRequest(profileExists ? "/donors/me" : "/donors", {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          phone,
          bloodGroup: form.bloodGroup,
          district,
          lastDonationDate: form.lastDonationDate || null,
          available: form.available,
        }),
      });

      setProfileExists(true);
      setProfile(data);
      setForm({
        bloodGroup: data.bloodGroup || "",
        phone: data.phone || "",
        district: data.district || "",
        lastDonationDate: data.lastDonationDate ? new Date(data.lastDonationDate).toISOString().slice(0, 10) : "",
        available: isDonorProfileComplete(data) && data.available === true,
      });

      setMessage(profileExists ? "Donor profile updated successfully." : "Donor profile created successfully.");
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem("badhon_token");
        localStorage.removeItem("badhon_user");
        goTo("/login");
        return;
      }

      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="donor-page">
          <GlobalResponsiveStyles />
          <div className="donor-container donor-loading" role="status">
            <span className="state-spinner" aria-hidden="true" />
            <p>Loading your donor profile...</p>
          </div>
        </main>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <Header />
        <main className="donor-page">
          <GlobalResponsiveStyles />
          <div className="donor-container">
            <div className="donor-header">
              <p className="dashboard-eyebrow">Donor Profile</p>
              <h1>We couldn't load your profile</h1>
            </div>
            <Feedback type="error">{error}</Feedback>
            <button type="button" className="dashboard-button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
              Try again
            </button>
          </div>
        </main>
      </>
    );
  }

  const eligibilityDate = getEligibilityDate(form.lastDonationDate);
  const donorEligible = isDonorEligible(form.lastDonationDate);

  return (
    <>
      <Header />
      <main className="donor-page">
        <GlobalResponsiveStyles />
        <div className="donor-container">
          <div className="donor-header">
            <p className="dashboard-eyebrow">Donor Profile</p>
            <h1>{profileExists ? "Manage your donor profile" : "Become a BADHON donor"}</h1>
            <p>Add your information so people who need blood can find compatible donors.</p>
          </div>

          <section className={`donor-readiness ${isDonorProfileComplete(form) && form.available ? "donor-readiness-available" : ""}`} aria-live="polite">
            <span className="donor-readiness-icon" aria-hidden="true">
              {isDonorProfileComplete(form) && donorEligible ? (form.available ? "✓" : "•") : "!"}
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
              {profile && <small>Donor: {profile.name} · {profile.email}</small>}
            </div>
          </section>

          {message && <Feedback type="success">{message}</Feedback>}
          {error && <Feedback type="error">{error}</Feedback>}

          {!profileExists && !error && (
            <div className="donor-empty-state">
              <strong>Your donor profile is not set up yet.</strong>
              <p>Complete the details below to create your profile. It will remain unavailable until you choose to turn availability on.</p>
            </div>
          )}

          <form className="donor-form" onSubmit={handleSubmit}>
            <section className="donor-form-section">
              <h2>Donor Information</h2>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="bloodGroup">Blood Group</label>
                  <select id="bloodGroup" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} required>
                    <option value="">Select blood group</option>
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
                  <label htmlFor="phone">Phone Number</label>
                  <input id="phone" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="01XXXXXXXXX" inputMode="numeric" maxLength={11} autoComplete="tel" required />
                </div>

                <div className="form-group">
                  <label htmlFor="district">Location / District</label>
                  <input id="district" type="text" name="district" value={form.district} onChange={handleChange} placeholder="e.g. Mirpur, Dhaka" required />
                </div>

                <div className="form-group">
                  <label htmlFor="lastDonationDate">Last Donation Date</label>
                  <input id="lastDonationDate" type="date" name="lastDonationDate" value={form.lastDonationDate} onChange={handleChange} max={new Date().toISOString().slice(0, 10)} />
                  <small className="field-hint">
                    Optional. A 90-day interval is only an estimate; your donation center determines eligibility.
                  </small>
                </div>
              </div>
            </section>

            <section className="donor-form-section">
              <h2>Availability</h2>

              <label className="availability-checkbox">
                <input type="checkbox" name="available" checked={form.available} onChange={handleChange} disabled={(!isDonorProfileComplete(form) || !donorEligible) && !form.available} aria-label="List my donor profile as available" />
                <span>
                  <strong>{form.available ? "List me as available" : "Keep me unavailable"}</strong>
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
              <button type="button" className="dashboard-button dashboard-button-secondary" onClick={() => goTo("/dashboard")}>
                Cancel
              </button>
              <button type="submit" className="dashboard-button" disabled={saving}>
                {saving ? "Saving..." : profileExists ? "Update Donor Profile" : "Create Donor Profile"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

function BloodRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [myOnly, setMyOnly] = useState(() => window.location.search.includes("mine=true"));

  const [donorProfile, setDonorProfile] = useState(null);
  const [user] = useState(() => getStoredUser());
  const token = localStorage.getItem("badhon_token");
  const isAdmin = (user.role || "").toUpperCase() === "ADMIN";
  const userId = user.id || user._id;

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(() => window.location.search.includes("create=true"));
  const [editingRequest, setEditingRequest] = useState(null);
  const [form, setForm] = useState({
    patientName: "",
    bloodGroup: "",
    location: "",
    hospital: "",
    contactNumber: "",
    requiredUnits: 1,
    urgency: "Medium",
    neededBy: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Response modal state
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseStatus, setResponseStatus] = useState("Accepted");
  const [responseMessage, setResponseMessage] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseError, setResponseError] = useState("");

  // Details modal
  const [detailsRequest, setDetailsRequest] = useState(null);

  // Notification feedback
  const [feedback, setFeedback] = useState(null);

  const goTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;

    const executeFetch = async () => {
      try {
        const params = new URLSearchParams();
        if (bloodGroupFilter) params.append("bloodGroup", bloodGroupFilter);
        if (statusFilter) params.append("status", statusFilter);
        if (urgencyFilter) params.append("urgency", urgencyFilter);
        if (search.trim()) params.append("search", search.trim());
        if (myOnly) params.append("myRequests", "true");

        const queryStr = params.toString() ? `?${params.toString()}` : "";
        const data = await apiRequest(`/blood-requests${queryStr}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!ignore) {
          setRequests(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load blood requests");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(executeFetch, search ? 300 : 0);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [bloodGroupFilter, statusFilter, urgencyFilter, myOnly, search, token, reloadTrigger]);

  useEffect(() => {
    if (!token) return;
    const fetchDonor = async () => {
      try {
        const data = await apiRequest("/donors/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDonorProfile(data);
      } catch {
        // Not a donor yet
      }
    };
    fetchDonor();
  }, [token]);

  const openCreateModal = () => {
    if (!token) {
      sessionStorage.setItem("badhon_notice", "Please login to post a blood request.");
      goTo("/login");
      return;
    }
    setEditingRequest(null);
    setForm({
      patientName: "",
      bloodGroup: "",
      location: "",
      hospital: "",
      contactNumber: "",
      requiredUnits: 1,
      urgency: "Medium",
      neededBy: "",
      notes: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (req) => {
    setEditingRequest(req);
    setForm({
      patientName: req.patientName || "",
      bloodGroup: req.bloodGroup || "",
      location: req.location || "",
      hospital: req.hospital || "",
      contactNumber: req.contactNumber || "",
      requiredUnits: req.requiredUnits || 1,
      urgency: req.urgency || "Medium",
      neededBy: req.neededBy ? req.neededBy.slice(0, 10) : "",
      notes: req.notes || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.patientName.trim() || form.patientName.trim().length < 2) {
      setFormError("Please enter patient name (minimum 2 characters).");
      return;
    }

    if (!bloodGroups.includes(form.bloodGroup)) {
      setFormError("Please select a valid blood group.");
      return;
    }

    if (!form.location.trim() || form.location.trim().length < 2) {
      setFormError("Please enter location or district (minimum 2 characters).");
      return;
    }

    if (!/^01\d{9}$/.test(form.contactNumber.trim())) {
      setFormError("Please enter a valid 11-digit mobile number (01XXXXXXXXX).");
      return;
    }

    if (!form.requiredUnits || Number(form.requiredUnits) < 1) {
      setFormError("Required units must be at least 1.");
      return;
    }

    setFormSubmitting(true);

    try {
      const payload = {
        patientName: form.patientName.trim(),
        bloodGroup: form.bloodGroup,
        location: form.location.trim(),
        hospital: form.hospital.trim(),
        contactNumber: form.contactNumber.trim(),
        requiredUnits: Math.floor(Number(form.requiredUnits)),
        urgency: form.urgency,
        neededBy: form.neededBy || null,
        notes: form.notes.trim(),
      };

      if (editingRequest) {
        const updated = await apiRequest(`/blood-requests/${editingRequest._id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        setRequests((prev) =>
          prev.map((r) => (r._id === updated._id ? updated : r))
        );
        setFeedback({ type: "success", text: "Blood request updated successfully." });
      } else {
        const created = await apiRequest("/blood-requests", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        setRequests((prev) => [created, ...prev]);
        setFeedback({ type: "success", text: "Blood request created successfully." });
      }

      setModalOpen(false);
      setReloadTrigger((prev) => prev + 1);
    } catch (err) {
      setFormError(err.message || "Failed to save blood request.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusChange = async (reqId, newStatus) => {
    try {
      const updated = await apiRequest(`/blood-requests/${reqId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      setRequests((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
      if (detailsRequest && detailsRequest._id === updated._id) {
        setDetailsRequest(updated);
      }
      setReloadTrigger((prev) => prev + 1);
      setFeedback({ type: "success", text: `Request status marked as ${newStatus}.` });
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Failed to update status." });
    }
  };

  const handleDelete = async (reqId) => {
    if (!window.confirm("Are you sure you want to delete this blood request?")) return;

    try {
      await apiRequest(`/blood-requests/${reqId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests((prev) => prev.filter((r) => r._id !== reqId));
      if (detailsRequest && detailsRequest._id === reqId) {
        setDetailsRequest(null);
      }
      setReloadTrigger((prev) => prev + 1);
      setFeedback({ type: "success", text: "Blood request deleted." });
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Failed to delete request." });
    }
  };

  const openResponseModal = (req, status) => {
    if (!token) {
      sessionStorage.setItem("badhon_notice", "Please login to respond to a blood request.");
      goTo("/login");
      return;
    }
    if (!donorProfile) {
      sessionStorage.setItem("badhon_notice", "Please complete your donor profile to respond to blood requests.");
      goTo("/donor");
      return;
    }
    setRespondingTo(req);
    setResponseStatus(status);
    setResponseMessage("");
    setResponseError("");
  };

  const submitResponse = async (e) => {
    e.preventDefault();
    if (!respondingTo) return;
    setSubmittingResponse(true);
    setResponseError("");

    try {
      const result = await apiRequest(`/blood-requests/${respondingTo._id}/respond`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: responseStatus,
          message: responseMessage.trim(),
        }),
      });

      const updated = result.request || result;
      setRequests((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
      if (detailsRequest && detailsRequest._id === updated._id) {
        setDetailsRequest(updated);
      }
      setRespondingTo(null);
      setReloadTrigger((prev) => prev + 1);
      setFeedback({
        type: "success",
        text: `You have ${responseStatus.toLowerCase()} the request for ${updated.patientName}.`,
      });
    } catch (err) {
      setResponseError(err.message || "Failed to submit response.");
    } finally {
      setSubmittingResponse(false);
    }
  };

  const isOwner = (req) => {
    if (!userId || !req.requester) return false;
    const reqUserId = req.requester._id || req.requester;
    return reqUserId.toString() === userId.toString();
  };

  const getDonorResponse = (req) => {
    if (!userId || !Array.isArray(req.responses)) return null;
    return req.responses.find((r) => r.user && r.user.toString() === userId.toString());
  };

  return (
    <>
      <Header />
      <main className="requests-page">
        <GlobalResponsiveStyles />
        <div className="container">
          <div className="requests-header-row">
            <div>
              <p className="dashboard-eyebrow">Emergency Community Network</p>
              <h1>Blood Requests</h1>
              <p>
                Connect patients in need with active blood donors across Bangladesh. Browse active requests or post an urgent need.
              </p>
            </div>
            <button className="btn btn-primary btn-large" onClick={openCreateModal}>
              + Post Blood Request
            </button>
          </div>

          {feedback && (
            <Feedback type={feedback.type}>{feedback.text}</Feedback>
          )}

          <div className="requests-toolbar">
            <input
              type="text"
              className="requests-search-input"
              placeholder="🔍 Search patient, hospital, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="requests-select"
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              aria-label="Filter by blood group"
            >
              <option value="">All Blood Groups</option>
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>

            <select
              className="requests-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Matched">Matched</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Expired">Expired</option>
            </select>

            <select
              className="requests-select"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              aria-label="Filter by urgency"
            >
              <option value="">All Urgencies</option>
              <option value="Emergency">Emergency</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {token && (
              <button
                type="button"
                className={`requests-filter-btn ${myOnly ? "active" : ""}`}
                onClick={() => setMyOnly(!myOnly)}
              >
                👤 My Requests
              </button>
            )}
          </div>

          {loading ? (
            <div className="dashboard-state loading-state">
              <span className="state-spinner" aria-hidden="true" />
              <div>
                <strong>Loading blood requests...</strong>
                <p>Please wait a moment while we retrieve the latest requests.</p>
              </div>
            </div>
          ) : error ? (
            <Feedback type="error">{error}</Feedback>
          ) : requests.length === 0 ? (
            <div className="donor-empty-state">
              <strong>No blood requests found.</strong>
              <p>
                {search || bloodGroupFilter || statusFilter || urgencyFilter || myOnly
                  ? "Try resetting your search filters to see more requests."
                  : "There are currently no active blood requests. If you need blood for a patient, create a request above."}
              </p>
            </div>
          ) : (
            <div className="requests-grid">
              {requests.map((req) => {
                const owner = isOwner(req);
                const donorResp = getDonorResponse(req);
                const isMatched = req.status === "Matched";
                const isEmergency = req.urgency === "Emergency";
                const isClosed = ["Fulfilled", "Cancelled", "Expired"].includes(req.status);

                return (
                  <div
                    key={req._id}
                    className={`request-card ${isEmergency ? "emergency-card" : ""}`}
                  >
                    <div className="request-card-top">
                      <span className="blood-badge">{req.bloodGroup}</span>
                      <div className="badge-group">
                        <span className={`urgency-badge urgency-${req.urgency}`}>{req.urgency}</span>
                        <span className={`status-tag status-${req.status}`}>{req.status}</span>
                      </div>
                    </div>

                    <div className="request-card-info">
                      <h3>
                        {req.patientName}
                        <span className="units-tag">
                          {req.requiredUnits} Unit{req.requiredUnits > 1 ? "s" : ""}
                        </span>
                      </h3>

                      <div className="request-card-details">
                        <div className="request-detail-row">
                          <span className="request-detail-icon">📍</span>
                          <span>{req.hospital ? `${req.hospital}, ` : ""}{req.location}</span>
                        </div>
                        <div className="request-detail-row">
                          <span className="request-detail-icon">📞</span>
                          <a href={`tel:${req.contactNumber}`} style={{ color: "inherit", textDecoration: "none" }}>
                            {req.contactNumber}
                          </a>
                        </div>
                        {req.neededBy && (
                          <div className="request-detail-row">
                            <span className="request-detail-icon">⏰</span>
                            <span>
                              Needed by: {new Date(req.neededBy).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                        )}
                        {req.requester?.name && (
                          <div className="request-detail-row" style={{ fontSize: "12px", color: "#6b7280" }}>
                            <span className="request-detail-icon">👤</span>
                            <span>Posted by {req.requester.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isMatched && req.matchedDonor && (
                      <div className="request-matched-banner">
                        <span>🤝</span>
                        <div>
                          <strong>Matched Donor: {req.matchedDonor.name}</strong>
                          <div>Phone: {req.matchedDonor.phone} ({req.matchedDonor.bloodGroup})</div>
                        </div>
                      </div>
                    )}

                    {donorResp && (
                      <div className={`request-donor-response-banner ${donorResp.status === "Accepted" ? "accepted" : "declined"}`}>
                        {donorResp.status === "Accepted"
                          ? "✓ You accepted to donate for this request."
                          : "✕ You declined this request."}
                      </div>
                    )}

                    {req.notes && (
                      <div className="request-notes">
                        "{req.notes}"
                      </div>
                    )}

                    <div className="request-card-actions">
                      {/* Owner / Admin Controls */}
                      {(owner || isAdmin) && !isClosed && (
                        <>
                          <button
                            type="button"
                            className="btn-sm btn-success"
                            onClick={() => handleStatusChange(req._id, "Fulfilled")}
                          >
                            ✓ Mark Fulfilled
                          </button>
                          <button
                            type="button"
                            className="btn-sm btn-danger-outline"
                            onClick={() => handleStatusChange(req._id, "Cancelled")}
                          >
                            ✕ Cancel
                          </button>
                          <button
                            type="button"
                            className="btn-sm btn-secondary"
                            onClick={() => openEditModal(req)}
                          >
                            ✏️ Edit
                          </button>
                        </>
                      )}

                      {(owner || isAdmin) && isClosed && (
                        <>
                          <button
                            type="button"
                            className="btn-sm btn-secondary"
                            onClick={() => handleStatusChange(req._id, "Pending")}
                          >
                            ↺ Reopen
                          </button>
                          <button
                            type="button"
                            className="btn-sm btn-danger-outline"
                            onClick={() => handleDelete(req._id)}
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}

                      {/* Donor Controls */}
                      {!owner && !isClosed && (
                        <>
                          {token && donorProfile ? (
                            <>
                              {donorResp?.status !== "Accepted" && (
                                <button
                                  type="button"
                                  className="btn-sm btn-success"
                                  onClick={() => openResponseModal(req, "Accepted")}
                                >
                                  ❤️ Accept to Donate
                                </button>
                              )}
                              {donorResp?.status !== "Declined" && (
                                <button
                                  type="button"
                                  className="btn-sm btn-secondary"
                                  onClick={() => openResponseModal(req, "Declined")}
                                >
                                  Decline
                                </button>
                              )}
                            </>
                          ) : token ? (
                            <button
                              type="button"
                              className="btn-sm btn-secondary"
                              onClick={() => goTo("/donor")}
                            >
                              Become a Donor to Accept
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-sm btn-secondary"
                              onClick={() => goTo("/login")}
                            >
                              Login to Respond
                            </button>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        className="btn-sm btn-secondary"
                        style={{ marginLeft: "auto" }}
                        onClick={() => setDetailsRequest(req)}
                      >
                        Details {req.responses?.length ? `(${req.responses.length})` : ""} →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Create / Edit Blood Request */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingRequest ? "Edit Blood Request" : "Post a Blood Request"}</h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="modal-body">
                  {formError && <Feedback type="error">{formError}</Feedback>}

                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="patientName">Patient Full Name *</label>
                      <input
                        id="patientName"
                        name="patientName"
                        type="text"
                        value={form.patientName}
                        onChange={handleFormChange}
                        placeholder="e.g. Karim Ahmed"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="bloodGroup">Blood Group Needed *</label>
                      <select
                        id="bloodGroup"
                        name="bloodGroup"
                        value={form.bloodGroup}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="">Select blood group</option>
                        {bloodGroups.map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="requiredUnits">Required Units (Bags) *</label>
                      <input
                        id="requiredUnits"
                        name="requiredUnits"
                        type="number"
                        min="1"
                        max="20"
                        value={form.requiredUnits}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="urgency">Urgency Level *</label>
                      <select
                        id="urgency"
                        name="urgency"
                        value={form.urgency}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="Emergency">Emergency (Immediate)</option>
                        <option value="High">High (Within 6 hours)</option>
                        <option value="Medium">Medium (Within 24 hours)</option>
                        <option value="Low">Low (Scheduled in advance)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="hospital">Hospital / Clinic Name</label>
                      <input
                        id="hospital"
                        name="hospital"
                        type="text"
                        value={form.hospital}
                        onChange={handleFormChange}
                        placeholder="e.g. Dhaka Medical College Hospital"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="location">District / Area *</label>
                      <input
                        id="location"
                        name="location"
                        type="text"
                        value={form.location}
                        onChange={handleFormChange}
                        placeholder="e.g. Mirpur, Dhaka"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="contactNumber">Contact Phone Number *</label>
                      <input
                        id="contactNumber"
                        name="contactNumber"
                        type="tel"
                        value={form.contactNumber}
                        onChange={handleFormChange}
                        placeholder="01XXXXXXXXX"
                        maxLength={11}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="neededBy">Needed By Date</label>
                      <input
                        id="neededBy"
                        name="neededBy"
                        type="date"
                        value={form.neededBy}
                        onChange={handleFormChange}
                        min={new Date().toISOString().slice(0, 10)}
                      />
                    </div>

                    <div className="form-group profile-field-wide">
                      <label htmlFor="notes">Medical Condition / Special Instructions</label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows="3"
                        value={form.notes}
                        onChange={handleFormChange}
                        placeholder="Provide details about the surgery, operation room, or patient condition..."
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={formSubmitting}
                  >
                    {formSubmitting
                      ? "Saving..."
                      : editingRequest
                      ? "Update Request"
                      : "Publish Blood Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Donor Accept / Decline Response */}
        {respondingTo && (
          <div className="modal-overlay" onClick={() => setRespondingTo(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{responseStatus === "Accepted" ? "Accept Blood Request" : "Decline Blood Request"}</h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setRespondingTo(null)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitResponse}>
                <div className="modal-body">
                  {responseError && <Feedback type="error">{responseError}</Feedback>}

                  <p style={{ margin: "0 0 16px", color: "#374151" }}>
                    {responseStatus === "Accepted"
                      ? `You are confirming that you are willing to donate ${respondingTo.bloodGroup} blood for patient ${respondingTo.patientName} at ${respondingTo.hospital || respondingTo.location}.`
                      : `You are declining this blood request for patient ${respondingTo.patientName}.`}
                  </p>

                  <div className="form-group">
                    <label htmlFor="responseMessage">Optional Note to Requester</label>
                    <textarea
                      id="responseMessage"
                      rows="3"
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder={
                        responseStatus === "Accepted"
                          ? "e.g. I can arrive at the hospital by 11:00 AM. Please call me."
                          : "e.g. Unable to donate this week due to travel."
                      }
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setRespondingTo(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn ${responseStatus === "Accepted" ? "btn-success" : "btn-secondary"}`}
                    disabled={submittingResponse}
                  >
                    {submittingResponse
                      ? "Submitting..."
                      : responseStatus === "Accepted"
                      ? "Confirm Accept"
                      : "Confirm Decline"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Request Details & Donor Responses */}
        {detailsRequest && (
          <div className="modal-overlay" onClick={() => setDetailsRequest(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Blood Request Details</h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setDetailsRequest(null)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "20px" }}>
                  <span className="blood-badge">{detailsRequest.bloodGroup}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "22px" }}>{detailsRequest.patientName}</h3>
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <span className={`urgency-badge urgency-${detailsRequest.urgency}`}>{detailsRequest.urgency}</span>
                      <span className={`status-tag status-${detailsRequest.status}`}>{detailsRequest.status}</span>
                      <span className="units-tag">{detailsRequest.requiredUnits} Unit{detailsRequest.requiredUnits > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>

                <div className="account-info" style={{ marginBottom: "20px" }}>
                  <div>
                    <span>Hospital</span>
                    <strong>{detailsRequest.hospital || "Not specified"}</strong>
                  </div>
                  <div>
                    <span>Location</span>
                    <strong>{detailsRequest.location}</strong>
                  </div>
                  <div>
                    <span>Contact Number</span>
                    <strong>
                      <a href={`tel:${detailsRequest.contactNumber}`} style={{ color: "inherit" }}>
                        {detailsRequest.contactNumber}
                      </a>
                    </strong>
                  </div>
                  <div>
                    <span>Needed By</span>
                    <strong>
                      {detailsRequest.neededBy
                        ? new Date(detailsRequest.neededBy).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "As soon as possible"}
                    </strong>
                  </div>
                  <div>
                    <span>Posted By</span>
                    <strong>{detailsRequest.requester?.name || "Community Member"}</strong>
                  </div>
                  <div>
                    <span>Date Posted</span>
                    <strong>{new Date(detailsRequest.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>
                  </div>
                </div>

                {detailsRequest.notes && (
                  <div style={{ marginBottom: "20px" }}>
                    <span className="summary-label">Notes & Instructions</span>
                    <p style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", margin: "6px 0 0" }}>
                      {detailsRequest.notes}
                    </p>
                  </div>
                )}

                <div>
                  <span className="summary-label">
                    Donor Responses ({detailsRequest.responses?.length || 0})
                  </span>

                  {!detailsRequest.responses || detailsRequest.responses.length === 0 ? (
                    <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "6px" }}>
                      No donors have responded to this request yet.
                    </p>
                  ) : (
                    <div className="responses-list">
                      {detailsRequest.responses.map((resp, idx) => (
                        <div
                          key={resp._id || idx}
                          className={`response-card ${resp.status === "Accepted" ? "accepted" : "declined"}`}
                        >
                          <div className="response-card-header">
                            <strong>{resp.donorName} ({resp.donorBloodGroup})</strong>
                            <span className={`status-tag status-${resp.status === "Accepted" ? "Fulfilled" : "Cancelled"}`}>
                              {resp.status}
                            </span>
                          </div>
                          <div style={{ fontSize: "13px", color: "#4b5563" }}>
                            Phone: <a href={`tel:${resp.donorPhone}`}>{resp.donorPhone}</a>
                          </div>
                          {resp.message && (
                            <div style={{ fontSize: "13px", marginTop: "6px", fontStyle: "italic", color: "#374151" }}>
                              "{resp.message}"
                            </div>
                          )}
                          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "6px" }}>
                            Responded on {new Date(resp.respondedAt || resp.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDetailsRequest(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const token = localStorage.getItem("badhon_token");
  const storedUser = getStoredUser();
  const isAdmin = (storedUser.role || "").toUpperCase() === "ADMIN";

  if (path === "/dashboard" && !token) {
    window.history.replaceState({}, "", "/login");
    return <AuthPage mode="login" />;
  }

  if (path === "/register") return <AuthPage mode="register" />;
  if (path === "/login") return <AuthPage mode="login" />;
  if (path === "/dashboard") return <Dashboard />;
  if (path === "/requests") return <BloodRequestsPage />;

  if (path === "/admin") {
    if (!token) {
      window.history.replaceState({}, "", "/login");
      return <AuthPage mode="login" />;
    }

    if (!isAdmin) {
      window.history.replaceState({}, "", "/dashboard");
      return <Dashboard />;
    }

    return <AdminDashboard />;
  }

  if (path === "/profile") {
    if (!token) {
      window.history.replaceState({}, "", "/login");
      return <AuthPage mode="login" />;
    }

    return <ProfileManagement />;
  }

  if (path === "/donors") {
    return <DonorDirectory />;
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

