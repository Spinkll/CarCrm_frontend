import { NextRequest, NextResponse } from "next/server"

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const url = request.nextUrl.clone();
    url.pathname = `/orders-detail/${params.id}`;

    try {
        const formData = await request.formData();
        const transactionStatus = formData.get("transactionStatus");

        if (transactionStatus === "Approved") {
            url.searchParams.set("payment", "success");
        } else {
            url.searchParams.set("payment", "error");
        }

        // --- MANUALLY TRIGGER WEBHOOK FOR LOCALHOST ---
        // Because WayForPay can't reach localhost:3000 directly
        const body: Record<string, any> = {};
        formData.forEach((value, key) => {
            body[key] = value;
        });

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        await fetch(`${apiUrl}/wayforpay/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }).catch(e => console.error("Webhook forwarding failed:", e));

    } catch (e) {
        console.error("Error reading WayForPay return data:", e);
        url.searchParams.set("payment", "error");
    }

    // 303 See Other - змушує браузер змінити POST запит на GET після перенаправлення
    return NextResponse.redirect(url, 303);
}
