import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function DigitalCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const reference = searchParams.get("reference");
    const [status, setStatus] = useState("verifying");

    useEffect(() => {
        if (!reference) {
            navigate("/");
            return;
        }

        async function verify() {
            try {
                const { data } = await API.get(`/digital-products/payments/verify/${reference}`);
                if (data.status === "paid") {
                    setStatus("success");
                    setTimeout(() => navigate("/my-digital-library"), 1500);
                } else {
                    setStatus("failed");
                }
            } catch {
                setStatus("error");
            }
        }
        verify();
    }, [reference, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm w-full">
                {status === "verifying" && (
                    <>
                        <div className="loader mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold">Verifying Payment...</h2>
                        <p className="text-gray-500 text-sm mt-2">Please wait while we confirm your purchase.</p>
                    </>
                )}
                {status === "success" && (
                    <>
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-xl font-semibold text-emerald-600">Payment Successful!</h2>
                        <p className="text-gray-500 text-sm mt-2">Redirecting to your library...</p>
                    </>
                )}
                {(status === "failed" || status === "error") && (
                    <>
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <h2 className="text-xl font-semibold text-rose-600">Payment Failed</h2>
                        <p className="text-gray-500 text-sm mt-2">Please try again or contact support.</p>
                        <button onClick={() => navigate("/digital-marketplace")} className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg">Go Back</button>
                    </>
                )}
            </div>
        </div>
    );
}
