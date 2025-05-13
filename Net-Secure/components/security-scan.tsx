"use client"

import React, { useState } from "react";

const fakeResults = [
  { type: "Open Port", detail: "Port 21 (FTP) is open", severity: "Medium" },
  { type: "Malware Scan", detail: "No malware detected", severity: "Low" },
  { type: "Vulnerability", detail: "Outdated jQuery version found", severity: "High" },
  { type: "SSL Status", detail: "SSL certificate is valid", severity: "Good" },
  { type: "Firewall", detail: "Firewall is active", severity: "Good" },
];

const followUpQuestions = [
  "Would you like to apply a patch for the outdated library?",
  "Do you want to enable automatic security scans weekly?",
  "Should we block open port 21 for better security?",
];

function getSeverityColor(severity: string) {
  switch (severity) {
    case "High":
      return "text-red-600";
    case "Medium":
      return "text-yellow-600";
    case "Low":
      return "text-yellow-400";
    case "Good":
      return "text-green-600";
    default:
      return "text-neutral-600";
  }
}

const SecurityScan = () => {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<null | typeof fakeResults>(null);

  const handleScan = () => {
    setScanning(true);
    setResults(null);
    setTimeout(() => {
      setScanning(false);
      setResults(fakeResults);
    }, 1800);
  };

  return (
    <div className="font-sans max-w-md mx-auto p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 mt-10">
      <button
        onClick={handleScan}
        disabled={scanning}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white text-lg font-semibold py-3 rounded-lg transition hover:bg-primary/90 disabled:opacity-60 mb-6"
      >
        <span role="img" aria-label="shield">🛡️</span> {scanning ? "Scanning..." : "Run Security Scan"}
      </button>
      {scanning && (
        <div className="text-center text-primary font-medium py-4 animate-pulse">Scanning in progress...</div>
      )}
      {results && (
        <div>
          <h3 className="text-xl font-bold mb-3 text-neutral-900 dark:text-white">Scan Results</h3>
          <ul className="space-y-2 mb-6">
            {results.map((res, idx) => (
              <li key={idx} className="flex items-center gap-2 p-3 rounded-md bg-neutral-100 dark:bg-neutral-800">
                <span className={`font-semibold ${getSeverityColor(res.severity)}`}>{res.type}:</span>
                <span className="flex-1">{res.detail}</span>
                <span className={`text-xs font-bold ${getSeverityColor(res.severity)}`}>{res.severity}</span>
              </li>
            ))}
          </ul>
          <h4 className="text-lg font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Next Steps</h4>
          <ul className="list-disc pl-6 space-y-1 text-neutral-700 dark:text-neutral-300">
            {followUpQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SecurityScan;
