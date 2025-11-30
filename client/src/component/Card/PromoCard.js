import React, { useContext, useState } from "react";
import { getAuthHeaders } from "../AiForumPage/components/ForumUtils";
import { LoginContext } from "../ContextProvider/context";
const baseUrl = process.env.REACT_APP_BASE_URL;

const PromoCard = ({ userId: propUserId } = {}) => {
  const { loginData } = useContext(LoginContext);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState(null); // null | "applied" | "invalid"
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [appliedInfo, setAppliedInfo] = useState(null);

  const userId = loginData?.validuserone?._id;

  const apply = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const trimmed = code.trim();
    if (trimmed.length < 3) {
      setStatus("invalid");
      setErrorMsg("Code is too short");
      return;
    }

    if (!userId) {
      setStatus("invalid");
      setErrorMsg("User not logged in (userId missing)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/codeApply`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, promoCode: trimmed })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus("applied");
        setAppliedInfo(data.applied || null);
      } else {
        setStatus("invalid");
        // prefer server message, fallback to generic
        setErrorMsg(data.message || data.error || `Failed (${res.status})`);
      }
    } catch (err) {
      setStatus("invalid");
      setErrorMsg(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

//   const  createPromoCode= async()=> {
//   try {
//     const response = await fetch("http://localhost:8099/promocode", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         code: "PAYALSUPERSTAR800",
//         startDate: "2025-01-01",
//         endDate: "2026-01-31",
//         creditValue: 800,
//         priority: 3
//       })
//     });

//     const data = await response.json();
//     console.log("Promo Response:", data);

//   } catch (error) {
//     console.error("Error creating promo:", error);
//   }
// }


  const reset = () => {
    setCode("");
    setStatus(null);
    setErrorMsg("");
    setAppliedInfo(null);
  };

  return (
    <div className="flex items-center justify-center rounded-2xl bg-gradient-to-b from-black via-zinc-900 to-black">
      {/* <button onClick={createPromoCode} className="z-50 text-low_text">make</button> */}
      <form
        onSubmit={apply}
        className="w-full max-w-lg bg-white/3 dark:bg-white/5 border border-white/6 dark:border-white/10 rounded-2xl shadow-2xl p-6 md:p-4 text-white"
        aria-labelledby="promo-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="promo-title" className="text-md md:text-xl font-semibold">
              Enter Promo Code
            </h3>
            <p className="mt-1 text-xs text-white/70">
              Apply promo codes here. Enjoy extra credits with codes like{" "}
              <span className="font-medium">PIXX10</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-white/5 text-sm font-semibold ring-1 ring-theme_color2">
              {status === "applied" ? "Applied" : "Promo"}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <label htmlFor="promo" className="sr-only">
            Promo code
          </label>
          <div className="relative">
            <input
              id="promo"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setStatus(null);
                setErrorMsg("");
              }}
              placeholder="e.g. PIXX10 or PROMO25"
              className="w-full rounded-xl border border-nav_hover3 bg-transparent py-2 pl-4 pr-28 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/10"
              aria-invalid={status === "invalid"}
              aria-describedby={status === "invalid" ? "promo-error" : undefined}
            />

            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-4 py-2 bg-gradient-to-b from-white/6 to-white/4 text-sm font-semibold shadow-inner disabled:opacity-50"
              disabled={code.trim().length < 1 || loading}
            >
              {loading ? "Applying..." : "Apply"}
            </button>
          </div>

          <div className="flex items-center justify-end text-sm">
            {/* <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white/80"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path d="M2 11a1 1 0 011-1h3.17a2 2 0 001.414-.586l1.414-1.414A2 2 0 0110.83 7H16a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1v-1H3a1 1 0 01-1-1v-1z" />
              </svg>
              <span className="text-white/75">Secure • No spam</span>
            </div> */}

            <div className="flex items-center gap-2">
              {/* <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(code).catch(() => {});
                }}
                className="text-xs px-2 py-1 rounded-md ring-1 ring-white/6"
                aria-label="Copy promo code"
              >
                Copy
              </button> */}

              <button
                type="button"
                onClick={reset}
                className="text-xs px-2 py-1 text-low_text  rounded-md ring-1 ring-theme_color4"
              >
                Clear
              </button>
            </div>
          </div>

          {status === "applied" && (
            <div className="mt-2 rounded-lg bg-emerald-800/30 p-3 text-sm font-medium flex items-center justify-between">
              <div>
                ✅ Promo applied!
                {appliedInfo && (
                  <span className="ml-2 text-sm opacity-90">
                    (credits: {appliedInfo.creditValue ?? "—"}, priority:{" "}
                    {appliedInfo.priority ?? "—"})
                  </span>
                )}
              </div>
              <div className="text-xs opacity-80">Enjoy 🎉</div>
            </div>
          )}

          {status === "invalid" && (
            <div
              id="promo-error"
              className="mt-2 rounded-lg bg-rose-900/40 p-3 text-sm text-rose-200"
            >
              ❌ {errorMsg || "Invalid code. Try a valid promo code."}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default PromoCard;
