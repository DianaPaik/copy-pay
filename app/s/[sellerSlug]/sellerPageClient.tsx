"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getProductsBySeller, getSeller, Product, Seller } from "@/app/lib/dataClient";

function formatWon(n: number) {
    return n.toLocaleString("ko-KR") + "원";
}

export default function SellerPageClient() {
    const params = useParams<{ sellerSlug: string }>();
    const sellerSlug = params?.sellerSlug;

    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState<Seller | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [qty, setQty] = useState<Record<string, number>>({});
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);


    useEffect(() => {
        if (!sellerSlug) {
            setError("잘못된 URL입니다.");
            setLoading(false);
            return;
        }

        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);

            try {
                const s = await getSeller(sellerSlug);
                if (!s) {
                    setError("판매자를 찾을 수 없습니다.");
                    return;
                }
                if (!cancelled) setSeller(s);

                const ps = await getProductsBySeller(s.id);
                if (!cancelled) {
                    setProducts(ps);
                    setQty(Object.fromEntries(ps.map((p) => [p.id, 0])));
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "로드 실패");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [sellerSlug]);

    const total = useMemo(
        () => products.reduce((sum, p) => sum + p.price * (qty[p.id] ?? 0), 0),
        [products, qty]
    );


    const showToast = (msg: string) => {
        setToast(msg);
        window.setTimeout(() => setToast(null), 1400);
    };


    const inc = (p: Product) => {
        const current = qty[p.id] ?? 0;
        const stock = p.stock;

        // stock이 있으면 그 이상 못 올리게
        if (typeof stock === "number" && current >= stock) {
            showToast("재고가 부족합니다");
            return;
        }

        setQty((prev) => ({ ...prev, [p.id]: current + 1 }));
    };
    
    const dec = (p: Product) => {
        const current = qty[p.id] ?? 0;
        setQty((prev) => ({ ...prev, [p.id]: Math.max(0, current - 1) }));
    };

    const resetAll = () => {
        setQty(Object.fromEntries(products.map((p) => [p.id, 0])));
        showToast("수량을 초기화했어요");
    };

    async function copyTextSafe(text: string) {
        try {
            if (navigator.clipboard?.writeText && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch { }

        try {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.left = "-9999px";
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            ta.setSelectionRange(0, ta.value.length);

            const ok = document.execCommand("copy");
            document.body.removeChild(ta);
            return ok;
        } catch {
            return false;
        }
    }

    const copyAccountSimple = async () => {
        if (!seller) return;

        const ok = await copyTextSafe(seller.accountNo);
        if (!ok) {
            showToast("복사 실패(길게 눌러 복사)");
            return;
        }
        showToast("계좌가 복사되었습니다");
        if (total > 0) {
            setConfirmOpen(true);
        }
    };

    const copyAccountWithConfirm = async () => {
        if (!seller) return;

        const ok = await copyTextSafe(seller.accountNo);
        if (ok) {
            showToast("계좌가 복사되었습니다");
            setConfirmOpen(true);
        } else {
            showToast("복사 실패(길게 눌러 복사)");
        }
    };

    const copyAccount = async () => {
        if (!seller) return;
        const text = seller.accountNo;
        try {
            await navigator.clipboard.writeText(text);
            showToast("계좌가 복사되었습니다");
            setConfirmOpen(true); // 이미 열려있으면 그대로 유지됨
            return;
        } catch { }

        // iOS 폴백
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, ta.value.length); // iOS 대응
        try {
            const ok = document.execCommand("copy");
            if (ok) {
                showToast("계좌가 복사되었습니다");
                setConfirmOpen(true);
            } else {
                showToast("복사 실패(길게 눌러 복사)");
            }
        } catch {
            showToast("복사 실패(길게 눌러 복사)");
        } finally {
            document.body.removeChild(ta);
        }
    };

    const totalItems = useMemo(
        () => Object.values(qty).reduce((a, b) => a + (b ?? 0), 0),
        [qty]
    );

    if (loading) {
        return (
            <div className="min-h-dvh bg-zinc-50">
                <div className="mx-auto max-w-md px-4 py-6">
                    <div className="h-6 w-40 animate-pulse rounded bg-zinc-200" />
                    <div className="mt-6 space-y-3">
                        <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
                        <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
                        <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
                    </div>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="min-h-dvh bg-zinc-50">
                <div className="mx-auto max-w-md px-4 py-10">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="min-h-dvh bg-zinc-50">
                <div className="mx-auto max-w-md px-4 py-10">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-700">
                        판매자 정보가 없습니다.
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-dvh bg-zinc-50 pb-28">
            <div className="mx-auto max-w-md px-4 pt-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="mt-1 text-2xl font-extrabold text-zinc-900">{seller.name}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                            선택: <span className="font-semibold text-zinc-800">{totalItems}</span>개
                        </div>
                    </div>

                    <button
                        onClick={resetAll}
                        className="mt-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm active:scale-[0.99]"
                    >
                        초기화
                    </button>
                </div>

                {/* Account card */}
                <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-zinc-900">입금 계좌</div>

                    <div className="mt-2 flex items-start justify-between gap-3">
                        <div className="text-sm text-zinc-700">
                            <div className="font-medium">{seller.bankName}</div>
                            <div className="mt-0.5 font-mono text-base text-zinc-900">{seller.accountNo}</div>
                            <div className="mt-0.5 text-xs text-zinc-500">{seller.holder}</div>
                        </div>

                        <button
                            onClick={copyAccountSimple}
                            className={[
                                "shrink-0 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm active:scale-[0.99]",
                                "bg-zinc-900 text-white",
                            ].join(" ")}
                        >
                            복사
                        </button>
                    </div>

                    <div className="mt-3 text-xs text-zinc-500">
                        은행 앱에서 붙여넣기 후 <span className="font-semibold text-zinc-800">{formatWon(total)}</span>을 입금해주세요.
                    </div>
                </div>

                {/* Products */}
                <div className="mt-6 flex items-end justify-between">
                    <div className="text-sm font-semibold text-zinc-900">상품</div>
                    <div className="text-xs text-zinc-500">± 버튼으로 수량 조절</div>
                </div>

                <div className="mt-3 space-y-3">
                    {products.map((p) => {
                        const count = qty[p.id] ?? 0;
                        const subtotal = p.price * count;
                        const stock = p.stock;
                        const isSoldOut = typeof stock === "number" && stock <= 0;
                        const canInc = !isSoldOut && (typeof stock !== "number" || count < stock);

                        return (
                            <div
                                key={p.id}
                                className={[
                                    "overflow-hidden rounded-2xl border bg-white shadow-sm",
                                    isSoldOut ? "border-zinc-200 opacity-70" : "border-zinc-200",
                                ].join(" ")}
                            >
                                {/* 이미지 */}
                                <div className="relative aspect-[16/9] w-full bg-zinc-100">
                                    {p.imageUrl ? (
                                        // next/image 써도 되지만 export/gh-pages에서 최단은 img
                                        // (images.unoptimized 설정도 해둔 상태라 next/image도 가능)
                                        <img
                                            src={p.imageUrl}
                                            alt={p.name}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                                            No Image
                                        </div>
                                    )}

                                    {isSoldOut && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <div className="rounded-xl bg-black/60 px-3 py-2 text-sm font-semibold text-white">
                                                품절
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 본문 */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate text-base font-semibold text-zinc-900">{p.name}</div>

                                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                                                {p.category && <span className="rounded-full bg-zinc-100 px-2 py-0.5">{p.category}</span>}
                                                {p.genre && <span className="rounded-full bg-zinc-100 px-2 py-0.5">{p.genre}</span>}
                                                {p.couple && <span className="rounded-full bg-zinc-100 px-2 py-0.5">{p.couple}</span>}
                                                {typeof p.page === "number" && p.page > 0 && (
                                                    <span className="rounded-full bg-zinc-100 px-2 py-0.5">{p.page}p</span>
                                                )}
                                            </div>

                                            <div className="mt-2 text-sm font-semibold text-zinc-900">
                                                {formatWon(p.price)}
                                            </div>

                                            {p.description && (
                                                <div className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600">
                                                    {p.description}
                                                </div>
                                            )}

                                            {count > 0 && (
                                                <div className="mt-3 text-xs text-zinc-500">
                                                    소계:{" "}
                                                    <span className="font-semibold text-zinc-900">{formatWon(subtotal)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* 수량 컨트롤 */}
                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => dec(p)}
                                                    disabled={count === 0}
                                                    className={[
                                                        "h-10 w-10 rounded-xl border bg-white text-lg font-semibold shadow-sm transition active:scale-[0.98]",
                                                        count === 0
                                                            ? "cursor-not-allowed border-zinc-200 text-zinc-300"
                                                            : "border-zinc-200 text-zinc-800",
                                                    ].join(" ")}
                                                    aria-label="decrease"
                                                >
                                                    −
                                                </button>

                                                <div className="min-w-8 text-center text-base font-extrabold text-zinc-900">
                                                    {count}
                                                </div>

                                                <button
                                                    onClick={() => inc(p)}
                                                    disabled={!canInc}
                                                    className={[
                                                        "h-10 w-10 rounded-xl text-lg font-semibold shadow-sm transition active:scale-[0.98]",
                                                        canInc
                                                            ? "bg-zinc-900 text-white"
                                                            : "cursor-not-allowed bg-zinc-200 text-zinc-500",
                                                    ].join(" ")}
                                                    aria-label="increase"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {typeof stock === "number" && stock > 0 && (
                                                <div className="text-[11px] text-zinc-500">
                                                    {count}/{stock}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 하단 고정바가 가리는 것 방지용 여백 */}
                <div className="h-6" />
            </div>

            {/* Bottom fixed bar */}
            <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
                    <div>
                        <div className="text-xs font-semibold text-zinc-500">총 금액</div>
                        <div className="text-xl font-extrabold text-zinc-900">{formatWon(total)}</div>
                    </div>

                    <button
                        onClick={copyAccountWithConfirm}
                        disabled={total === 0}
                        className={[
                            "h-11 rounded-xl px-4 text-sm font-semibold shadow-sm transition",
                            total === 0
                                ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
                                : "bg-zinc-900 text-white active:scale-[0.99]",
                        ].join(" ")}
                    >
                        계좌 복사
                    </button>
                </div>
            </div>

            {/* Toast (always top-most) */}
            {toast && (
                <div className="fixed inset-x-0 top-3 z-[60] mx-auto max-w-md px-4">
                    <div className="rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
                        {toast}
                    </div>
                </div>
            )}
            {/* Confirm Modal */}
            {confirmOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setConfirmOpen(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-lg font-extrabold text-zinc-900">계좌 복사 완료</div>
                        <div className="mt-1 text-sm text-zinc-500">
                            아래 정보로 입금해주세요.
                        </div>

                        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                            <div className="text-sm font-semibold text-zinc-900">
                                {seller.bankName} · {seller.holder}
                            </div>
                            <div className="mt-1 font-mono text-xl font-extrabold text-zinc-900">
                                {seller.accountNo}
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                <div className="rounded-xl bg-white p-3">
                                    <div className="text-xs font-semibold text-zinc-500">입금 금액</div>
                                    <div className="mt-1 text-base font-extrabold text-zinc-900">
                                        {formatWon(total)}
                                    </div>
                                </div>
                                <div className="rounded-xl bg-white p-3">
                                    <div className="text-xs font-semibold text-zinc-500">선택 수량</div>
                                    <div className="mt-1 text-base font-extrabold text-zinc-900">
                                        {totalItems}개
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 text-xs text-zinc-500">
                                은행 앱에서 계좌 붙여넣기 후 금액을 확인해 주세요.
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => setConfirmOpen(false)}
                                className="h-11 flex-1 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 shadow-sm active:scale-[0.99]"
                            >
                                확인
                            </button>

                            <button
                                onClick={copyAccountWithConfirm}
                                className="h-11 flex-1 rounded-xl bg-zinc-900 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
                            >
                                다시 복사
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    
    );
}
