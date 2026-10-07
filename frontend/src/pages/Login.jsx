import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  API_BASE_URL,
  apiRequest,
} from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      // ---------------------------------------------------------
      // LOGIN
      // ---------------------------------------------------------

      const data = await apiRequest(
        "/api/auth/login/",
        {
          method: "POST",
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      // ---------------------------------------------------------
      // SAVE JWT TOKENS
      // ---------------------------------------------------------

      localStorage.setItem(
        "access_token",
        data.access
      );

      localStorage.setItem(
        "refresh_token",
        data.refresh
      );

      // ---------------------------------------------------------
      // CHECK WHETHER USER IS ADMIN / STAFF
      // ---------------------------------------------------------

      let isAdmin = false;

      try {
        const adminResponse = await fetch(
          `${API_BASE_URL}/api/admin-dashboard/summary/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.access}`,
            },
          }
        );

        // Admin / staff user
        if (adminResponse.status === 200) {
          isAdmin = true;
        }

        // Normal user
        if (adminResponse.status === 403) {
          isAdmin = false;
        }
      } catch (adminError) {
        console.error(
          "Admin role check failed:",
          adminError
        );

        // Default to normal dashboard
        isAdmin = false;
      }

      // ---------------------------------------------------------
      // ROLE-BASED REDIRECT
      // ---------------------------------------------------------

      if (isAdmin) {
        navigate("/admin-dashboard", {
          replace: true,
        });
      } else {
        navigate("/dashboard", {
          replace: true,
        });
      }
    } catch (error) {
      setMessage(
        error.data?.detail ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-screen lg:grid-cols-2">

        {/* ================================================= */}
        {/* LEFT */}
        {/* ================================================= */}

        <section className="relative hidden h-full overflow-hidden bg-slate-950 lg:block">

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.10),transparent_32%)]" />

          <div className="absolute left-[-120px] top-[35%] h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="absolute bottom-[-100px] right-[-80px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="absolute left-10 top-10 z-20">
            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400 text-lg font-black text-slate-950">
                C
              </div>

              <div className="text-left">
                <div className="text-xl font-bold">
                  CardPay
                </div>

                <div className="text-xs text-slate-500">
                  Payment Platform
                </div>
              </div>

            </div>
          </div>

          <div className="relative z-10 flex h-full w-full items-center justify-center px-12">

            <div className="flex w-full max-w-[650px] flex-col items-center justify-center text-center">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Secure payments
              </div>

              <h1 className="text-4xl font-bold leading-[1.08] tracking-tight xl:text-5xl">
                Your cards.
                <span className="block text-cyan-400">
                  Your payments.
                </span>
                One secure place.
              </h1>

              <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-slate-400 xl:text-base">
                Manage your cards, payments, and transactions
                from one secure platform.
              </p>

              <div className="relative mt-10 h-[190px] w-[380px]">

                <div className="absolute inset-0 rounded-3xl bg-cyan-400/10 blur-2xl" />

                <div className="absolute bottom-0 right-0 h-[130px] w-[255px] rounded-3xl border border-white/5 bg-slate-800/40" />

                <div className="absolute left-1/2 top-0 h-[175px] w-[310px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 p-6 text-left shadow-2xl">

                  <div className="relative flex h-full flex-col justify-between">

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-semibold tracking-[0.18em] text-slate-300">
                        CARDPAY
                      </span>

                      <div className="h-6 w-9 rounded-md border border-white/10 bg-white/5" />

                    </div>

                    <div>

                      <p className="font-mono text-base tracking-[0.18em] text-slate-200">
                        •••• •••• •••• 4821
                      </p>

                      <div className="mt-3 flex items-end justify-between">

                        <div>
                          <p className="text-[8px] uppercase text-slate-500">
                            Card holder
                          </p>

                          <p className="mt-1 text-[10px] font-medium">
                            CARDPAY USER
                          </p>
                        </div>

                        <div>
                          <p className="text-[8px] uppercase text-slate-500">
                            Valid thru
                          </p>

                          <p className="mt-1 text-[10px] font-medium">
                            12/30
                          </p>
                        </div>

                      </div>

                    </div>

                  </div>

                </div>
              </div>

              <div className="mt-7 text-xs text-slate-600">
                JWT Protected • Secure Card Handling
              </div>

            </div>
          </div>
        </section>

        {/* ================================================= */}
        {/* RIGHT */}
        {/* ================================================= */}

        <section className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-8 sm:px-8">

          <div className="w-full max-w-[420px]">

            <div className="mb-7 flex items-center gap-3 lg:hidden">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-black text-slate-950">
                C
              </div>

              <div>
                <p className="font-bold">
                  CardPay
                </p>

                <p className="text-xs text-slate-500">
                  Payment Platform
                </p>
              </div>

            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl sm:p-8">

              <div className="mb-6">

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
                  Welcome back
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  Sign in to CardPay
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Access your secure payment dashboard.
                </p>

              </div>

              <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-950 p-1">

                <div className="rounded-lg bg-cyan-400 py-2.5 text-center text-sm font-semibold text-slate-950">
                  Sign In
                </div>

                <Link
                  to="/register"
                  className="rounded-lg py-2.5 text-center text-sm font-semibold text-slate-500 hover:text-white"
                >
                  Register
                </Link>

              </div>

              <form
                onSubmit={handleLogin}
                className="space-y-4"
              >

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Username
                  </label>

                  <input
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value)
                    }
                    placeholder="Enter your username"
                    autoComplete="username"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                  />

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-cyan-400 py-3.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
                >
                  {loading
                    ? "Signing in..."
                    : "Sign In"}
                </button>

              </form>

              {message && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {message}
                </div>
              )}

              <p className="mt-5 text-center text-xs text-slate-600">
                Protected authentication powered by Django JWT.
              </p>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default Login;