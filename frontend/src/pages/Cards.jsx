import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../services/api";

function Cards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [showForm, setShowForm] = useState(false);

  const [cardType, setCardType] = useState("credit");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");

  const loadCards = async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = await apiRequest("/api/cards/");

      setCards(data?.results || data || []);
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.data?.detail ||
          "Unable to load your cards."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const resetForm = () => {
    setCardType("credit");
    setCardNumber("");
    setExpiryMonth("");
    setExpiryYear("");
  };

  const handleAddCard = async (event) => {
    event.preventDefault();

    setMessage("");

    const cleanedCardNumber = cardNumber.replace(/\s/g, "");

    if (!/^\d{13,19}$/.test(cleanedCardNumber)) {
      setMessageType("error");
      setMessage(
        "Card number must contain between 13 and 19 digits."
      );
      return;
    }

    const month = Number(expiryMonth);
    const year = Number(expiryYear);

    if (month < 1 || month > 12) {
      setMessageType("error");
      setMessage(
        "Expiry month must be between 1 and 12."
      );
      return;
    }

    if (!/^\d{4}$/.test(String(year))) {
      setMessageType("error");
      setMessage(
        "Expiry year must contain 4 digits."
      );
      return;
    }

    setSaving(true);

    try {
      await apiRequest("/api/cards/", {
        method: "POST",
        body: JSON.stringify({
          card_type: cardType,
          card_number: cleanedCardNumber,
          expiry_month: month,
          expiry_year: year,
        }),
      });

      setMessageType("success");
      setMessage("Card added successfully.");

      resetForm();
      setShowForm(false);

      await loadCards();
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

      setMessageType("error");
      setMessage(
        errors.length
          ? errors.join(" | ")
          : "Unable to add the card."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this card?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      await apiRequest(`/api/cards/${cardId}/`, {
        method: "DELETE",
      });

      setMessageType("success");
      setMessage("Card removed successfully.");

      await loadCards();
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.data?.detail ||
          "Unable to remove the card."
      );
    }
  };

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

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-medium text-cyan-400">
              Card Management
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              My Cards
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your saved credit and debit cards.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setMessage("");
            }}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            {showForm ? "Close" : "+ Add New Card"}
          </button>

        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm ${
              messageType === "success"
                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {message}
          </div>
        )}

        {/* ADD CARD FORM */}
        {showForm && (
          <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Add New Card
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Your full card number is used only for processing
                and is not stored by the application.
              </p>
            </div>

            <form
              onSubmit={handleAddCard}
              className="grid gap-5 md:grid-cols-2"
            >

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Card Type
                </label>

                <select
                  value={cardType}
                  onChange={(event) =>
                    setCardType(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                >
                  <option value="credit">
                    Credit Card
                  </option>

                  <option value="debit">
                    Debit Card
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Card Number
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(event) =>
                    setCardNumber(
                      event.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="Enter card number"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Expiry Month
                </label>

                <select
                  value={expiryMonth}
                  onChange={(event) =>
                    setExpiryMonth(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                >
                  <option value="">
                    Select month
                  </option>

                  {Array.from(
                    { length: 12 },
                    (_, index) => index + 1
                  ).map((month) => (
                    <option
                      key={month}
                      value={month}
                    >
                      {String(month).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Expiry Year
                </label>

                <input
                  type="number"
                  min="2026"
                  max="2100"
                  value={expiryYear}
                  onChange={(event) =>
                    setExpiryYear(event.target.value)
                  }
                  placeholder="2030"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>

              <div className="md:col-span-2">

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Adding Card..."
                    : "Save Card"}
                </button>

              </div>

            </form>
          </section>
        )}

        {/* CARDS */}
        <section>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Saved Cards
            </h2>

            <span className="text-sm text-slate-500">
              {cards.length} card{cards.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-500">
              Loading cards...
            </div>
          ) : cards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-xl text-cyan-400">
                +
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No saved cards
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Add your first credit or debit card to get started.
              </p>

            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">

              {cards.map((card) => (
                <div
                  key={card.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                >

                  {/* CARD VISUAL */}
                  <div className="relative m-4 h-52 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 p-6">

                    <div className="absolute right-[-40px] top-[-40px] h-36 w-36 rounded-full bg-cyan-400/10 blur-2xl" />

                    <div className="relative flex h-full flex-col justify-between">

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold tracking-[0.15em] text-slate-300">
                          CARDPAY
                        </span>

                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs capitalize text-slate-300">
                          {card.card_type}
                        </span>
                      </div>

                      <div>

                        <p className="font-mono text-lg tracking-[0.18em] text-slate-200">
                          {card.masked_card_number}
                        </p>

                        <div className="mt-5 flex justify-between">

                          <div>
                            <p className="text-[9px] uppercase tracking-wider text-slate-500">
                              Card Holder
                            </p>

                            <p className="mt-1 text-xs font-medium text-slate-200">
                              CARDPAY USER
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] uppercase tracking-wider text-slate-500">
                              Valid Thru
                            </p>

                            <p className="mt-1 text-xs font-medium text-slate-200">
                              {String(card.expiry_month).padStart(2, "0")}/
                              {card.expiry_year}
                            </p>
                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* DETAILS */}
                  <div className="flex items-center justify-between border-t border-slate-800 px-5 py-4">

                    <div>
                      <p className="text-xs text-slate-500">
                        Last four digits
                      </p>

                      <p className="mt-1 font-mono text-sm text-slate-200">
                        {card.last_four_digits}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteCard(card.id)
                      }
                      className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                    >
                      Remove
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

      </main>
    </div>
  );
}

export default Cards;
