import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest, logoutStorage } from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [summary, setSummary] = useState({
    total_transactions: 0,
    total_amount_spent: 0,
    current_month_spending: 0,
    available_credit_limit: 0,
    last_5_transactions: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [userData, summaryData] = await Promise.all([
          // Django backend
          apiRequest("/api/auth/me/"),

          // FastAPI dashboard backend
          apiRequest(
            "http://127.0.0.1:8001/dashboard/summary"
          ),
        ]);

        setUser(userData);

        setSummary({
          total_transactions:
            summaryData?.total_transactions ?? 0,

          total_amount_spent:
            summaryData?.total_amount_spent ?? 0,

          current_month_spending:
            summaryData?.current_month_spending ?? 0,

          available_credit_limit:
            summaryData?.available_credit_limit ?? 0,

          last_5_transactions:
            summaryData?.last_5_transactions ?? [],
        });
      } catch (err) {
        console.error("Dashboard loading error:", err);

        if (err?.status === 401) {
          setError(
            "Your session has expired. Please login again."
          );

          logoutStorage();
          navigate("/login", { replace: true });
          return;
        }

        setError(
          err?.message ||
            "Unable to load dashboard data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const handleLogout = async () => {
    const accessToken =
      localStorage.getItem("access_token");

    const refreshToken =
      localStorage.getItem("refresh_token");

    try {
      if (accessToken && refreshToken) {
        await fetch(
          "http://127.0.0.1:8000/api/auth/logout/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              refresh: refreshToken,
            }),
          }
        );
      }
    } catch (err) {
      console.error(
        "Logout request failed:",
        err
      );
    }

    logoutStorage();
    navigate("/login", { replace: true });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "SUCCESS":
        return "bg-emerald-400/10 text-emerald-400";

      case "FAILED":
        return "bg-red-400/10 text-red-400";

      case "PENDING":
        return "bg-amber-400/10 text-amber-400";

      default:
        return "bg-slate-400/10 text-slate-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Header Skeleton */}
        <header className="border-b border-slate-800 bg-slate-900">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-800" />

              <div>
                <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />

                <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-800" />
              </div>
            </div>

            <div className="h-9 w-20 animate-pulse rounded-xl bg-slate-800" />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          {/* Welcome Skeleton */}
          <section className="mb-8">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-800" />

            <div className="mt-3 h-8 w-48 animate-pulse rounded bg-slate-800" />

            <div className="mt-3 h-4 w-80 animate-pulse rounded bg-slate-800" />
          </section>

          {/* Stats Skeleton */}
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="h-4 w-28 animate-pulse rounded bg-slate-800" />

                <div className="mt-4 h-9 w-36 animate-pulse rounded bg-slate-800" />

                <div className="mt-3 h-3 w-24 animate-pulse rounded bg-slate-800" />
              </div>
            ))}
          </section>

          {/* Table Skeleton */}
          <section className="mt-8">
            <div className="mb-4 h-6 w-48 animate-pulse rounded bg-slate-800" />

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className="space-y-4 p-5">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="grid grid-cols-4 gap-4"
                  >
                    <div className="h-4 animate-pulse rounded bg-slate-800" />
                    <div className="h-4 animate-pulse rounded bg-slate-800" />
                    <div className="h-4 animate-pulse rounded bg-slate-800" />
                    <div className="h-4 animate-pulse rounded bg-slate-800" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
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

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome */}
        <section className="mb-8">
          <p className="text-sm font-medium text-cyan-400">
            Welcome back
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {user?.username || "User"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Here's a quick overview of your credit card usage.
          </p>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Dashboard Statistics */}
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Spent */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-400/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Total Spent
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">
                ₹
              </div>
            </div>

            <p className="mt-4 text-2xl font-bold">
              {formatCurrency(
                summary.total_amount_spent
              )}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Total successful spending
            </p>
          </div>

          {/* Available Credit */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-emerald-400/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Available Credit
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
                ✓
              </div>
            </div>

            <p className="mt-4 text-2xl font-bold text-emerald-400">
              {formatCurrency(
                summary.available_credit_limit
              )}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Remaining credit limit
            </p>
          </div>

          {/* Total Transactions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-violet-400/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Total Transactions
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/10 text-violet-400">
                #
              </div>
            </div>

            <p className="mt-4 text-2xl font-bold">
              {summary.total_transactions}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              All transactions
            </p>
          </div>

          {/* This Month */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-amber-400/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                This Month
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
                ↗
              </div>
            </div>

            <p className="mt-4 text-2xl font-bold text-amber-400">
              {formatCurrency(
                summary.current_month_spending
              )}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Current month spending
            </p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">
            Quick Actions
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                navigate("/cards")
              }
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-cyan-400/40 hover:bg-slate-800"
            >
              <p className="font-semibold">
                Manage Cards
              </p>

              <p className="mt-2 text-sm text-slate-500">
                View, add, or remove your saved cards.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/payments")
              }
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-cyan-400/40 hover:bg-slate-800"
            >
              <p className="font-semibold">
                Make Payment
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Start a secure payment using your card.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/transactions")
              }
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-cyan-400/40 hover:bg-slate-800"
            >
              <p className="font-semibold">
                Transaction History
              </p>

              <p className="mt-2 text-sm text-slate-500">
                View and filter your payment transactions.
              </p>
            </button>
          </div>
        </section>

        {/* Last 5 Transactions */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Last 5 Transactions
            </h2>

            <span className="text-sm text-slate-500">
              {Math.min(
                summary.last_5_transactions.length,
                5
              )}{" "}
              shown
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            {summary.last_5_transactions.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-slate-500">
                  No transactions found.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/payments")
                  }
                  className="mt-4 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Make Your First Payment
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="border-b border-slate-800 text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">
                        Amount
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Masked Card
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Date
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {summary.last_5_transactions
                      .slice(0, 5)
                      .map(
                        (
                          transaction,
                          index
                        ) => (
                          <tr
                            key={`${transaction.date}-${index}`}
                            className="border-b border-slate-800 last:border-0"
                          >
                            <td className="px-5 py-4 font-semibold text-slate-200">
                              {formatCurrency(
                                transaction.amount
                              )}
                            </td>

                            <td className="px-5 py-4 font-mono text-slate-400">
                              {transaction.masked_card_number ||
                                "**** **** **** ****"}
                            </td>

                            <td className="px-5 py-4 text-slate-500">
                              {formatDate(
                                transaction.date
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                                  transaction.status
                                )}`}
                              >
                                {transaction.status ||
                                  "UNKNOWN"}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;