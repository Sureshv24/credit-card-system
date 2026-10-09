import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";



import {

  API_BASE_URL,

  logoutStorage,

} from "../services/api";





// ============================================================

// ADMIN API REQUEST

// ============================================================



async function adminRequest(endpoint, options = {}) {

  let accessToken = localStorage.getItem("access_token");

  const refreshToken = localStorage.getItem("refresh_token");



  if (!accessToken) {

    const error = new Error(

      "Authentication required."

    );



    error.status = 401;



    throw error;

  }



  const makeRequest = async (token) => {

    return fetch(

      `${API_BASE_URL}${endpoint}`,

      {

        ...options,

        headers: {

          "Content-Type": "application/json",

          ...(options.headers || {}),

          Authorization: `Bearer ${token}`,

        },

      }

    );

  };



  let response = await makeRequest(accessToken);



  // ----------------------------------------------------------

  // ACCESS TOKEN EXPIRED

  // ----------------------------------------------------------



  if (

    response.status === 401 &&

    refreshToken

  ) {

    const refreshResponse = await fetch(

      `${API_BASE_URL}/api/auth/token/refresh/`,

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify({

          refresh: refreshToken,

        }),

      }

    );



    if (refreshResponse.ok) {

      const refreshData =

        await refreshResponse.json();



      accessToken = refreshData.access;



      localStorage.setItem(

        "access_token",

        accessToken

      );



      response = await makeRequest(

        accessToken

      );

    }

  }



  let data = null;



  try {

    data = await response.json();

  } catch {

    data = null;

  }



  if (!response.ok) {

    const error = new Error(

      data?.detail ||

        `Request failed with status ${response.status}.`

    );



    error.status = response.status;

    error.data = data;



    throw error;

  }



  return data;

}





// ============================================================

// ADMIN DASHBOARD

// ============================================================



function AdminDashboard() {

  const navigate = useNavigate();



  // ----------------------------------------------------------

  // STATE

  // ----------------------------------------------------------



  const [summary, setSummary] = useState(null);



  const [users, setUsers] = useState([]);



  const [cards, setCards] = useState([]);



  const [transactions, setTransactions] =

    useState([]);



  const [loading, setLoading] = useState(true);



  const [refreshing, setRefreshing] =

    useState(false);



  const [exporting, setExporting] =

    useState(false);



  const [error, setError] = useState("");



  const [accessDenied, setAccessDenied] =

    useState(false);



  // Stores the card currently being blocked/unblocked.

  const [cardActionId, setCardActionId] =

    useState(null);


  // Stores the card selected for credit-limit editing.
  const [creditLimitCard, setCreditLimitCard] =
    useState(null);

  const [creditLimitValue, setCreditLimitValue] =
    useState("");

  const [updatingCreditLimit, setUpdatingCreditLimit] =
    useState(false);

  // Stores the card selected for activity viewing.
  const [activityCard, setActivityCard] =
    useState(null);

  const [activityLoading, setActivityLoading] =
    useState(false);

  const [activityData, setActivityData] =
    useState([]);





  // ==========================================================

  // LOAD ADMIN DASHBOARD

  // ==========================================================



  const loadAdminDashboard = async () => {

    const token =

      localStorage.getItem("access_token");



    console.log(

      "ADMIN DASHBOARD TOKEN EXISTS:",

      Boolean(token)

    );



    if (!token) {

      setLoading(false);

      setAccessDenied(true);



      setError(

        "No access token was found in this browser session."

      );



      return;

    }



    setLoading(true);

    setError("");

    setAccessDenied(false);



    try {

      // -------------------------------------------------------

      // SUMMARY

      // -------------------------------------------------------



      const summaryData =

        await adminRequest(

          "/api/admin-dashboard/summary/"

        );



      console.log(

        "Admin dashboard summary loaded:",

        summaryData

      );



      setSummary(summaryData);





      // -------------------------------------------------------

      // USERS / CARDS / TRANSACTIONS

      // -------------------------------------------------------



      const results =

        await Promise.allSettled([

          adminRequest(

            "/api/admin-dashboard/users/"

          ),



          adminRequest(

            "/api/admin-dashboard/cards/"

          ),



          adminRequest(

            "/api/admin-dashboard/transactions/"

          ),

        ]);



      const [

        usersResult,

        cardsResult,

        transactionsResult,

      ] = results;





      // -------------------------------------------------------

      // USERS

      // -------------------------------------------------------



      if (

        usersResult.status ===

        "fulfilled"

      ) {

        const usersData =

          usersResult.value;



        setUsers(

          usersData?.results ||

            usersData ||

            []

        );

      } else {

        console.error(

          "Users API error:",

          usersResult.reason

        );



        setUsers([]);

      }





      // -------------------------------------------------------

      // CARDS

      // -------------------------------------------------------



      if (

        cardsResult.status ===

        "fulfilled"

      ) {

        const cardsData =

          cardsResult.value;



        setCards(

          cardsData?.results ||

            cardsData ||

            []

        );

      } else {

        console.error(

          "Cards API error:",

          cardsResult.reason

        );



        setCards([]);

      }





      // -------------------------------------------------------

      // TRANSACTIONS

      // -------------------------------------------------------



      if (

        transactionsResult.status ===

        "fulfilled"

      ) {

        const transactionsData =

          transactionsResult.value;



        setTransactions(

          transactionsData?.results ||

            transactionsData ||

            []

        );

      } else {

        console.error(

          "Transactions API error:",

          transactionsResult.reason

        );



        setTransactions([]);

      }





      // -------------------------------------------------------

      // SECONDARY REQUEST WARNING

      // -------------------------------------------------------



      const failedRequests =

        results.filter(

          (result) =>

            result.status ===

            "rejected"

        );



      if (

        failedRequests.length > 0

      ) {

        setError(

          "Some admin data could not be loaded. The summary is still available."

        );

      }



    } catch (err) {

      console.error(

        "Admin dashboard error:",

        err

      );



      console.error(

        "Admin dashboard status:",

        err?.status

      );



      console.error(

        "Admin dashboard response:",

        err?.data

      );





      // -------------------------------------------------------

      // 401

      // -------------------------------------------------------



      if (err?.status === 401) {

        setAccessDenied(true);



        setError(

          "Your admin session is not authorized."

        );



        return;

      }





      // -------------------------------------------------------

      // 403

      // -------------------------------------------------------



      if (err?.status === 403) {

        setAccessDenied(true);



        setError(

          "You do not have permission to access the Admin Dashboard."

        );



        return;

      }





      // -------------------------------------------------------

      // OTHER ERRORS

      // -------------------------------------------------------



      setError(

        err?.data?.detail ||

          err?.message ||

          "Unable to load the Admin Dashboard."

      );



    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  };





  // ==========================================================

  // INITIAL LOAD

  // ==========================================================



  useEffect(() => {

    loadAdminDashboard();

  }, []);





  // ==========================================================

  // REFRESH

  // ==========================================================



  const handleRefresh = () => {

    setRefreshing(true);

    loadAdminDashboard();

  };





  // ==========================================================

  // BLOCK CARD

  // ==========================================================



  const handleBlockCard = async (

    cardId

  ) => {

    const confirmed =

      window.confirm(

        `Are you sure you want to block card #${cardId}?`

      );



    if (!confirmed) {

      return;

    }



    setCardActionId(cardId);

    setError("");



    try {

      await adminRequest(

        `/api/admin-dashboard/cards/${cardId}/block/`,

        {

          method: "POST",

        }

      );



      setCards(

        (currentCards) =>

          currentCards.map(

            (card) =>

              card.id === cardId

                ? {

                    ...card,

                    status: "BLOCKED",

                  }

                : card

          )

      );



    } catch (err) {

      console.error(

        "Block card error:",

        err

      );



      setError(

        err?.data?.detail ||

          err?.message ||

          "Unable to block the card."

      );



    } finally {

      setCardActionId(null);

    }

  };





  // ==========================================================

  // UNBLOCK CARD

  // ==========================================================



  const handleUnblockCard = async (

    cardId

  ) => {

    const confirmed =

      window.confirm(

        `Are you sure you want to unblock card #${cardId}?`

      );



    if (!confirmed) {

      return;

    }



    setCardActionId(cardId);

    setError("");



    try {

      await adminRequest(

        `/api/admin-dashboard/cards/${cardId}/unblock/`,

        {

          method: "POST",

        }

      );



      setCards(

        (currentCards) =>

          currentCards.map(

            (card) =>

              card.id === cardId

                ? {

                    ...card,

                    status: "ACTIVE",

                  }

                : card

          )

      );



    } catch (err) {

      console.error(

        "Unblock card error:",

        err

      );



      setError(

        err?.data?.detail ||

          err?.message ||

          "Unable to unblock the card."

      );



    } finally {

      setCardActionId(null);

    }

  };





  // ==========================================================

  // ==========================================================
  // UPDATE CREDIT LIMIT
  // ==========================================================

  const handleUpdateCreditLimit = async () => {
    if (!creditLimitCard) {
      return;
    }

    const numericLimit =
      Number(creditLimitValue);

    if (
      !Number.isFinite(numericLimit) ||
      numericLimit < 0
    ) {
      setError(
        "Credit limit must be a valid non-negative number."
      );

      return;
    }

    setUpdatingCreditLimit(true);
    setError("");

    try {
      const response =
        await adminRequest(
          `/api/admin-dashboard/cards/${creditLimitCard.id}/credit-limit/`,
          {
            method: "PATCH",
            body: JSON.stringify({
              credit_limit:
                numericLimit.toFixed(2),
            }),
          }
        );

      setCards((currentCards) =>
        currentCards.map((card) =>
          card.id === creditLimitCard.id
            ? {
                ...card,
                credit_limit:
                  response.credit_limit ??
                  numericLimit.toFixed(2),
              }
            : card
        )
      );

      setCreditLimitCard(null);
      setCreditLimitValue("");

    } catch (err) {
      console.error(
        "Credit limit update error:",
        err
      );

      setError(
        err?.data?.detail ||
          err?.message ||
          "Unable to update credit limit."
      );

    } finally {
      setUpdatingCreditLimit(false);
    }
  };


  // ==========================================================
  // VIEW CARD ACTIVITY
  // ==========================================================

  const handleViewActivity = async (card) => {
    setActivityCard(card);
    setActivityLoading(true);
    setActivityData([]);
    setError("");

    try {
      const response =
        await adminRequest(
          `/api/admin-dashboard/cards/${card.id}/activity/`
        );

      setActivityData(
        response?.activity || []
      );

    } catch (err) {
      console.error(
        "Card activity error:",
        err
      );

      setError(
        err?.data?.detail ||
          err?.message ||
          "Unable to load card activity."
      );

    } finally {
      setActivityLoading(false);
    }
  };


  // LOGOUT

  // ==========================================================



  const handleLogout = async () => {

    const accessToken =

      localStorage.getItem(

        "access_token"

      );



    const refreshToken =

      localStorage.getItem(

        "refresh_token"

      );



    try {

      if (

        accessToken &&

        refreshToken

      ) {

        await fetch(

          `${API_BASE_URL}/api/auth/logout/`,

          {

            method: "POST",



            headers: {

              "Content-Type":

                "application/json",



              Authorization:

                `Bearer ${accessToken}`,

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



    navigate("/login", {

      replace: true,

    });

  };





  // ==========================================================

  // EXPORT CSV

  // ==========================================================



  const handleExport = async () => {

    setExporting(true);

    setError("");



    try {

      const token =

        localStorage.getItem(

          "access_token"

        );



      if (!token) {

        setError(

          "You are not logged in."

        );



        return;

      }



      const response =

        await fetch(

          `${API_BASE_URL}/api/admin-dashboard/transactions/export/`,

          {

            method: "GET",



            headers: {

              Authorization:

                `Bearer ${token}`,

            },

          }

        );





      if (

        response.status === 401

      ) {

        setError(

          "Your admin session is not authorized."

        );



        return;

      }





      if (

        response.status === 403

      ) {

        setError(

          "You do not have permission to export transactions."

        );



        return;

      }





      if (!response.ok) {

        throw new Error(

          "CSV export failed."

        );

      }





      const blob =

        await response.blob();





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

        "transactions.csv";



      document.body.appendChild(

        link

      );



      link.click();



      link.remove();



      window.URL.revokeObjectURL(

        downloadUrl

      );



    } catch (err) {

      console.error(

        "CSV export error:",

        err

      );



      setError(

        err?.message ||

          "Unable to export transactions."

      );



    } finally {

      setExporting(false);

    }

  };





  // ==========================================================

  // HELPERS

  // ==========================================================



  const formatAmount = (

    value

  ) => {

    const number =

      Number(value || 0);



    return `₹${number.toLocaleString(

      "en-IN",

      {

        minimumFractionDigits: 2,

        maximumFractionDigits: 2,

      }

    )}`;

  };





  const statusClass = (

    status

  ) => {

    if (

      status === "SUCCESS"

    ) {

      return "bg-emerald-400/10 text-emerald-400";

    }



    if (

      status === "FAILED"

    ) {

      return "bg-red-400/10 text-red-400";

    }



    return "bg-amber-400/10 text-amber-400";

  };





  const cardMap = useMemo(() => {

    return cards.reduce(

      (map, card) => {

        map[card.id] =

          card;



        return map;

      },

      {}

    );

  }, [cards]);





  // ==========================================================

  // LOADING

  // ==========================================================



  if (loading) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">



        <div className="text-center">



          <div

            className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400"

            aria-label="Loading"

          />



          <p className="text-sm text-slate-400">

            Loading Admin Dashboard...

          </p>



        </div>



      </div>

    );

  }





  // ==========================================================

  // ACCESS DENIED

  // ==========================================================



  if (

    accessDenied &&

    !summary

  ) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">



        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-900 p-8 text-center shadow-2xl">



          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl text-red-400">

            !

          </div>



          <h1 className="mt-5 text-2xl font-bold">

            Access Denied

          </h1>



          <p className="mt-3 text-sm leading-6 text-slate-500">

            {error ||

              "This dashboard is restricted to admin and staff users."}

          </p>



          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">



            <button

              type="button"

              onClick={handleRefresh}

              disabled={refreshing}

              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"

            >

              {refreshing

                ? "Checking..."

                : "Try Again"}

            </button>



            <Link

              to="/dashboard"

              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"

            >

              Back to Dashboard

            </Link>



          </div>



        </div>



      </div>

    );

  }





  const dailySummary =

    summary?.daily_summary || {};





  // ==========================================================

  // MAIN UI

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

                Admin Console

              </p>



            </div>



          </div>





          <div className="flex items-center gap-3">



            <Link

              to="/dashboard"

              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"

            >

              User Dashboard

            </Link>





            <button

              type="button"

              onClick={handleRefresh}

              disabled={refreshing}

              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"

            >

              {refreshing

                ? "Refreshing..."

                : "Refresh"}

            </button>





            <button

              type="button"

              onClick={handleLogout}

              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"

            >

              Logout

            </button>



          </div>



        </div>



      </header>





      {/* ================================================== */}

      {/* MAIN */}

      {/* ================================================== */}



      <main className="mx-auto max-w-7xl px-6 py-8">





        {/* ================================================== */}

        {/* TITLE */}

        {/* ================================================== */}



        <section className="mb-8">



          <p className="text-sm font-medium text-cyan-400">

            Administration

          </p>



          <h1 className="mt-2 text-3xl font-bold">

            Admin Dashboard

          </h1>



          <p className="mt-2 text-sm text-slate-500">

            Monitor users, cards, transactions,

            and payment activity.

          </p>



        </section>





        {/* ================================================== */}

        {/* ERROR */}

        {/* ================================================== */}



        {error && (

          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">

            {error}

          </div>

        )}





        {/* ================================================== */}

        {/* OVERVIEW */}

        {/* ================================================== */}



        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">



          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">



            <p className="text-sm text-slate-500">

              Total Users

            </p>



            <p className="mt-3 text-3xl font-bold">

              {summary?.users || 0}

            </p>



          </div>





          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">



            <p className="text-sm text-slate-500">

              Total Cards

            </p>



            <p className="mt-3 text-3xl font-bold">

              {summary?.cards || 0}

            </p>



          </div>





          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">



            <p className="text-sm text-slate-500">

              Total Transactions

            </p>



            <p className="mt-3 text-3xl font-bold">

              {summary?.transactions || 0}

            </p>



          </div>





          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">



            <p className="text-sm text-slate-500">

              Total Amount

            </p>



            <p className="mt-3 text-3xl font-bold">

              {formatAmount(

                summary?.total_amount

              )}

            </p>



          </div>



        </section>





        {/* ================================================== */}

        {/* PAYMENT STATUS */}

        {/* ================================================== */}



        <section className="mt-6 grid gap-5 md:grid-cols-3">



          <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-5">



            <p className="text-sm text-slate-500">

              Successful

            </p>



            <p className="mt-2 text-2xl font-bold text-emerald-400">

              {summary?.successful_transactions || 0}

            </p>



            <p className="mt-1 text-sm text-slate-600">

              {formatAmount(

                summary?.successful_amount

              )}

            </p>



          </div>





          <div className="rounded-2xl border border-amber-400/10 bg-amber-400/5 p-5">



            <p className="text-sm text-slate-500">

              Pending

            </p>



            <p className="mt-2 text-2xl font-bold text-amber-400">

              {summary?.pending_transactions || 0}

            </p>



          </div>





          <div className="rounded-2xl border border-red-400/10 bg-red-400/5 p-5">



            <p className="text-sm text-slate-500">

              Failed

            </p>



            <p className="mt-2 text-2xl font-bold text-red-400">

              {summary?.failed_transactions || 0}

            </p>



          </div>



        </section>





        {/* ================================================== */}

        {/* DAILY SUMMARY */}

        {/* ================================================== */}



        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">



          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">



            <div>



              <h2 className="text-xl font-semibold">

                Daily Payment Summary

              </h2>



              <p className="mt-1 text-sm text-slate-500">

                Summary for{" "}

                {dailySummary.date || "-"}

              </p>



            </div>





            <button

              type="button"

              onClick={handleExport}

              disabled={exporting}

              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"

            >

              {exporting

                ? "Exporting..."

                : "Export Transactions CSV"}

            </button>



          </div>





          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">



            <div className="rounded-xl bg-slate-950 p-4">



              <p className="text-xs text-slate-500">

                Transactions

              </p>



              <p className="mt-2 text-xl font-bold">

                {dailySummary.transactions || 0}

              </p>



            </div>





            <div className="rounded-xl bg-slate-950 p-4">



              <p className="text-xs text-slate-500">

                Successful

              </p>



              <p className="mt-2 text-xl font-bold text-emerald-400">

                {dailySummary.successful || 0}

              </p>



            </div>





            <div className="rounded-xl bg-slate-950 p-4">



              <p className="text-xs text-slate-500">

                Pending

              </p>



              <p className="mt-2 text-xl font-bold text-amber-400">

                {dailySummary.pending || 0}

              </p>



            </div>





            <div className="rounded-xl bg-slate-950 p-4">



              <p className="text-xs text-slate-500">

                Failed

              </p>



              <p className="mt-2 text-xl font-bold text-red-400">

                {dailySummary.failed || 0}

              </p>



            </div>





            <div className="rounded-xl bg-slate-950 p-4">



              <p className="text-xs text-slate-500">

                Total Amount

              </p>



              <p className="mt-2 text-xl font-bold">

                {formatAmount(

                  dailySummary.total_amount

                )}

              </p>



            </div>



          </div>



        </section>





        {/* ================================================== */}

        {/* USERS */}

        {/* ================================================== */}



        <section className="mt-8">



          <div className="mb-4">



            <h2 className="text-xl font-semibold">

              Users

            </h2>



            <p className="mt-1 text-sm text-slate-500">

              {users.length} users

            </p>



          </div>





          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">



            <div className="overflow-x-auto">



              <table className="w-full min-w-[750px] text-left text-sm">



                <thead className="border-b border-slate-800 text-slate-500">



                  <tr>



                    <th className="px-5 py-4 font-medium">

                      ID

                    </th>



                    <th className="px-5 py-4 font-medium">

                      Username

                    </th>



                    <th className="px-5 py-4 font-medium">

                      Email

                    </th>



                    <th className="px-5 py-4 font-medium">

                      Role

                    </th>



                    <th className="px-5 py-4 font-medium">

                      Status

                    </th>



                  </tr>



                </thead>





                <tbody>



                  {users.length === 0 ? (



                    <tr>



                      <td

                        colSpan="5"

                        className="px-5 py-8 text-center text-sm text-slate-500"

                      >

                        No users available.

                      </td>



                    </tr>



                  ) : (



                    users.map(

                      (user) => (



                        <tr

                          key={user.id}

                          className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30"

                        >



                          <td className="px-5 py-4 text-slate-400">

                            {user.id}

                          </td>





                          <td className="px-5 py-4 font-medium text-slate-200">

                            {user.username}

                          </td>





                          <td className="px-5 py-4 text-slate-400">

                            {user.email}

                          </td>





                          <td className="px-5 py-4">



                            <span

                              className={`rounded-full px-3 py-1 text-xs font-medium ${

                                user.is_staff

                                  ? "bg-cyan-400/10 text-cyan-400"

                                  : "bg-slate-800 text-slate-400"

                              }`}

                            >

                              {user.is_staff

                                ? "Admin / Staff"

                                : "User"}

                            </span>



                          </td>





                          <td className="px-5 py-4">



                            <span

                              className={`rounded-full px-3 py-1 text-xs font-medium ${

                                user.is_active

                                  ? "bg-emerald-400/10 text-emerald-400"

                                  : "bg-red-400/10 text-red-400"

                              }`}

                            >

                              {user.is_active

                                ? "Active"

                                : "Inactive"}

                            </span>



                          </td>



                        </tr>



                      )

                    )



                  )}



                </tbody>



              </table>



            </div>



          </div>



        </section>





        {/* ================================================== */}

        {/* CARDS */}

        {/* ================================================== */}



        <section className="mt-8">



          <div className="mb-4">



            <h2 className="text-xl font-semibold">

              Cards

            </h2>



            <p className="mt-1 text-sm text-slate-500">

              {cards.length} saved cards

            </p>



          </div>





          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">



            <div className="overflow-x-auto">



              <table className="w-full min-w-[1200px] text-left text-sm">



                <thead className="border-b border-slate-800 text-slate-500">



                  <tr>



                    <th className="px-5 py-4 font-medium">

                      ID

                    </th>



                    <th className="px-5 py-4 font-medium">

                      User ID

                    </th>



                    <th className="px-5 py-4 font-medium">

                      Card

                    </th>



                    <th className="px-5 py-4 font-medium">

                      Type

                    </th>



                    <th className="px-5 py-4 font-medium">

                      Expiry

                    </th>



                    <th className="px-5 py-4 font-medium">

                      Status

                    </th>



                    <th className="px-5 py-4 font-medium">

                      Credit Limit

                    </th>



                    <th className="px-5 py-4 font-medium">

                      Action

                    </th>



                  </tr>



                </thead>





                <tbody>



                  {cards.length === 0 ? (



                    <tr>



                      <td

                        colSpan="8"

                        className="px-5 py-8 text-center text-sm text-slate-500"

                      >

                        No cards available.

                      </td>



                    </tr>



                  ) : (



                    cards.map(

                      (card) => (



                        <tr

                          key={card.id}

                          className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30"

                        >



                          {/* ID */}



                          <td className="px-5 py-4 text-slate-400">

                            {card.id}

                          </td>





                          {/* USER ID */}



                          <td className="px-5 py-4 text-slate-400">

                            {card.user_id}

                          </td>





                          {/* MASKED CARD */}



                          <td className="px-5 py-4 font-mono text-slate-200">

                            {card.masked_card_number}

                          </td>





                          {/* TYPE */}



                          <td className="px-5 py-4 capitalize text-slate-400">

                            {card.card_type}

                          </td>





                          {/* EXPIRY */}



                          <td className="px-5 py-4 text-slate-400">



                            {String(

                              card.expiry_month

                            ).padStart(

                              2,

                              "0"

                            )}



                            /{card.expiry_year}



                          </td>





                          {/* STATUS */}



                          <td className="px-5 py-4">



                            <span

                              className={`rounded-full px-3 py-1 text-xs font-medium ${

                                card.status ===

                                "BLOCKED"

                                  ? "bg-red-400/10 text-red-400"

                                  : "bg-emerald-400/10 text-emerald-400"

                              }`}

                            >

                              {card.status ||

                                "ACTIVE"}

                            </span>



                          </td>





                          {/* CREDIT LIMIT */}



                          <td className="px-5 py-4 text-slate-300">

                            {formatAmount(

                              card.credit_limit

                            )}

                          </td>





                          {/* ACTION */}

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">

                              {card.status === "BLOCKED" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUnblockCard(
                                      card.id
                                    )
                                  }
                                  disabled={
                                    cardActionId ===
                                    card.id
                                  }
                                  aria-label={`Unblock card ${card.id}`}
                                  className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {cardActionId === card.id
                                    ? "Unblocking..."
                                    : "Unblock"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleBlockCard(
                                      card.id
                                    )
                                  }
                                  disabled={
                                    cardActionId ===
                                    card.id
                                  }
                                  aria-label={`Block card ${card.id}`}
                                  className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {cardActionId === card.id
                                    ? "Blocking..."
                                    : "Block"}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setCreditLimitCard(card);
                                  setCreditLimitValue(
                                    String(
                                      card.credit_limit ??
                                        ""
                                    )
                                  );
                                }}
                                aria-label={`Update credit limit for card ${card.id}`}
                                className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400"
                              >
                                Update Limit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleViewActivity(card)
                                }
                                aria-label={`View activity for card ${card.id}`}
                                className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                              >
                                Activity
                              </button>

                            </div>
                          </td>



                        </tr>



                      )

                    )



                  )}



                </tbody>



              </table>



            </div>



          </div>



        </section>





        {/* ================================================== */}

        {/* TRANSACTIONS */}

        {/* ================================================== */}



        <section className="mt-8 pb-10">



          <div className="mb-4">



            <h2 className="text-xl font-semibold">

              Transactions

            </h2>



            <p className="mt-1 text-sm text-slate-500">

              {transactions.length} transactions

            </p>



          </div>





          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">



            <div className="overflow-x-auto">



              <table className="w-full min-w-[1100px] text-left text-sm">



                <thead className="border-b border-slate-800 text-slate-500">



                  <tr>



                    <th className="px-5 py-4 font-medium">

                      ID

                    </th>



                    <th className="px-5 py-4 font-medium">

                      User

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

                      Reference

                    </th>



                    <th className="px-5 py-4 font-medium">

                      Date

                    </th>



                  </tr>



                </thead>





                <tbody>



                  {transactions.length ===

                  0 ? (



                    <tr>



                      <td

                        colSpan="7"

                        className="px-5 py-8 text-center text-sm text-slate-500"

                      >

                        No transactions available.

                      </td>



                    </tr>



                  ) : (



                    transactions.map(

                      (transaction) => {

                        const card =

                          cardMap[

                            transaction.card_id

                          ];



                        return (



                          <tr

                            key={

                              transaction.id

                            }

                            className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30"

                          >



                            <td className="px-5 py-4 text-slate-400">

                              {

                                transaction.id

                              }

                            </td>





                            <td className="px-5 py-4 text-slate-400">

                              {

                                transaction.user_id

                              }

                            </td>





                            <td className="px-5 py-4 font-mono text-slate-400">

                              {card?.masked_card_number ||

                                `**** ${transaction.card_id}`}

                            </td>





                            <td className="px-5 py-4 font-semibold text-slate-200">

                              {formatAmount(

                                transaction.amount

                              )}

                            </td>





                            <td className="px-5 py-4">



                              <span

                                className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(

                                  transaction.status

                                )}`}

                              >

                                {

                                  transaction.status

                                }

                              </span>



                            </td>





                            <td className="px-5 py-4 font-medium text-slate-200">

                              {

                                transaction.transaction_reference

                              }

                            </td>





                            <td className="px-5 py-4 text-slate-500">



                              {transaction.created_at

                                ? new Date(

                                    transaction.created_at

                                  ).toLocaleString()

                                : "-"}



                            </td>



                          </tr>



                        );

                      }

                    )



                  )}



                </tbody>



              </table>



            </div>



          </div>



        </section>



      

        {/* ================================================== */}
        {/* CREDIT LIMIT MODAL */}
        {/* ================================================== */}

        {creditLimitCard && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="credit-limit-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-400">
                    Card Management
                  </p>

                  <h2
                    id="credit-limit-title"
                    className="mt-1 text-xl font-semibold"
                  >
                    Update Credit Limit
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCreditLimitCard(null);
                    setCreditLimitValue("");
                  }}
                  aria-label="Close credit limit dialog"
                  className="rounded-lg px-3 py-1 text-xl text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 rounded-xl bg-slate-950 p-4">
                <p className="text-xs text-slate-500">
                  Card
                </p>

                <p className="mt-1 font-mono text-sm text-slate-200">
                  {creditLimitCard.masked_card_number}
                </p>

                <p className="mt-3 text-xs text-slate-500">
                  Current Credit Limit
                </p>

                <p className="mt-1 font-semibold text-slate-200">
                  {formatAmount(
                    creditLimitCard.credit_limit
                  )}
                </p>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="new-credit-limit"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  New Credit Limit
                </label>

                <input
                  id="new-credit-limit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={creditLimitValue}
                  onChange={(event) =>
                    setCreditLimitValue(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="100000.00"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreditLimitCard(null);
                    setCreditLimitValue("");
                  }}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpdateCreditLimit}
                  disabled={updatingCreditLimit}
                  className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingCreditLimit
                    ? "Updating..."
                    : "Update Limit"}
                </button>
              </div>

            </div>
          </div>
        )}


        {/* ================================================== */}
        {/* CARD ACTIVITY MODAL */}
        {/* ================================================== */}

        {activityCard && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-title"
          >
            <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-400">
                    Card Activity
                  </p>

                  <h2
                    id="activity-title"
                    className="mt-1 text-xl font-semibold"
                  >
                    {activityCard.masked_card_number}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Card #{activityCard.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActivityCard(null)
                  }
                  aria-label="Close card activity dialog"
                  className="rounded-lg px-3 py-1 text-xl text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 max-h-[60vh] overflow-y-auto">
                {activityLoading ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
                    <p className="text-sm text-slate-500">
                      Loading card activity...
                    </p>
                  </div>
                ) : activityData.length === 0 ? (
                  <div className="rounded-xl bg-slate-950 p-8 text-center">
                    <p className="text-sm text-slate-500">
                      No activity has been recorded for this card.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityData.map((activity) => (
                      <div
                        key={activity.id}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-200">
                              {activity.action}
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                              {activity.description}
                            </p>
                          </div>

                          <span className="shrink-0 text-xs text-slate-500">
                            {activity.created_at
                              ? new Date(
                                  activity.created_at
                                ).toLocaleString()
                              : "-"}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>
                            Admin:{" "}
                            <span className="text-slate-300">
                              {activity.admin_user || "-"}
                            </span>
                          </span>

                          <span>
                            IP:{" "}
                            <span className="font-mono text-slate-300">
                              {activity.ip_address || "-"}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setActivityCard(null)
                  }
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}
</main>

    </div>

  );

}


export default AdminDashboard;

// command line