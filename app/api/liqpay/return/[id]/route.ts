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

        let rawData = formData.get("data");
        let rawSignature = formData.get("signature");

        if (rawData && rawSignature) {
            // Розшифрування JSON payload з base64
            const jsonText = Buffer.from(rawData as string, 'base64').toString('utf-8');
            const dataObj = JSON.parse(jsonText);

            if (dataObj.status === "success" || dataObj.status === "sandbox") {
                url.searchParams.set("payment", "success");
            } else {
                url.searchParams.set("payment", "error");
            }

            // --- MANUALLY TRIGGER WEBHOOK FOR LOCALHOST ---
            // Because LiqPay can't reach localhost:3000 directly
            const body = {
                data: rawData,
                signature: rawSignature
            };

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            await fetch(`${apiUrl}/liqpay/webhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }).catch(e => console.error("Webhook forwarding failed:", e));
        } else {
            console.error("Missing expected liqpay payload items.");
            url.searchParams.set("payment", "error");
        }

    } catch (e) {
        console.error("Error reading LiqPay return data:", e);
        url.searchParams.set("payment", "error");
    }

    // 303 See Other - змушує браузер змінити POST запит на GET після перенаправлення
    return NextResponse.redirect(url, 303);
}
