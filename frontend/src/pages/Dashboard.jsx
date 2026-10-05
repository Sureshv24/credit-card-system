import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest, logoutStorage } from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [userData, cardData, transactionData] =
          await Promise.all([
            apiRequest("/api/auth/me/"),
            apiRequest("/api/cards/"),
            apiRequest("/api/transactions/"),
          ]);

        setUser(userData);
        setCards(cardData?.results || cardData || []);
        setTransactions(
          transactionData?.results ||
            transactionData ||
            []
        );
      } catch (err) {
        console.error(err);

        if (err.status === 401) {
          logoutStorage();
          navigate("/login", { replace: true });
          return;
        }

        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const handleLogout = async () => {
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    try {
      if (accessToken && refreshToken) {
        await fetch("http://127.0.0.1:8000/api/auth/logout/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        });
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    }

    logoutStorage();
    navigate("/login", { replace: true });
  };

  const successfulCount = transactions.filter(
    (item) => item.status === "SUCCESS"
  ).length;

  const pendingCount = transactions.filter(
    (item) => item.status === "PENDING"
  ).length;

  const failedCount = transactions.filter(
    (item) => item.status === "FAILED"
  ).length;

  const totalAmount = transactions.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="text-sm text-slate-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-black text-slate-950">
              C
            </div>

            <div>
              <p className="font-bold">CardPay</p>
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

      <main className="mx-auto max-w-7xl px-6 py-8">

        <section className="mb-8">
          <p className="text-sm font-medium text-cyan-400">
            Welcome back
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {user?.username || "User"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your cards and payments from one secure place.
          </p>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">Saved Cards</p>
            <p className="mt-3 text-3xl font-bold">
              {cards.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">Transactions</p>
            <p className="mt-3 text-3xl font-bold">
              {transactions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">Successful</p>
            <p className="mt-3 text-3xl font-bold text-emerald-400">
              {successfulCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">Total Amount</p>
            <p className="mt-3 text-3xl font-bold">
              ₹{totalAmount.toFixed(2)}
            </p>
          </div>

        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-amber-400/10 bg-amber-400/5 p-5">
            <p className="text-sm text-slate-500">
              Pending Payments
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-400">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-5">
            <p className="text-sm text-slate-500">
              Successful Payments
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {successfulCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-400/10 bg-red-400/5 p-5">
            <p className="text-sm text-slate-500">
              Failed Payments
            </p>
            <p className="mt-2 text-2xl font-bold text-red-400">
              {failedCount}
            </p>
          </div>

        </section>

        <section className="mt-8">

          <h2 className="mb-4 text-xl font-semibold">
            Quick Actions
          </h2>

          <div className="grid gap-4 md:grid-cols-3">

            <button
              type="button"
              onClick={() => navigate("/cards")}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-cyan-400/40 hover:bg-slate-800"
            >
              <p className="font-semibold">Manage Cards</p>
              <p className="mt-2 text-sm text-slate-500">
                View, add, or remove your saved cards.
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/payments")}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-cyan-400/40 hover:bg-slate-800"
            >
              <p className="font-semibold">Make Payment</p>
              <p className="mt-2 text-sm text-slate-500">
                Start a secure payment using your card.
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/transactions")}
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

        <section className="mt-8">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Recent Transactions
            </h2>

            <span className="text-sm text-slate-500">
              {transactions.length} total
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

            {transactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No transactions found.
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[700px] text-left text-sm">

                  <thead className="border-b border-slate-800 text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">
                        Reference
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Amount
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Status
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.slice(0, 5).map(
                      (transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-slate-800 last:border-0"
                        >
                          <td className="px-5 py-4 font-medium text-slate-200">
                            {transaction.transaction_reference}
                          </td>

                          <td className="px-5 py-4">
                            ₹{Number(
                              transaction.amount
                            ).toFixed(2)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                transaction.status === "SUCCESS"
                                  ? "bg-emerald-400/10 text-emerald-400"
                                  : transaction.status === "FAILED"
                                    ? "bg-red-400/10 text-red-400"
                                    : "bg-amber-400/10 text-amber-400"
                              }`}
                            >
                              {transaction.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-slate-500">
                            {transaction.created_at
                              ? new Date(
                                  transaction.created_at
                                ).toLocaleDateString()
                              : "-"}
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
