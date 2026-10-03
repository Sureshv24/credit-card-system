import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage("");

    if (password !== password2) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          phone_number: phoneNumber.trim(),
          password,
          password2,
        }),
      });

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Account created successfully. Please sign in.",
        },
      });
    } catch (error) {
      const errors = [];

      Object.entries(error.data || {}).forEach(
        ([field, value]) => {
          if (Array.isArray(value)) {
            errors.push(`${field}: ${value.join(", ")}`);
          } else {
            errors.push(`${field}: ${value}`);
          }
        }
      );

      setMessage(
        errors.length
          ? errors.join(" | ")
          : "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[90vh] max-w-md items-center">
        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl sm:p-8">

          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
              Get started
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Create your account
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create an account to manage your cards and payments.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-950 p-1">

            <Link
              to="/login"
              className="rounded-lg py-2.5 text-center text-sm font-semibold text-slate-500 hover:text-white"
            >
              Sign In
            </Link>

            <div className="rounded-lg bg-cyan-400 py-2.5 text-center text-sm font-semibold text-slate-950">
              Register
            </div>

          </div>

          <form
            onSubmit={handleRegister}
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
                placeholder="Choose a username"
                autoComplete="username"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Phone Number
              </label>

              <input
                type="tel"
                value={phoneNumber}
                onChange={(event) =>
                  setPhoneNumber(event.target.value)
                }
                placeholder="Enter phone number"
                autoComplete="tel"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
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
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Confirm Password
              </label>

              <input
                type="password"
                value={password2}
                onChange={(event) =>
                  setPassword2(event.target.value)
                }
                placeholder="Re-enter your password"
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-400 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {message}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Register;
