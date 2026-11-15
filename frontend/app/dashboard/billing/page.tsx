"use client";

import { useEffect, useState } from "react";
import { StripeService, SubscriptionDetails } from "@/services/stripe.service";

export default function BillingPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    StripeService.getSubscriptionStatus()
      .then(setSubscription)
      .catch((statusError: unknown) => {
        setError(
          statusError instanceof Error
            ? statusError.message
            : "Nije moguće proveriti status pretplate.",
        );
      });
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      window.location.href = await StripeService.createCheckoutSession();
    } catch (checkoutError: unknown) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Nije moguće pokrenuti Stripe naplatu.",
      );
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      window.location.href = await StripeService.createPortalSession();
    } catch (portalError: unknown) {
      setError(
        portalError instanceof Error
          ? portalError.message
          : "Nije moguće otvoriti upravljanje pretplatom.",
      );
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">NutriFlow Premium</h1>
          <p className="mt-2 text-slate-400">
            Sedam dana besplatnog pristupa, zatim nastavak korišćenja uz Premium.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-800 bg-red-950 p-4 text-red-200">
            {error}
          </p>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Status pretplate</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">
            {subscription ? subscription.plan : "Provera statusa..."}
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Premium uključuje personalizovane planove ishrane, čuvanje istorije
            planova i AI Coach.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">Premium pretplata</h2>
          <p className="mt-2 text-slate-300">
            Aktuelnu cenu i uslove naplate prikazaće Stripe pre nego što potvrdite
            kupovinu. Pretplatom upravljate i otkazujete je preko sigurnog Stripe
            portala.
          </p>
          {subscription?.active ? (
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={loading}
              className="mt-6 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 disabled:bg-slate-700"
            >
              {loading ? "Preusmeravanje..." : "Upravljaj pretplatom"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading || !subscription}
              className="mt-6 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 disabled:bg-slate-700"
            >
              {loading ? "Preusmeravanje..." : "Nastavi na sigurnu naplatu"}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
