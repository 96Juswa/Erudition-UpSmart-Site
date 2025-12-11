"use client";

import { useState, useEffect } from "react";

export default function SendContractModal({ booking, currentUserId, onClose }) {
  const [contractText, setContractText] = useState("");
  const [loading, setLoading] = useState(false);

  // Generate contract content
  useEffect(() => {
    if (!booking) return;

    const client = booking.client;
    const proposal = booking.latestProposal ?? {};
    const price = proposal.price ?? booking.totalPrice ?? 0;
    const start = proposal.startDate ?? booking.startDate;
    const deadline = proposal.deadline ?? booking.deadline;

    // Get resolver/provider info - check multiple possible sources
    const resolver = booking.serviceListing?.resolver || proposal.sender;

    const formattedContract = `
SERVICE AGREEMENT

This Service Agreement ("Agreement") is made and entered into on ${new Date().toLocaleDateString()} by and between:

Client: ${client?.firstName} ${client?.lastName}
Email: ${client?.email}

and

Provider: ${resolver?.firstName} ${resolver?.lastName}
Email: ${resolver?.email}

Collectively referred to herein as the "Parties."

1. Scope of Work

The Provider agrees to perform the services described below for the Client:

- Service Title: ${booking.serviceListing?.title ?? booking.serviceRequest?.title ?? "Untitled Service"}

- Description: ${proposal.description || booking.serviceListing?.description || booking.serviceRequest?.description || "Service description not provided"}

All prior agreements, understandings, or arrangements made between the Parties via the UPSMART message thread prior to the execution of this Agreement are hereby incorporated into and form part of this Agreement.

The Provider shall perform the services with reasonable skill, care, and diligence.

2. Client Agreement Requirement

The Client must explicitly agree to this Agreement via the UPSMART platform before the Provider may commence any work.

Important: Any services performed or payments made outside of the UPSMART platform will not be covered by this Agreement or by the policies and guidelines of the Student Development Organization (SDO).

3. Project Schedule

Start Date: ${start ? new Date(start).toLocaleDateString() : "To Be Determined"}

Deadline: ${deadline ? new Date(deadline).toLocaleDateString() : "To Be Determined"}

Time is of the essence. The Parties may mutually agree in writing to adjust the schedule.

4. Compensation

The Client agrees to pay the Provider a total fee of ₱${price}, payable upon completion of the services, unless otherwise agreed in writing on the UPSMART platform. Any additional costs must be approved by the Client prior to expenditure.

5. Delivery of Work

The Provider shall deliver the completed work through the UPSMART platform. The Client may request reasonable revisions within a mutually agreed timeframe. Failure to request revisions within this period shall constitute acceptance of the work.

6. Confidentiality

Both Parties agree to maintain the confidentiality of any proprietary, sensitive, or confidential information disclosed during the term of this Agreement. This obligation shall survive the termination or completion of this Agreement.

7. Ownership of Work

Upon full payment, all rights, title, and interest in the deliverables shall transfer to the Client. The Provider may retain copies for portfolio or promotional purposes unless expressly prohibited by the Client.

8. Termination

This Agreement may be terminated by mutual written consent of both Parties. If either Party becomes unresponsive, the other Party may terminate the Agreement with reasonable notice. In the event of termination, the Provider shall deliver completed work to date, and the Client shall pay for the portion of services rendered.

Important: Any unresponsiveness or termination will be reported and may affect the trust rating of the responsible Party within the UPSMART platform.

9. Governing Body and Compliance

This Agreement shall be governed by the rules and guidelines of the Student Development Organization (SDO). Any disputes arising under this Agreement shall be subject to the SDO's policies and applicable sanctions.

IN WITNESS WHEREOF, the Parties have executed this Agreement through electronic acknowledgment on the UPSMART platform.

[ Client ]                        [ Provider ]

(Sign electronically via UPSMART) (Sign electronically via UPSMART)
`.trim();

    setContractText(formattedContract);
  }, [booking]);

  const handleSend = async () => {
    // More flexible validation - check for essential data
    if (!booking || !booking.client) {
      alert("Booking or client information is missing.");
      return;
    }

    // Get resolver/provider from multiple possible sources
    const resolver =
      booking.serviceListing?.resolver || booking.latestProposal?.sender;

    if (!resolver) {
      alert("Provider/resolver information is missing from booking.");
      return;
    }

    if (!booking.latestProposal?.id) {
      alert("No proposal found for this booking.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        bookingId: booking.id,
        proposalId: booking.latestProposal.id,
        receiverId: booking.client.userId,
        providerId: resolver.userId,
        text: contractText,
        fileUrl: "", // optional if you plan to add attachments
      };

      console.log("Sending contract payload:", payload);
      console.log("Booking data:", booking); // Debug log

      const res = await fetch("/api/contracts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Failed to send contract");

      alert("Contract sent successfully.");
      onClose();
    } catch (err) {
      console.error("Send contract error:", err);
      alert("Error sending contract: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
        <h2 className="text-lg font-semibold mb-4">Send Contract</h2>
        <textarea
          value={contractText}
          onChange={(e) => setContractText(e.target.value)}
          className="w-full h-80 border rounded p-3 text-sm font-mono"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className={`px-4 py-2 text-white rounded ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Sending..." : "Send Contract"}
          </button>
        </div>
      </div>
    </div>
  );
}
