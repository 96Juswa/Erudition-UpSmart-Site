"use client";

import { useState } from "react";
import Modal from "./Modal";
import InputBox from "./InputBox";
import Textarea from "./Textarea";
import Button from "./Button";

export default function ReportModal({
  isOpen,
  onClose,
  reporterId,
  reportedUserId,
}) {
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reportTitle) return alert("Title is required.");

    setSubmitting(true);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterId,
          reportedUserId,
          reportTitle,
          reportDescription,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit report");
      alert(
        "Your report has been submitted and is now pending review. Further actions will be handled by the SDO directly."
      );
      onClose(); // close modal
    } catch (err) {
      alert("Something went wrong.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report User">
      <div className="flex flex-col gap-4">
        <InputBox
          label="Report Title"
          value={reportTitle}
          onChange={(e) => setReportTitle(e.target.value)}
          placeholder="e.g., Offensive behavior, Scam attempt, etc."
        />
        <Textarea
          label="Description (optional)"
          value={reportDescription}
          onChange={(e) => setReportDescription(e.target.value)}
          placeholder="Explain what happened..."
        />
        <Button onClick={handleSubmit} disabled={submitting} color="danger">
          {submitting ? "Submitting..." : "Submit Report"}
        </Button>
      </div>
    </Modal>
  );
}
