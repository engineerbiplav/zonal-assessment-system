import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TRACKS = [
  { id: "club", label: "Club President", blurb: "Answering on behalf of your Lions club" },
  { id: "zone_chair", label: "Immediate Past Zone Chairperson", role: "ImmediatePastZoneChairperson", blurb: "Handover assessment from your term as zone chairperson" },
  { id: "dge", label: "1st Vice District Governor / District Governor Elect", role: "FirstViceDistrictGovernor", blurb: "Incoming district leadership questions" },
];

export default function AssessmentAccess() {
  const navigate = useNavigate();
  const { zoneSlug } = useParams();
  const [track, setTrack] = useState("");
  const [zoneInfo, setZoneInfo] = useState(null);
  const [zoneInfoLoading, setZoneInfoLoading] = useState(true);
  const [zoneInfoError, setZoneInfoError] = useState("");

  // --- Club president track state ---
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [club, setClub] = useState("");

  // --- Zone-level (zone chair / DGE) track state ---
  const [zoneOfficials, setZoneOfficials] = useState([]);
  const [zoneOfficialsLoading, setZoneOfficialsLoading] = useState(false);
  const [zoneOfficialId, setZoneOfficialId] = useState("");

  // --- Shared: resolved subject + DOB + submission ---
  const [subject, setSubject] = useState(null); // { id, name } — whoever we've identified
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const resetDownstream = () => {
    setSubject(null);
    setDobMonth("");
    setDobDay("");
    setLookupError("");
    setError("");
  };

  // Confirm the link's zone slug is valid before showing any form fields.
  useEffect(() => {
    setZoneInfoLoading(true);
    api
      .get(`/public/${zoneSlug}`)
      .then(({ data }) => setZoneInfo(data))
      .catch((err) => setZoneInfoError(err.response?.data?.message || "This assessment link is invalid."))
      .finally(() => setZoneInfoLoading(false));
  }, [zoneSlug]);

  useEffect(() => {
    if (!zoneInfo) return;
    resetDownstream();
    setClub("");
    setZoneOfficialId("");
    setClubs([]);
    setZoneOfficials([]);
    if (track === "club") {
      setClubsLoading(true);
      api
        .get(`/public/${zoneSlug}/clubs`)
        .then(({ data }) => setClubs(data.clubs || []))
        .catch(() => setError("Couldn't load the club list. Please refresh and try again."))
        .finally(() => setClubsLoading(false));
    } else if (track === "zone_chair" || track === "dge") {
      const role = TRACKS.find((t) => t.id === track).role;
      setZoneOfficialsLoading(true);
      api
        .get(`/public/${zoneSlug}/zone-lookup`, { params: { role } })
        .then(({ data }) => setZoneOfficials(data.officials || []))
        .catch(() => setError("Couldn't load that role's details. Please refresh and try again."))
        .finally(() => setZoneOfficialsLoading(false));
    }
  }, [track, zoneInfo, zoneSlug]);

  // Club track: once a club is picked, auto-fetch the president's name.
  useEffect(() => {
    if (track !== "club") return;
    resetDownstream();
    if (!club) return;
    setLookupLoading(true);
    api
      .get(`/public/${zoneSlug}/lookup`, { params: { club } })
      .then(({ data }) => setSubject({ id: data.id, name: data.name }))
      .catch((err) => setLookupError(err.response?.data?.message || "Couldn't find the club president."))
      .finally(() => setLookupLoading(false));
  }, [club, track, zoneSlug]);

  // Zone tracks: if there's exactly one match, auto-select it; otherwise
  // wait for the person to pick from the dropdown.
  useEffect(() => {
    if (track !== "zone_chair" && track !== "dge") return;
    if (zoneOfficials.length === 1 && !zoneOfficialId) {
      setZoneOfficialId(zoneOfficials[0].id);
    }
  }, [zoneOfficials, track]);

  useEffect(() => {
    if (track !== "zone_chair" && track !== "dge") return;
    resetDownstream();
    if (!zoneOfficialId) return;
    const match = zoneOfficials.find((o) => o.id === zoneOfficialId);
    if (match) setSubject({ id: match.id, name: match.name });
  }, [zoneOfficialId, track]);

  const daysInMonth = dobMonth ? new Date(2024, Number(dobMonth), 0).getDate() : 31;
  const isClubTrack = track === "club";
  const isZoneTrack = track === "zone_chair" || track === "dge";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setVerifying(true);
    try {
      const endpoint = isClubTrack ? `/public/${zoneSlug}/verify` : `/public/${zoneSlug}/zone-verify`;
      const payload = isClubTrack
        ? { contactId: subject.id, dobMonth, dobDay }
        : { officialId: subject.id, dobMonth, dobDay };
      const { data } = await api.post(endpoint, payload);
      navigate(`/respond/${data.token}`);
    } catch (err) {
      setError(err.response?.data?.message || "We couldn't verify your details. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const step = !track ? 1 : !subject ? 2 : 3;

  if (zoneInfoLoading) {
    return (
      <div className="public-wrap">
        <div className="container" style={{ maxWidth: 520, textAlign: "center" }}>
          <p className="muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (zoneInfoError) {
    return (
      <div className="public-wrap">
        <div className="container" style={{ maxWidth: 520, textAlign: "center" }}>
          <div className="alert error">{zoneInfoError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-wrap">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="public-header">
          <span className="eyebrow">{zoneInfo?.zoneName || "Zone Assessment"}</span>
          <h1>Guiding Question Response</h1>
          <p className="muted">Find your assessment by confirming a few quick details below.</p>
        </div>

        <div className="card gateway-card">
          <div className="gateway-icon-badge">
            <span style={{ color: "white", fontSize: 24, fontWeight: 700 }}>ID</span>
          </div>

          <div className="gateway-steps">
            <div className={`step-dot ${step > 1 ? "done" : step === 1 ? "active" : ""}`} />
            <div className={`step-dot ${step > 2 ? "done" : step === 2 ? "active" : ""}`} />
            <div className={`step-dot ${step === 3 ? "active" : ""}`} />
          </div>

          {error && <div className="alert error">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label>1. Who are you answering as?</label>
              <select className="gateway-select" value={track} onChange={(e) => setTrack(e.target.value)} required>
                <option value="">Select your role</option>
                {TRACKS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            {isClubTrack && (
              <div className="form-group">
                <label>2. Which club are you with?</label>
                <select
                  className="gateway-select"
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  disabled={clubsLoading}
                  required
                >
                  <option value="">{clubsLoading ? "Loading clubs..." : "Select your club"}</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {isZoneTrack && (
              <div className="form-group">
                <label>2. Confirm your name</label>
                {zoneOfficialsLoading ? (
                  <p className="muted" style={{ fontSize: "0.88rem" }}>Loading...</p>
                ) : zoneOfficials.length > 1 ? (
                  <select
                    className="gateway-select"
                    value={zoneOfficialId}
                    onChange={(e) => setZoneOfficialId(e.target.value)}
                    required
                  >
                    <option value="">Select your name</option>
                    {zoneOfficials.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}{o.zoneName ? ` — ${o.zoneName}` : ""}</option>
                    ))}
                  </select>
                ) : zoneOfficials.length === 1 ? (
                  <div className="respondent-chip" style={{ margin: 0 }}>
                    <span className="pos-dot" />
                    <strong>{zoneOfficials[0].name}</strong>
                  </div>
                ) : (
                  <p style={{ color: "var(--red)", fontSize: "0.85rem" }}>
                    No one has been set up for this role yet. Please check with your zone chairperson.
                  </p>
                )}
              </div>
            )}

            {isClubTrack && club && (
              <div className="form-group">
                {lookupLoading ? (
                  <p className="muted" style={{ fontSize: "0.88rem" }}>Looking up your name...</p>
                ) : subject ? (
                  <div className="respondent-chip" style={{ margin: 0 }}>
                    <span className="pos-dot" />
                    <strong>{subject.name}</strong>
                    <span className="muted">· Club President</span>
                  </div>
                ) : lookupError ? (
                  <p style={{ color: "var(--red)", fontSize: "0.85rem" }}>{lookupError}</p>
                ) : null}
              </div>
            )}

            <div className="form-group">
              <label>3. Confirm your date of birth</label>
              <div className="gateway-row">
                <select
                  className="gateway-select"
                  value={dobMonth}
                  onChange={(e) => { setDobMonth(e.target.value); setDobDay(""); }}
                  disabled={!subject}
                  required
                >
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  className="gateway-select"
                  value={dobDay}
                  onChange={(e) => setDobDay(e.target.value)}
                  disabled={!dobMonth}
                  required
                >
                  <option value="">Day</option>
                  {[...Array(daysInMonth)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="btn gold"
              style={{ width: "100%", padding: "14px", marginTop: 8 }}
              disabled={!subject || !dobMonth || !dobDay || verifying}
            >
              {verifying ? "Verifying..." : "Continue to My Questions"}
            </button>
          </form>
        </div>

        <p className="muted" style={{ textAlign: "center", marginTop: 18, fontSize: "0.82rem" }}>
          Your date of birth is used only to confirm your identity for this assessment.
        </p>
      </div>
    </div>
  );
}
