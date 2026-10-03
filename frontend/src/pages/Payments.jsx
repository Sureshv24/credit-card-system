
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../services/api";

const FASTAPI_BASE_URL = "http://127.0.0.1:8001";

function Payment() {
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState("");
  const [amount, setAmount] = useState("");

  const [payment, setPayment] = useState(null);

  const [loadingCards, setLoadingCards] = useState(true);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    const loadCards = async () => {
      try {
        const data = await apiRequest("/api/cards/");

        const cardList = data?.results || data || [];

        setCards(cardList);

        if (cardList.length > 0) {
          setSelectedCard(String(cardList[0].id));
        }
      } catch (error) {
        if (error.status === 401) {
          sessionStorage.clear();
          navigate("/login", { replace: true });
          return;
        }

        setMessageType("error");
        setMessage(
          error.data?.detail ||
            "Unable to load your saved cards."
        );
      } finally {
        setLoadingCards(false);
      }
    };

    loadCards();
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("access_token");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const handleCreatePayment = async (event) => {
    event.preventDefault();

    setMessage("");

    const numericAmount = Number(amount);

    if (!selectedCard) {
      setMessageType("error");
      setMessage("Please select a card.");
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setMessageType("error");
      setMessage("Enter a valid payment amount.");
      return;
    }

    setCreatingPayment(true);

    try {
      const response = await fetch(
        `${FASTAPI_BASE_URL}/api/payments/`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            card_id: Number(selectedCard),
            amount: Number(numericAmount.toFixed(2)),
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.clear();
          navigate("/login", { replace: true });
          return;
        }

        setMessageType("error");
        setMessage(
          data?.detail ||
            "Unable to create payment."
        );
        return;
      }

      setPayment(data);
      setMessageType("success");
      setMessage(
        "Payment created successfully and is now pending."
      );

      setAmount("");
    } catch (error) {
      setMessageType("error");
      setMessage(
        "Unable to connect to the payment service."
      );
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!payment?.id) {
      return;
    }

    setMessage("");
    setProcessingPayment(true);

    try {
      const response = await fetch(
        `${FASTAPI_BASE_URL}/api/payments/${payment.id}/process`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.clear();
          navigate("/login", { replace: true });
          return;
        }

        setMessageType("error");
        setMessage(
          data?.detail ||
            "Unable to process payment."
        );
        return;
      }

      setPayment(data);

      setMessageType(
        data.status === "SUCCESS"
          ? "success"
          : "error"
      );

      setMessage(
        data.status === "SUCCESS"
          ? "Payment processed successfully."
          : "Payment processing failed."
      );
    } catch (error) {
      setMessageType("error");
      setMessage(
        "Unable to connect to the payment service."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const selectedCardObject = cards.find(
    (card) => String(card.id) === String(selectedCard)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

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
      <main className="mx-auto max-w-6xl px-6 py-8">

        <div className="mb-8">

          <p className="text-sm font-medium text-cyan-400">
            Payment Processing
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Make a Payment
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Select a saved card and enter the payment amount.
          </p>

        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm ${
              messageType === "success"
                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : messageType === "error"
                  ? "border border-red-500/20 bg-red-500/10 text-red-300"
                  : "bg-slate-800 text-slate-300"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

          {/* PAYMENT FORM */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Payment Details
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Payments are processed securely through the
                payment service.
              </p>
            </div>

            {loadingCards ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-500">
                Loading your cards...
              </div>
            ) : cards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">

                <p className="text-sm text-slate-400">
                  You don't have any saved cards.
                </p>

                <Link
                  to="/cards"
                  className="mt-4 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950"
                >
                  Add a Card
                </Link>

              </div>
            ) : (
              <form
                onSubmit={handleCreatePayment}
                className="space-y-6"
              >

                {/* CARD */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Select Card
                  </label>

                  <select
                    value={selectedCard}
                    onChange={(event) =>
                      setSelectedCard(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none focus:border-cyan-400"
                  >

                    {cards.map((card) => (
                      <option
                        key={card.id}
                        value={card.id}
                      >
                        {card.card_type.toUpperCase()} -{" "}
                        **** {card.last_four_digits}
                      </option>
                    ))}

                  </select>

                </div>

                {/* SELECTED CARD PREVIEW */}
                {selectedCardObject && (
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 p-5">

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-semibold tracking-[0.18em] text-slate-300">
                        CARDPAY
                      </span>

                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs capitalize text-slate-300">
                        {selectedCardObject.card_type}
                      </span>

                    </div>

                    <p className="mt-8 font-mono text-lg tracking-[0.18em] text-slate-200">
                      {selectedCardObject.masked_card_number}
                    </p>

                    <div className="mt-5 flex justify-between">

                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-500">
                          Last four
                        </p>

                        <p className="mt-1 text-xs text-slate-200">
                          {selectedCardObject.last_four_digits}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-500">
                          Valid thru
                        </p>

                        <p className="mt-1 text-xs text-slate-200">
                          {String(
                            selectedCardObject.expiry_month
                          ).padStart(2, "0")}
                          /
                          {selectedCardObject.expiry_year}
                        </p>
                      </div>

                    </div>

                  </div>
                )}

                {/* AMOUNT */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Payment Amount
                  </label>

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(event) =>
                        setAmount(event.target.value)
                      }
                      placeholder="0.00"
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3.5 pl-9 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                    />

                  </div>

                </div>

                {/* CREATE */}
                <button
                  type="submit"
                  disabled={creatingPayment}
                  className="w-full rounded-xl bg-cyan-400 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingPayment
                    ? "Creating Payment..."
                    : "Create Payment"}
                </button>

              </form>
            )}

          </section>

          {/* PAYMENT STATUS */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Payment Status
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Your current payment processing status.
              </p>
            </div>

            {!payment ? (
              <div className="flex min-h-[330px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">

                <div>

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-xl text-cyan-400">
                    ₹
                  </div>

                  <p className="mt-4 font-medium text-slate-300">
                    No payment created
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Create a payment to see its status here.
                  </p>

                </div>

              </div>
            ) : (
              <div>

                {/* STATUS */}
                <div
                  className={`rounded-2xl border p-6 ${
                    payment.status === "SUCCESS"
                      ? "border-emerald-400/20 bg-emerald-400/5"
                      : payment.status === "FAILED"
                        ? "border-red-400/20 bg-red-400/5"
                        : "border-amber-400/20 bg-amber-400/5"
                  }`}
                >

                  <p className="text-sm text-slate-500">
                    Current Status
                  </p>

                  <p
                    className={`mt-2 text-3xl font-bold ${
                      payment.status === "SUCCESS"
                        ? "text-emerald-400"
                        : payment.status === "FAILED"
                          ? "text-red-400"
                          : "text-amber-400"
                    }`}
                  >
                    {payment.status}
                  </p>

                </div>

                {/* DETAILS */}
                <div className="mt-5 space-y-4">

                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">

                    <span className="text-sm text-slate-500">
                      Transaction Reference
                    </span>

                    <span className="max-w-[190px] break-all text-right text-sm font-medium text-slate-200">
                      {payment.transaction_reference}
                    </span>

                  </div>

                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">

                    <span className="text-sm text-slate-500">
                      Amount
                    </span>

                    <span className="text-sm font-semibold text-slate-200">
                      ₹{Number(payment.amount).toFixed(2)}
                    </span>

                  </div>

                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">

                    <span className="text-sm text-slate-500">
                      Card
                    </span>

                    <span className="text-sm text-slate-200">
                      ****{" "}
                      {selectedCardObject?.last_four_digits ||
                        payment.card_id}
                    </span>

                  </div>

                </div>

                {/* PROCESS */}
                {payment.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={handleProcessPayment}
                    disabled={processingPayment}
                    className="mt-6 w-full rounded-xl bg-cyan-400 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processingPayment
                      ? "Processing Payment..."
                      : "Process Payment"}
                  </button>
                )}

                {/* FINISHED */}
                {payment.status === "SUCCESS" && (
                  <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-center text-sm text-emerald-300">
                    Payment completed successfully.
                  </div>
                )}

                {payment.status === "FAILED" && (
                  <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm text-red-300">
                    Payment processing failed.
                  </div>
                )}

              </div>
            )}

          </section>

        </div>

      </main>
    </div>
  );
}

export default Payment;
