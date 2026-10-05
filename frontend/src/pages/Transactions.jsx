import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../services/api";

function Transactions() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);

  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const loadCards = async () => {
    const data = await apiRequest("/api/cards/");
    setCards(data?.results || data || []);
  };

  const buildQueryString = (page = 1) => {
    const params = new URLSearchParams();

    if (status) {
      params.set("status", status);
    }

    if (minAmount) {
      params.set("min_amount", minAmount);
    }

    if (maxAmount) {
      params.set("max_amount", maxAmount);
    }

    if (startDate) {
      params.set("start_date", startDate);
    }

    if (endDate) {
      params.set("end_date", endDate);
    }

    params.set("page", page);

    return params.toString();
  };

  const loadTransactions = async (page = 1) => {
    setLoading(true);
    setMessage("");

    try {
      const queryString = buildQueryString(page);

      const data = await apiRequest(
        `/api/transactions/?${queryString}`
      );

      if (Array.isArray(data)) {
        setTransactions(data);
        setCount(data.length);
        setNextPage(null);
        setPreviousPage(null);
      } else {
        setTransactions(data?.results || []);
        setCount(data?.count || 0);
        setNextPage(data?.next || null);
        setPreviousPage(data?.previous || null);
      }

      setCurrentPage(page);
    } catch (error) {
      if (error.status === 401) {
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }

      setMessageType("error");
      setMessage(
        error.data?.detail ||
          "Unable to load transaction history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadPageData = async () => {
      try {
        await loadCards();
        await loadTransactions(1);
      } catch (error) {
        if (error.status === 401) {
          localStorage.clear();
          navigate("/login", { replace: true });
          return;
        }

        setMessageType("error");
        setMessage(
          error.data?.detail ||
            "Unable to load transaction history."
        );
        setLoading(false);
      }
    };

    loadPageData();
  }, [navigate]);

  const handleFilter = (event) => {
    event.preventDefault();
    loadTransactions(1);
  };

  const handleClearFilters = async () => {
    setStatus("");
    setMinAmount("");
    setMaxAmount("");
    setStartDate("");
    setEndDate("");

    setLoading(true);
    setMessage("");

    try {
      const data = await apiRequest(
        "/api/transactions/?page=1"
      );

      if (Array.isArray(data)) {
        setTransactions(data);
        setCount(data.length);
        setNextPage(null);
        setPreviousPage(null);
      } else {
        setTransactions(data?.results || []);
        setCount(data?.count || 0);
        setNextPage(data?.next || null);
        setPreviousPage(data?.previous || null);
      }

      setCurrentPage(1);
    } catch (error) {
      if (error.status === 401) {
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }

      setMessageType("error");
      setMessage(
        error.data?.detail ||
          "Unable to load transaction history."
      );
    } finally {
      setLoading(false);
    }
  };

  const getCardDisplay = (cardId) => {
    const card = cards.find(
      (item) => Number(item.id) === Number(cardId)
    );

    if (card?.masked_card_number) {
      return card.masked_card_number;
    }

    return `**** ${cardId}`;
  };

  const getStatusClass = (transactionStatus) => {
    if (transactionStatus === "SUCCESS") {
      return "bg-emerald-400/10 text-emerald-400";
    }

    if (transactionStatus === "FAILED") {
      return "bg-red-400/10 text-red-400";
    }

    return "bg-amber-400/10 text-amber-400";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}
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

          <Link
            to="/dashboard"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Dashboard
          </Link>

        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* TITLE */}
        <div className="mb-8">

          <p className="text-sm font-medium text-cyan-400">
            Transaction Management
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Transaction History
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View and filter your payment transactions.
          </p>

        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm ${
              messageType === "error"
                ? "border border-red-500/20 bg-red-500/10 text-red-300"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {message}
          </div>
        )}

        {/* FILTERS */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Filters
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Narrow your transaction history using the available filters.
            </p>
          </div>

          <form
            onSubmit={handleFilter}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
          >

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                <option value="">
                  All Statuses
                </option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="SUCCESS">
                  Success
                </option>

                <option value="FAILED">
                  Failed
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Minimum Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={minAmount}
                onChange={(event) =>
                  setMinAmount(event.target.value)
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Maximum Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={maxAmount}
                onChange={(event) =>
                  setMaxAmount(event.target.value)
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex gap-3 md:col-span-2 lg:col-span-5">

              <button
                type="submit"
                className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Apply Filters
              </button>

              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Clear
              </button>

            </div>

          </form>

        </section>

        {/* SUMMARY */}
        <div className="mb-5 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-semibold">
              Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {count} transaction{count === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-400">
            Page {currentPage}
          </div>

        </div>

        {/* TABLE */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

          {loading ? (

            <div className="p-12 text-center">

              <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

              <p className="text-sm text-slate-500">
                Loading transactions...
              </p>

            </div>

          ) : transactions.length === 0 ? (

            <div className="p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-cyan-400">
                ₹
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No transactions found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try changing or clearing your filters.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px] text-left text-sm">

                <thead className="border-b border-slate-800 text-slate-500">

                  <tr>

                    <th className="px-5 py-4 font-medium">
                      Reference
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Card
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

                  {transactions.map((transaction) => (

                    <tr
                      key={transaction.id}
                      className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40"
                    >

                      <td className="px-5 py-4 font-medium text-slate-200">
                        {transaction.transaction_reference}
                      </td>

                      <td className="px-5 py-4 font-mono text-slate-300">
                        {getCardDisplay(transaction.card_id)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-200">
                        ₹{Number(transaction.amount).toFixed(2)}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {transaction.created_at
                          ? new Date(
                              transaction.created_at
                            ).toLocaleString()
                          : "-"}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* PAGINATION */}
        {(nextPage || previousPage) && (
          <div className="mt-5 flex items-center justify-between">

            <button
              type="button"
              disabled={!previousPage || loading}
              onClick={() =>
                loadTransactions(currentPage - 1)
              }
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            <span className="text-sm text-slate-500">
              Page {currentPage}
            </span>

            <button
              type="button"
              disabled={!nextPage || loading}
              onClick={() =>
                loadTransactions(currentPage + 1)
              }
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>

          </div>
        )}

      </main>
    </div>
  );
}

export default Transactions;
