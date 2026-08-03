import * as React from "react"
import { useState, useCallback } from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * MootCourtPrepAssistant.tsx
 * ------------------------------------------------------------------
 * A structured moot court / ADR prep worksheet — NOT an AI tool.
 * There is no language model behind this: it takes the shape of the
 * case brief you enter (facts, legal issue, your position, the
 * authorities you're relying on) and hands back a fixed, always-run
 * checklist to work through yourself:
 *
 *   - Per authority: is it distinguishable on its facts? Is there a
 *     more recent or higher-authority case that narrows it?
 *   - Three judge-question types, every time: weakest link in your
 *     reasoning, policy implications, and how your argument holds up
 *     against a hypothetical variant of the facts.
 *
 * The actual legal thinking is entirely yours — this only guarantees
 * you never skip a category of scrutiny you'd otherwise forget under
 * time pressure. You can star items as priority picks and export the
 * whole filled-in sheet as plain text to save outside the tool, since
 * this component has no backend and won't remember your work between
 * visits on its own.
 *
 * Self-contained: no external assets, no external libraries, no
 * network calls.
 * ------------------------------------------------------------------
 */

interface MootCourtPrepAssistantProps {
    title?: string
    accentColor?: string
}

interface Authority {
    id: string
    name: string
}

interface AuthorityNote {
    distinguishable: string
    strongerPrecedent: string
    starred: boolean
}

type JudgeKey = "weakest" | "policy" | "hypothetical"

interface JudgeNote {
    response: string
    starred: boolean
}

const JUDGE_QUESTIONS: { key: JudgeKey; label: string; build: (issue: string, position: string) => string }[] = [
    {
        key: "weakest",
        label: "Weakest Link",
        build: (issue) =>
            `What's the weakest link in your reasoning${issue ? ` on "${issue}"` : ""}? Where would a sharp judge press first?`,
    },
    {
        key: "policy",
        label: "Policy Implications",
        build: (_issue, position) =>
            `If a judge accepts your position${position ? ` — "${position}"` : ""} — what are the broader policy implications? Who wins and loses if this becomes the rule?`,
    },
    {
        key: "hypothetical",
        label: "Hypothetical Variant",
        build: () =>
            "Sketch one fact in your case that, if changed, would most threaten your argument. How does your position hold up against that variant?",
    },
]

function makeId() {
    return Math.random().toString(36).slice(2, 10)
}

export default function MootCourtPrepAssistant(props: MootCourtPrepAssistantProps) {
    const { title = "Moot Court Prep Assistant", accentColor = "#4f8cff" } = props

    const [mode, setMode] = useState<"input" | "prep">("input")
    const [facts, setFacts] = useState("")
    const [legalIssue, setLegalIssue] = useState("")
    const [position, setPosition] = useState("")
    const [authorityDraft, setAuthorityDraft] = useState("")
    const [authorities, setAuthorities] = useState<Authority[]>([])
    const [authorityNotes, setAuthorityNotes] = useState<Record<string, AuthorityNote>>({})
    const [judgeNotes, setJudgeNotes] = useState<Record<JudgeKey, JudgeNote>>({
        weakest: { response: "", starred: false },
        policy: { response: "", starred: false },
        hypothetical: { response: "", starred: false },
    })
    const [copied, setCopied] = useState(false)

    const ink = "#e7e9ee"
    const inkMuted = "#9aa1b1"
    const surface = "#141824"
    const surfaceRaised = "#1a1f2e"
    const border = "#252b3b"

    const addAuthority = useCallback(() => {
        const name = authorityDraft.trim()
        if (!name) return
        const id = makeId()
        setAuthorities((prev) => [...prev, { id, name }])
        setAuthorityNotes((prev) => ({ ...prev, [id]: { distinguishable: "", strongerPrecedent: "", starred: false } }))
        setAuthorityDraft("")
    }, [authorityDraft])

    const removeAuthority = useCallback((id: string) => {
        setAuthorities((prev) => prev.filter((a) => a.id !== id))
        setAuthorityNotes((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
        })
    }, [])

    const updateAuthorityNote = useCallback((id: string, field: keyof AuthorityNote, value: string | boolean) => {
        setAuthorityNotes((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
    }, [])

    const updateJudgeNote = useCallback((key: JudgeKey, field: keyof JudgeNote, value: string | boolean) => {
        setJudgeNotes((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
    }, [])

    const generatePrep = useCallback(() => {
        setMode("prep")
    }, [])

    const priorityCount =
        authorities.filter((a) => authorityNotes[a.id]?.starred).length +
        (Object.values(judgeNotes) as JudgeNote[]).filter((j) => j.starred).length

    const buildExportText = useCallback(() => {
        const lines: string[] = []
        lines.push("MOOT COURT PREP SHEET")
        lines.push("======================")
        lines.push("")
        lines.push("FACTS")
        lines.push(facts || "(not filled in)")
        lines.push("")
        lines.push("LEGAL ISSUE")
        lines.push(legalIssue || "(not filled in)")
        lines.push("")
        lines.push("YOUR POSITION")
        lines.push(position || "(not filled in)")
        lines.push("")
        lines.push("AUTHORITY STRESS-TEST")
        lines.push("---------------------")
        if (authorities.length === 0) lines.push("(no authorities listed)")
        authorities.forEach((a) => {
            const note = authorityNotes[a.id]
            lines.push(`${note?.starred ? "\u2605 " : ""}${a.name}`)
            lines.push(`  Distinguishable on facts? ${note?.distinguishable || "(not answered)"}`)
            lines.push(`  Narrower/more recent authority? ${note?.strongerPrecedent || "(not answered)"}`)
            lines.push("")
        })
        lines.push("JUDGE QUESTION DRILL")
        lines.push("--------------------")
        JUDGE_QUESTIONS.forEach((q) => {
            const note = judgeNotes[q.key]
            lines.push(`${note.starred ? "\u2605 " : ""}${q.label}: ${q.build(legalIssue, position)}`)
            lines.push(`  How I'd respond: ${note.response || "(not answered)"}`)
            lines.push("")
        })
        return lines.join("\n")
    }, [facts, legalIssue, position, authorities, authorityNotes, judgeNotes])

    const handleExport = useCallback(async () => {
        const text = buildExportText()
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
        } catch {
            // Clipboard API unavailable in this context — fail quietly,
            // the sheet is still visible on screen to copy manually.
        }
    }, [buildExportText])

    const inputStyle: React.CSSProperties = {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 12px",
        borderRadius: 8,
        border: `1px solid ${border}`,
        background: "#0c0f17",
        color: ink,
        fontSize: 13,
        fontFamily: "inherit",
        resize: "vertical",
    }

    const labelStyle: React.CSSProperties = {
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: inkMuted,
        textTransform: "uppercase",
        marginBottom: 6,
        display: "block",
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minHeight: 240,
                overflow: "auto",
                background: "#0c0f17",
                color: ink,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif",
                padding: "32px 28px",
                boxSizing: "border-box",
            }}
        >
            {/* Header */}
            <div style={{ marginBottom: 22 }}>
                <h1 style={{ margin: 0, fontSize: "clamp(20px, 2.6vw, 28px)", fontWeight: 600, color: ink }}>{title}</h1>
                <div style={{ fontSize: 12.5, color: inkMuted, marginTop: 8, maxWidth: 620, lineHeight: 1.5 }}>
                    This tool doesn't read or understand your brief — it organizes a fixed checklist around
                    it. The thinking is still yours; the tool just makes sure you never skip a category under
                    time pressure.
                </div>
            </div>

            {mode === "input" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
                    <div>
                        <label style={labelStyle}>Facts</label>
                        <textarea
                            value={facts}
                            onChange={(e) => setFacts(e.target.value)}
                            rows={4}
                            placeholder="What actually happened, in your own words..."
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Legal Issue(s)</label>
                        <textarea
                            value={legalIssue}
                            onChange={(e) => setLegalIssue(e.target.value)}
                            rows={2}
                            placeholder="The specific question(s) of law in dispute..."
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Your Position</label>
                        <textarea
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            rows={3}
                            placeholder="What you're arguing, and the core basis for it..."
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Authorities Relied On</label>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                            <input
                                value={authorityDraft}
                                onChange={(e) => setAuthorityDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        addAuthority()
                                    }
                                }}
                                placeholder="e.g. Hyde v Wrench (1840) 3 Beav 334"
                                style={{ ...inputStyle, flex: 1 }}
                            />
                            <button
                                onClick={addAuthority}
                                style={{
                                    padding: "0 16px",
                                    borderRadius: 8,
                                    border: `1px solid ${accentColor}55`,
                                    background: `${accentColor}22`,
                                    color: ink,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                Add
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {authorities.map((a) => (
                                <div
                                    key={a.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "8px 12px",
                                        background: surface,
                                        border: `1px solid ${border}`,
                                        borderRadius: 8,
                                        fontSize: 12.5,
                                    }}
                                >
                                    <span>{a.name}</span>
                                    <button
                                        onClick={() => removeAuthority(a.id)}
                                        aria-label={`Remove ${a.name}`}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: inkMuted,
                                            cursor: "pointer",
                                            fontSize: 13,
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {authorities.length === 0 && (
                                <div style={{ fontSize: 12, color: inkMuted, fontStyle: "italic" }}>
                                    No authorities added yet.
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={generatePrep}
                        style={{
                            alignSelf: "flex-start",
                            marginTop: 6,
                            padding: "12px 22px",
                            borderRadius: 10,
                            border: "none",
                            background: accentColor,
                            color: "#0c0f17",
                            fontSize: 13.5,
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Build Prep Checklist →
                    </button>
                </div>
            )}

            {mode === "prep" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 780 }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 10,
                        }}
                    >
                        <div style={{ fontSize: 12.5, color: inkMuted }}>
                            {priorityCount > 0
                                ? `${priorityCount} priority pick${priorityCount === 1 ? "" : "s"} starred`
                                : "Star your strongest 2\u20133 items as you work through the checklist"}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={() => setMode("input")}
                                style={{
                                    padding: "8px 14px",
                                    borderRadius: 8,
                                    border: `1px solid ${border}`,
                                    background: surface,
                                    color: inkMuted,
                                    fontSize: 12.5,
                                    cursor: "pointer",
                                }}
                            >
                                ← Edit Brief
                            </button>
                            <button
                                onClick={handleExport}
                                style={{
                                    padding: "8px 14px",
                                    borderRadius: 8,
                                    border: `1px solid ${accentColor}55`,
                                    background: `${accentColor}22`,
                                    color: ink,
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                {copied ? "Copied ✓" : "Copy Prep Sheet"}
                            </button>
                        </div>
                    </div>

                    {/* Authority stress-test */}
                    <div>
                        <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px", color: ink }}>
                            Authority Stress-Test
                        </h2>
                        {authorities.length === 0 && (
                            <div style={{ fontSize: 12.5, color: inkMuted, fontStyle: "italic" }}>
                                No authorities were listed — go back and add the cases/statutes you're relying
                                on.
                            </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {authorities.map((a) => {
                                const note = authorityNotes[a.id]
                                return (
                                    <div
                                        key={a.id}
                                        style={{
                                            background: surfaceRaised,
                                            border: `1px solid ${note?.starred ? accentColor + "88" : border}`,
                                            borderRadius: 12,
                                            padding: "14px 16px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: 10,
                                            }}
                                        >
                                            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{a.name}</div>
                                            <button
                                                onClick={() => updateAuthorityNote(a.id, "starred", !note?.starred)}
                                                aria-label="Toggle priority"
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    fontSize: 16,
                                                    color: note?.starred ? accentColor : inkMuted,
                                                }}
                                            >
                                                {note?.starred ? "★" : "☆"}
                                            </button>
                                        </div>
                                        <label style={labelStyle}>Is this distinguishable on its facts?</label>
                                        <textarea
                                            value={note?.distinguishable || ""}
                                            onChange={(e) => updateAuthorityNote(a.id, "distinguishable", e.target.value)}
                                            rows={2}
                                            style={{ ...inputStyle, marginBottom: 10 }}
                                        />
                                        <label style={labelStyle}>
                                            Is there a more recent or higher-authority case that narrows it?
                                        </label>
                                        <textarea
                                            value={note?.strongerPrecedent || ""}
                                            onChange={(e) => updateAuthorityNote(a.id, "strongerPrecedent", e.target.value)}
                                            rows={2}
                                            style={inputStyle}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Judge question drill */}
                    <div>
                        <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px", color: ink }}>
                            Judge Question Drill
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {JUDGE_QUESTIONS.map((q) => {
                                const note = judgeNotes[q.key]
                                return (
                                    <div
                                        key={q.key}
                                        style={{
                                            background: surfaceRaised,
                                            border: `1px solid ${note.starred ? accentColor + "88" : border}`,
                                            borderRadius: 12,
                                            padding: "14px 16px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                marginBottom: 8,
                                                gap: 10,
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        letterSpacing: "0.05em",
                                                        textTransform: "uppercase",
                                                        color: accentColor,
                                                        marginBottom: 4,
                                                    }}
                                                >
                                                    {q.label}
                                                </div>
                                                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                                                    {q.build(legalIssue, position)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => updateJudgeNote(q.key, "starred", !note.starred)}
                                                aria-label="Toggle priority"
                                                style={{
                                                    flexShrink: 0,
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    fontSize: 16,
                                                    color: note.starred ? accentColor : inkMuted,
                                                }}
                                            >
                                                {note.starred ? "★" : "☆"}
                                            </button>
                                        </div>
                                        <label style={labelStyle}>How you might respond (one line — practice the rest out loud)</label>
                                        <input
                                            value={note.response}
                                            onChange={(e) => updateJudgeNote(q.key, "response", e.target.value)}
                                            style={inputStyle}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(MootCourtPrepAssistant, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Moot Court Prep Assistant",
        placeholder: "Moot Court Prep Assistant",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#4f8cff",
    },
})
