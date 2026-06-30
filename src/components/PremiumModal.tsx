import { useState, FormEvent, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Crown, Check, CreditCard, ShieldCheck, RefreshCw, X, Sparkles } from "lucide-react";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  payuStatus?: { status: string, msg?: string } | null;
}

export default function PremiumModal({ isOpen, onClose, payuStatus }: PremiumModalProps) {
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem("swiply_premium") === "true" || localStorage.getItem("bharattalk_premium") === "true" || localStorage.getItem("monkey_premium") === "true";
  });
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);
  const [upgradePlan, setUpgradePlan] = useState<"monthly" | "yearly">("monthly");
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (payuStatus) {
      if (payuStatus.status === "success") {
        setCheckoutSuccess(true);
      } else {
        setPaymentError(payuStatus.msg || "Payment failed");
        setCheckoutSuccess(false);
      }
    }
  }, [payuStatus]);

  useEffect(() => {
    const checkPremium = () => {
      setIsPremium(localStorage.getItem("swiply_premium") === "true" || localStorage.getItem("bharattalk_premium") === "true" || localStorage.getItem("monkey_premium") === "true");
    };
    window.addEventListener("premium-updated", checkPremium);
    return () => window.removeEventListener("premium-updated", checkPremium);
  }, []);

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);
    setPaymentError(null);

    const price = upgradePlan === "monthly" ? "299" : "1999";

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiUrl}/api/payu/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: price,
          firstname: billingName || "SwiplyUser",
          email: billingEmail || "user@swiply.com",
          phone: billingPhone || "9999999999",
          udf1: "premium_modal",
          udf2: upgradePlan
        })
      });

      if (!response.ok) {
        throw new Error("Payment server offline or unreachable");
      }

      const data = await response.json();
      
      const form = document.createElement("form");
      form.setAttribute("action", "https://test.payu.in/_payment");
      form.setAttribute("method", "POST");
      form.setAttribute("target", "_self");

      Object.keys(data).forEach((key) => {
        const input = document.createElement("input");
        input.setAttribute("type", "hidden");
        input.setAttribute("name", key);
        input.setAttribute("value", data[key]);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

    } catch (err) {
      console.error("PayU initialization error:", err);
      setPaymentError("Could not connect to payment gateway. Please try again later.");
      setCheckoutLoading(false);
    }
  };

  const handleClosePremiumModal = () => {
    onClose();
    if (checkoutSuccess) {
      setCheckoutSuccess(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm overflow-y-auto py-10">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-2xl rounded-3xl bg-[#171717] border border-white/10 shadow-2xl relative overflow-hidden my-auto"
          >
            {/* Top Banner decoration */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
            
            {/* Close Button */}
            <button
              onClick={handleClosePremiumModal}
              className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all cursor-pointer z-10"
              id="btn-close-premium-modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12">
              {!isPremium && (
                /* Left panel: Features list */
                <div className="md:col-span-5 bg-[#0f0f0f] p-6 md:p-8 flex flex-col justify-between border-r border-white/5">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 shadow-md">
                        <Crown className="h-5 w-5 fill-amber-500/10" />
                      </div>
                      <span className="font-display font-black text-white text-base tracking-wide uppercase">
                        VIP Access
                      </span>
                    </div>

                    <div className="space-y-4 pt-2">
                      <h4 className="text-gray-300 text-xs font-bold uppercase tracking-wider">
                        Unlocked Perks:
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5">
                          <div className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                          <p className="text-gray-300 text-xs font-medium leading-relaxed">
                            <strong className="text-white">Gender Filter</strong>: Match 100% girls only or boys only
                          </p>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                          <p className="text-gray-300 text-xs font-medium leading-relaxed">
                            <strong className="text-white">Unlimited Gifts</strong>: Express appreciation continuously
                          </p>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                          <p className="text-gray-300 text-xs font-medium leading-relaxed">
                            <strong className="text-white">VIP Badge</strong>: Display a glowing gold crown in Live Chats
                          </p>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                          <p className="text-gray-300 text-xs font-medium leading-relaxed">
                            <strong className="text-white">HD Video Quality</strong>: Peerless, crystal-clear cam feeds
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/5">
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Swiply billing is secure. Cancel anytime from your account settings. Subscriptions renew automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* Right panel: Checkout / Payment */}
              <div className={`p-6 md:p-8 flex flex-col justify-between ${isPremium ? 'md:col-span-12' : 'md:col-span-7'}`}>
                {(!checkoutSuccess && !isPremium) ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white text-xl font-bold font-display tracking-tight">
                        Select Your VIP Plan
                      </h3>
                      <p className="text-gray-400 text-xs">
                        Unlock girls only or boys only talk instantly.
                      </p>
                    </div>

                    {/* Pricing Toggles */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUpgradePlan("monthly")}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                          upgradePlan === "monthly"
                            ? "bg-amber-500/10 border-amber-500/50 shadow-lg"
                            : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                        }`}
                      >
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Monthly
                        </span>
                        <span className="block text-white text-lg font-black mt-1">
                          ₹299<span className="text-xs font-normal text-gray-400">/mo</span>
                        </span>
                        <span className="block text-[9px] text-gray-500 mt-1">
                          Billed monthly
                        </span>
                        {upgradePlan === "monthly" && (
                          <span className="absolute top-3 right-3 h-4.5 w-4.5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setUpgradePlan("yearly")}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                          upgradePlan === "yearly"
                            ? "bg-amber-500/10 border-amber-500/50 shadow-lg"
                            : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                        }`}
                      >
                        <span className="absolute -top-2 right-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-md">
                          Save 45%
                        </span>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                          Yearly
                        </span>
                        <span className="block text-white text-lg font-black mt-1">
                          ₹1,999<span className="text-xs font-normal text-gray-400">/yr</span>
                        </span>
                        <span className="block text-[9px] text-emerald-400 font-semibold mt-1">
                          ₹166 / month equivalent
                        </span>
                        {upgradePlan === "yearly" && (
                          <span className="absolute top-3 right-3 h-4.5 w-4.5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Payment Form */}
                    <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-1">
                        <CreditCard className="h-4 w-4 text-amber-500" />
                        <span>Secure PayU India Gateway</span>
                      </div>

                      {paymentError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-medium">
                          ⚠️ {paymentError}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            First Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Billing First Name"
                            value={billingName}
                            onChange={(e) => setBillingName(e.target.value)}
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="billing@example.com"
                            value={billingEmail}
                            onChange={(e) => setBillingEmail(e.target.value)}
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Mobile Number (10 Digits)
                          </label>
                          <input
                            type="tel"
                            required
                            pattern="[0-9]{10}"
                            placeholder="e.g. 9876543210"
                            value={billingPhone}
                            onChange={(e) => setBillingPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={checkoutLoading}
                        className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold text-sm py-3.5 shadow-xl shadow-amber-500/10 hover:shadow-amber-500/25 transition-all hover:scale-101 cursor-pointer disabled:opacity-50"
                        id="btn-submit-premium-payment"
                      >
                        {checkoutLoading ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Redirecting to PayU...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4.5 w-4.5" />
                            <span>Proceed to PayU India Secure Pay</span>
                          </div>
                        )}
                      </button>

                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-white/5"></div>
                        <span className="flex-shrink mx-4 text-[9px] text-gray-500 font-bold uppercase tracking-wider">Demo Sandbox Option</span>
                        <div className="flex-grow border-t border-white/5"></div>
                      </div>

                      {/* Instant VIP Demo Simulation Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsPremium(true);
                          localStorage.setItem("swiply_premium", "true");
                          localStorage.setItem("bharattalk_premium", "true");
                          localStorage.setItem("monkey_premium", "true");
                          setCheckoutSuccess(true);
                          window.dispatchEvent(new CustomEvent("premium-updated"));
                          console.log("VIP Simulation activated: VIP features successfully unlocked!");
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-600/10 border border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/20 text-amber-400 font-bold text-xs py-3.5 shadow-md hover:shadow-lg transition-all hover:scale-101 cursor-pointer"
                        id="btn-simulate-vip-success"
                      >
                        <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                        <span>Simulate Instant VIP Pass Purchase (Free Test)</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Spectacular High-End VIP Celebration Popup / Overlay */
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-6 relative overflow-hidden bg-gradient-to-b from-[#1c1409]/30 via-[#171717] to-[#171717] rounded-2xl p-4 md:p-6 border border-amber-500/15">
                    
                    {/* Interactive Falling Golden Confetti Effect */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                      {Array.from({ length: 28 }).map((_, idx) => {
                        const delay = (idx * 0.15).toFixed(2);
                        const left = (idx * 3.5 + Math.random() * 5).toFixed(2);
                        const rotation = (idx * 15).toFixed(0);
                        const scale = (0.5 + Math.random() * 0.7).toFixed(2);
                        return (
                          <div
                            key={idx}
                            className="absolute top-[-20px] w-2 h-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xs opacity-80"
                            style={{
                              left: `${left}%`,
                              transform: `rotate(${rotation}deg) scale(${scale})`,
                              animation: `fall 3s linear infinite`,
                              animationDelay: `${delay}s`,
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Sparkles Backlight Flare */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl animate-pulse pointer-events-none" />

                    {/* Glowing VIP Crown Badge with Golden Ring Reflections */}
                    <div className="relative z-10 flex h-24 w-24 items-center justify-center">
                      {/* Golden Outer Ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40 animate-[spin_10s_linear_infinite]" />
                      {/* Golden Inner Solid Glow Ring */}
                      <div className="absolute inset-2 rounded-full border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-yellow-600/10 shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse" />
                      
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 text-black flex items-center justify-center shadow-2xl relative">
                        <Crown className="h-9 w-9 fill-amber-950/20 stroke-[2]" />
                        <span className="absolute -bottom-1 -right-1 bg-black text-amber-400 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-amber-500/40 shadow-md">
                          VIP
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 relative z-10">
                      <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-3xl font-black font-display tracking-tight uppercase drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]">
                        Congratulations VIP!
                      </h3>
                      <p className="text-gray-300 text-xs max-w-sm mx-auto leading-relaxed font-medium">
                        Your premium subscription is now active! You have unlocked high-impact privileges designed for the ultimate social experience.
                      </p>
                    </div>

                    {/* Displaying VIP Benefits Badge Grid */}
                    <div className="grid grid-cols-3 gap-2 w-full max-w-sm relative z-10 py-1">
                      <div className="bg-black/40 border border-amber-500/10 hover:border-amber-500/30 rounded-xl p-2.5 text-center transition-colors">
                        <span className="block text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Filter Mode</span>
                        <span className="block text-white text-[9px] font-medium leading-tight">Girls & Boys Only</span>
                      </div>
                      <div className="bg-black/40 border border-amber-500/10 hover:border-amber-500/30 rounded-xl p-2.5 text-center transition-colors">
                        <span className="block text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Golden Badge</span>
                        <span className="block text-white text-[9px] font-medium leading-tight">Crown in Chats</span>
                      </div>
                      <div className="bg-black/40 border border-amber-500/10 hover:border-amber-500/30 rounded-xl p-2.5 text-center transition-colors">
                        <span className="block text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Interaction</span>
                        <span className="block text-white text-[9px] font-medium leading-tight">Unlimited Gifts</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/15 to-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 w-full text-center relative z-10 shadow-lg">
                      <p className="text-emerald-400 text-xs font-bold tracking-wide flex items-center justify-center gap-1.5">
                        <Check className="h-4 w-4 bg-emerald-500 text-black rounded-full p-0.5" />
                        <span>VIP Pass Activated & Perks Enabled Successfully!</span>
                      </p>
                    </div>

                    <button
                      onClick={handleClosePremiumModal}
                      className="w-full max-w-xs rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-black text-sm px-8 py-3.5 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-xl shadow-amber-500/15 relative z-10"
                      id="btn-complete-premium-onboarding"
                    >
                      Start Talking VIP Style
                    </button>
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
