// lib/vapi.ts
// Wrapper around Vapi's REST API for placing outbound calls

const VAPI_BASE = "https://api.vapi.ai";

interface PlaceCallParams {
  phoneNumber: string;        // Lead's number, E.164 format e.g. +60123456789
  businessName: string;
  contactName: string;
  niche: string;              // Dental | Workshop | F&B
  gaps: string[];             // ["no-website", "weak-gmb"]
}

export async function placeOutboundCall(params: PlaceCallParams) {
  const apiKey = process.env.VAPI_API_KEY;
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

  if (!apiKey || !assistantId || !phoneNumberId) {
    throw new Error("Missing Vapi environment variables");
  }

  const response = await fetch(`${VAPI_BASE}/call/phone`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistantId,
      phoneNumberId,
      customer: {
        number: params.phoneNumber,
      },
      // Pass lead context so Aira can personalize the opening
      assistantOverrides: {
        variableValues: {
          contact_name: params.contactName,
          business_name: params.businessName,
          niche: params.niche,
          gaps: params.gaps.join(", "),
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vapi call failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}
