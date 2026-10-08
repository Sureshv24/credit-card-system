import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  API_BASE_URL,
  apiRequest,
} from "../services/api";


function Transactions() {
  const navigate = useNavigate();

  // ==========================================================
  // TRANSACTION DATA
  // ==========================================================

  const [transactions, setTransactions] =
    useState([]);

  const [cards, setCards] = useState([]);

  const [loading, setLoading] = useState(true);


  // ==========================================================
  // FILTERS
  // ==========================================================

  const [status, setStatus] = useState("");

  const [minAmount, setMinAmount] =
    useState("");

  const [maxAmount, setMaxAmount] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");


  // ==========================================================
  // PAGINATION
  // ==========================================================

  const [count, setCount] = useState(0);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [nextPage, setNextPage] =
    useState(null);

  const [previousPage, setPreviousPage] =
    useState(null);


  // ==========================================================
  // MESSAGES
  // ==========================================================

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("info");


  // ==========================================================
  // MONTHLY STATEMENT
  // ==========================================================

  const currentDate = new Date();

  const [statementMonth, setStatementMonth] =
    useState(
      String(currentDate.getMonth() + 1)
    );

  const [statementYear, setStatementYear] =
    useState(
      String(currentDate.getFullYear())
    );

  const [
    downloadingStatement,
    setDownloadingStatement,
  ] = useState(false);


  // ==========================================================
  // LOAD CARDS
  // ==========================================================

  const loadCards = async () => {
    const data = await apiRequest(
      "/api/cards/"
    );

    setCards(
      data?.results ||
        data ||
        []
    );
  };


  // ==========================================================
  // BUILD TRANSACTION QUERY
  // ==========================================================

  const buildQueryString = (
    page = 1
  ) => {
    const params =
      new URLSearchParams();

    if (status) {
      params.set(
        "status",
        status
      );
    }

    if (minAmount) {
      params.set(
        "min_amount",
        minAmount
      );
    }

    if (maxAmount) {
      params.set(
        "max_amount",
        maxAmount
      );
    }

    if (startDate) {
      params.set(
        "start_date",
        startDate
      );
    }

    if (endDate) {
      params.set(
        "end_date",
        endDate
      );
    }

    params.set(
      "page",
      page
    );

    return params.toString();
  };


  // ==========================================================
  // LOAD TRANSACTIONS
  // ==========================================================

  const loadTransactions = async (
    page = 1
  ) => {
    setLoading(true);
    setMessage("");

    try {
      const queryString =
        buildQueryString(page);

      const data =
        await apiRequest(
          `/api/transactions/?${queryString}`
        );

      if (Array.isArray(data)) {
        setTransactions(data);

        setCount(
          data.length
        );

        setNextPage(null);
        setPreviousPage(null);
      } else {
        setTransactions(
          data?.results || []
        );

        setCount(
          data?.count || 0
        );

        setNextPage(
          data?.next || null
        );

        setPreviousPage(
          data?.previous || null
        );
      }

      setCurrentPage(page);

    } catch (error) {
      if (
        error.status === 401
      ) {
        localStorage.clear();

        navigate(
          "/login",
          {
            replace: true,
          }
        );

        return;
      }

      setMessageType(
        "error"
      );

      setMessage(
        error.data?.detail ||
          "Unable to load transaction history."
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    const loadPageData =
      async () => {
        try {
          await loadCards();

          await loadTransactions(
            1
          );

        } catch (error) {
          if (
            error.status === 401
          ) {
            localStorage.clear();

            navigate(
              "/login",
              {
                replace: true,
              }
            );

            return;
          }

          setMessageType(
            "error"
          );

          setMessage(
            error.data?.detail ||
              "Unable to load transaction history."
          );

          setLoading(false);
        }
      };

    loadPageData();
  }, [navigate]);


  // ==========================================================
  // APPLY FILTER
  // ==========================================================

  const handleFilter = (
    event
  ) => {
    event.preventDefault();

    loadTransactions(1);
  };


  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const handleClearFilters =
    async () => {
      setStatus("");
      setMinAmount("");
      setMaxAmount("");
      setStartDate("");
      setEndDate("");

      setLoading(true);
      setMessage("");

      try {
        const data =
          await apiRequest(
            "/api/transactions/?page=1"
          );

        if (Array.isArray(data)) {
          setTransactions(data);

          setCount(
            data.length
          );

          setNextPage(null);
          setPreviousPage(null);

        } else {
          setTransactions(
            data?.results || []
          );

          setCount(
            data?.count || 0
          );

          setNextPage(
            data?.next || null
          );

          setPreviousPage(
            data?.previous || null
          );
        }

        setCurrentPage(1);

      } catch (error) {
        if (
          error.status === 401
        ) {
          localStorage.clear();

          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return;
        }

        setMessageType(
          "error"
        );

        setMessage(
          error.data?.detail ||
            "Unable to load transaction history."
        );

      } finally {
        setLoading(false);
      }
    };


  // ==========================================================
  // CARD DISPLAY
  // ==========================================================

  const getCardDisplay =
    (cardId) => {
      const card =
        cards.find(
          (item) =>
            Number(item.id) ===
            Number(cardId)
        );

      if (
        card?.masked_card_number
      ) {
        return card.masked_card_number;
      }

      return `**** ${cardId}`;
    };


  // ==========================================================
  // STATUS STYLE
  // ==========================================================

  const getStatusClass =
    (transactionStatus) => {
      if (
        transactionStatus ===
        "SUCCESS"
      ) {
        return "bg-emerald-400/10 text-emerald-400";
      }

      if (
        transactionStatus ===
        "FAILED"
      ) {
        return "bg-red-400/10 text-red-400";
      }

      return "bg-amber-400/10 text-amber-400";
    };


  // ==========================================================
  // DOWNLOAD MONTHLY STATEMENT
  // ==========================================================

  const handleDownloadStatement =
    async () => {
      setMessage("");
      setMessageType("info");

      const month =
        Number(
          statementMonth
        );

      const year =
        Number(
          statementYear
        );

      if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
      ) {
        setMessageType(
          "error"
        );

        setMessage(
          "Please select a valid statement month."
        );

        return;
      }

      if (
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100
      ) {
        setMessageType(
          "error"
        );

        setMessage(
          "Please enter a valid statement year between 2000 and 2100."
        );

        return;
      }

      setDownloadingStatement(
        true
      );

      try {
        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          localStorage.clear();

          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return;
        }

        const response =
          await fetch(
            `${API_BASE_URL}/api/transactions/monthly-statement/?month=${month}&year=${year}`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        // ------------------------------------------------------
        // AUTH ERROR
        // ------------------------------------------------------

        if (
          response.status === 401
        ) {
          localStorage.clear();

          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return;
        }


        // ------------------------------------------------------
        // ERROR RESPONSE
        // ------------------------------------------------------

        if (!response.ok) {
          let errorData =
            null;

          try {
            errorData =
              await response.json();
          } catch {
            errorData = null;
          }

          throw new Error(
            errorData?.detail ||
              "Unable to generate the monthly statement."
          );
        }


        // ------------------------------------------------------
        // PDF BLOB
        // ------------------------------------------------------

        const blob =
          await response.blob();


        if (
          blob.size === 0
        ) {
          throw new Error(
            "The generated statement is empty."
          );
        }


        // ------------------------------------------------------
        // DOWNLOAD FILE
        // ------------------------------------------------------

        const downloadUrl =
          window.URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            "a"
          );

        link.href =
          downloadUrl;

        link.download =
          `monthly_statement_${year}_${String(
            month
          ).padStart(2, "0")}.pdf`;

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
          downloadUrl
        );


        // ------------------------------------------------------
        // SUCCESS
        // ------------------------------------------------------

        setMessageType(
          "success"
        );

        setMessage(
          `Monthly statement for ${String(
            month
          ).padStart(
            2,
            "0"
          )}/${year} downloaded successfully.`
        );

      } catch (error) {
        console.error(
          "Monthly statement error:",
          error
        );

        setMessageType(
          "error"
        );

        setMessage(
          error.message ||
            "Unable to download the monthly statement."
        );

      } finally {
        setDownloadingStatement(
          false
        );
      }
    };


  // ==========================================================
  // MONTH NAMES
  // ==========================================================

  const months = [
    {
      value: "1",
      label: "January",
    },
    {
      value: "2",
      label: "February",
    },
    {
      value: "3",
      label: "March",
    },
    {
      value: "4",
      label: "April",
    },
    {
      value: "5",
      label: "May",
    },
    {
      value: "6",
      label: "June",
    },
    {
      value: "7",
      label: "July",
    },
    {
      value: "8",
      label: "August",
    },
    {
      value: "9",
      label: "September",
    },
    {
      value: "10",
      label: "October",
    },
    {
      value: "11",
      label: "November",
    },
    {
      value: "12",
      label: "December",
    },
  ];


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

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


      {/* ================================================== */}
      {/* MAIN */}
      {/* ================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-8">


        {/* ================================================== */}
        {/* TITLE */}
        {/* ================================================== */}

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


        {/* ================================================== */}
        {/* MESSAGE */}
        {/* ================================================== */}

        {message && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm ${
              messageType === "error"
                ? "border border-red-500/20 bg-red-500/10 text-red-300"
                : messageType === "success"
                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {message}
          </div>
        )}


        {/* ================================================== */}
        {/* MONTHLY STATEMENT */}
        {/* ================================================== */}

        <section className="mb-8 rounded-2xl border border-cyan-400/20 bg-slate-900 p-6">

          <div className="mb-5">

            <p className="text-sm font-medium text-cyan-400">
              Monthly Statement
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Download your monthly PDF statement
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Includes transaction details, total spending,
              summary information, and masked card details.
            </p>

          </div>


          <div className="grid gap-4 sm:grid-cols-3">

            {/* MONTH */}

            <div>

              <label
                htmlFor="statement-month"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Month
              </label>

              <select
                id="statement-month"
                value={statementMonth}
                onChange={(event) =>
                  setStatementMonth(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                {months.map(
                  (month) => (
                    <option
                      key={month.value}
                      value={month.value}
                    >
                      {month.label}
                    </option>
                  )
                )}
              </select>

            </div>


            {/* YEAR */}

            <div>

              <label
                htmlFor="statement-year"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Year
              </label>

              <input
                id="statement-year"
                type="number"
                min="2000"
                max="2100"
                value={statementYear}
                onChange={(event) =>
                  setStatementYear(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              />

            </div>


            {/* DOWNLOAD */}

            <div className="flex items-end">

              <button
                type="button"
                onClick={
                  handleDownloadStatement
                }
                disabled={
                  downloadingStatement
                }
                aria-label="Download monthly statement PDF"
                className="w-full rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadingStatement
                  ? "Generating PDF..."
                  : "Download PDF Statement"}
              </button>

            </div>

          </div>

        </section>


        {/* ================================================== */}
        {/* FILTERS */}
        {/* ================================================== */}

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

            {/* STATUS */}

            <div>

              <label
                htmlFor="status-filter"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
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


            {/* MIN AMOUNT */}

            <div>

              <label
                htmlFor="min-amount"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Minimum Amount
              </label>

              <input
                id="min-amount"
                type="number"
                min="0"
                step="0.01"
                value={minAmount}
                onChange={(event) =>
                  setMinAmount(
                    event.target.value
                  )
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />

            </div>


            {/* MAX AMOUNT */}

            <div>

              <label
                htmlFor="max-amount"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Maximum Amount
              </label>

              <input
                id="max-amount"
                type="number"
                min="0"
                step="0.01"
                value={maxAmount}
                onChange={(event) =>
                  setMaxAmount(
                    event.target.value
                  )
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />

            </div>


            {/* START DATE */}

            <div>

              <label
                htmlFor="start-date"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Start Date
              </label>

              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />

            </div>


            {/* END DATE */}

            <div>

              <label
                htmlFor="end-date"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                End Date
              </label>

              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />

            </div>


            {/* BUTTONS */}

            <div className="flex gap-3 md:col-span-2 lg:col-span-5">

              <button
                type="submit"
                className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Apply Filters
              </button>


              <button
                type="button"
                onClick={
                  handleClearFilters
                }
                className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Clear
              </button>

            </div>

          </form>

        </section>


        {/* ================================================== */}
        {/* SUMMARY */}
        {/* ================================================== */}

        <div className="mb-5 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold">
              Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {count} transaction
              {count === 1 ? "" : "s"} found
            </p>

          </div>


          <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-400">
            Page {currentPage}
          </div>

        </div>


        {/* ================================================== */}
        {/* TABLE */}
        {/* ================================================== */}

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

                  {transactions.map(
                    (transaction) => (

                      <tr
                        key={
                          transaction.id
                        }
                        className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40"
                      >

                        <td className="px-5 py-4 font-medium text-slate-200">
                          {
                            transaction.transaction_reference
                          }
                        </td>


                        <td className="px-5 py-4 font-mono text-slate-300">
                          {getCardDisplay(
                            transaction.card_id
                          )}
                        </td>


                        <td className="px-5 py-4 font-semibold text-slate-200">
                          ₹
                          {Number(
                            transaction.amount
                          ).toFixed(2)}
                        </td>


                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                              transaction.status
                            )}`}
                          >
                            {
                              transaction.status
                            }
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

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* ================================================== */}
        {/* PAGINATION */}
        {/* ================================================== */}

        {(nextPage ||
          previousPage) && (

          <div className="mt-5 flex items-center justify-between">

            <button
              type="button"
              disabled={
                !previousPage ||
                loading
              }
              onClick={() =>
                loadTransactions(
                  currentPage - 1
                )
              }
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>


            <span className="text-sm text-slate-500">
              Page {currentPage}
            </span>


            <button
              type="button"
              disabled={
                !nextPage ||
                loading
              }
              onClick={() =>
                loadTransactions(
                  currentPage + 1
                )
              }
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>

          </div>

        )}

      </main>

    </div>
  );
}


export default Transactions;