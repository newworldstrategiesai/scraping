"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContactData } from "@/lib/actions/contact";
import {
  formatPhone,
  normalizePhone,
} from "@/lib/utils/phone";
import {
  addContactNote,
  updateContactNote,
  deleteContactNote,
  updateOptOut,
  deleteOptOut,
  updateWarmLead,
  deleteWarmLead,
  updateFormSubmission,
  deleteFormSubmission,
  getContactByPhone,
} from "@/lib/actions/contact";
import { addOptOut } from "@/lib/actions/lists";
import { createJob } from "@/lib/actions/jobs";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

type TimelineItem =
  | { type: "opt_out"; id: string; date: string | null; summary: string; record: ContactData["optOuts"][0] }
  | { type: "warm_lead"; id: string; date: string | null; summary: string; record: ContactData["warmLeads"][0] }
  | { type: "form_submission"; id: string; date: string | null; summary: string; record: ContactData["formSubmissions"][0] }
  | { type: "note"; id: string; date: string | null; summary: string; record: ContactData["notes"][0] };

function buildTimeline(contact: ContactData): TimelineItem[] {
  const items: TimelineItem[] = [];
  contact.optOuts.forEach((r) =>
    items.push({ type: "opt_out", id: r.id, date: r.date, summary: `Opted out – ${r.source ?? "SMS reply"}`, record: r })
  );
  contact.warmLeads.forEach((r) =>
    items.push({
      type: "warm_lead",
      id: r.id,
      date: r.reply_time,
      summary: `Replied YES – ${r.source_campaign ?? "SMS"}` + (r.first_reply_text ? `: "${String(r.first_reply_text).slice(0, 40)}…"` : ""),
      record: r,
    })
  );
  contact.formSubmissions.forEach((r) =>
    items.push({
      type: "form_submission",
      id: r.id,
      date: r.created_at,
      summary: `Quote request – ${r.name ?? "Unknown"}`,
      record: r,
    })
  );
  contact.notes.forEach((r) =>
    items.push({ type: "note", id: r.id, date: r.created_at, summary: r.note.slice(0, 60) + (r.note.length > 60 ? "…" : ""), record: r })
  );
  items.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
  return items;
}

export function ContactView({ initialContact }: { initialContact: ContactData }) {
  const router = useRouter();
  const [contact, setContact] = useState(initialContact);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [addingOptOut, setAddingOptOut] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSendSmsForm, setShowSendSmsForm] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [sendingSms, setSendingSms] = useState(false);

  const phoneFormatted = formatPhone(contact.phone);
  const timeline = buildTimeline(contact);

  async function refreshContact() {
    const data = await getContactByPhone(contact.phone);
    if (data) setContact(data);
    router.refresh();
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    setAddingNote(true);
    setMessage(null);
    const result = await addContactNote(contact.phone, newNote);
    setAddingNote(false);
    if (result.ok) {
      setNewNote("");
      await refreshContact();
      setMessage({ type: "ok", text: "Note added." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed." });
    }
  }

  async function handleUpdateNote(id: string, note: string) {
    const result = await updateContactNote(id, note);
    if (result.ok) {
      setEditingId(null);
      await refreshContact();
    }
  }

  async function handleDeleteNote(id: string) {
    if (!confirm("Delete this note?")) return;
    const result = await deleteContactNote(id);
    if (result.ok) await refreshContact();
  }

  async function handleUpdateOptOut(id: string, data: { phone_number?: string; source?: string }) {
    const result = await updateOptOut(id, data);
    if (result.ok) {
      setEditingId(null);
      await refreshContact();
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed." });
    }
  }

  async function handleDeleteOptOut(id: string) {
    if (!confirm("Remove this opt-out record?")) return;
    const result = await deleteOptOut(id);
    if (result.ok) await refreshContact();
  }

  async function handleUpdateWarmLead(
    id: string,
    data: { full_name?: string | null; address?: string | null; first_reply_text?: string | null; source_campaign?: string | null }
  ) {
    const result = await updateWarmLead(id, data);
    if (result.ok) {
      setEditingId(null);
      await refreshContact();
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed." });
    }
  }

  async function handleDeleteWarmLead(id: string) {
    if (!confirm("Remove this warm lead record?")) return;
    const result = await deleteWarmLead(id);
    if (result.ok) await refreshContact();
  }

  async function handleUpdateFormSubmission(
    id: string,
    data: { name?: string | null; phone?: string | null; address?: string | null; email?: string | null; message?: string | null }
  ) {
    const result = await updateFormSubmission(id, data);
    if (result.ok) {
      setEditingId(null);
      await refreshContact();
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed." });
    }
  }

  async function handleDeleteFormSubmission(id: string) {
    if (!confirm("Delete this form submission?")) return;
    const result = await deleteFormSubmission(id);
    if (result.ok) await refreshContact();
  }

  function copyPhone() {
    navigator.clipboard.writeText(contact.phone);
    setMessage({ type: "ok", text: "Phone copied." });
  }
  function copyAddress() {
    const addr = contact.displayAddress ?? "";
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setMessage({ type: "ok", text: "Address copied." });
  }

  async function handleAddOptOut() {
    setAddingOptOut(true);
    setMessage(null);
    const result = await addOptOut(contact.phone, "Manual");
    setAddingOptOut(false);
    if (result.ok) {
      await refreshContact();
      setMessage({ type: "ok", text: "Opt-out added." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed." });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {contact.displayName ?? "Unknown"} – {phoneFormatted}
          </CardTitle>
          <CardDescription>
            {contact.displayAddress ?? "No address"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:+1${contact.phone}`}>Call</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`sms:+1${contact.phone}`}>SMS</a>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSendSmsForm((v) => !v)}>
            Send SMS (Twilio)
          </Button>
          <Button variant="outline" size="sm" onClick={copyPhone}>
            Copy phone
          </Button>
          {contact.displayAddress && (
            <Button variant="outline" size="sm" onClick={copyAddress}>
              Copy address
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleAddOptOut} disabled={addingOptOut}>
            {addingOptOut ? "Adding…" : "Add opt-out"}
          </Button>
        </CardContent>
      </Card>

      {showSendSmsForm && (
        <Card className="border-muted bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Send SMS via Twilio</CardTitle>
            <CardDescription>
              Queue one SMS to this number. Worker must be running to send.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_sms_message">Message</Label>
              <Input
                id="contact_sms_message"
                placeholder="e.g. We'll call you shortly."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                maxLength={160}
              />
              <p className="text-muted-foreground text-xs">{smsMessage.length}/160</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={sendingSms || !smsMessage.trim()}
                onClick={async () => {
                  setSendingSms(true);
                  setMessage(null);
                  const result = await createJob("send_single_sms", {
                    phone: contact.phone,
                    message: smsMessage.trim(),
                  });
                  setSendingSms(false);
                  if (result.ok) {
                    setMessage({ type: "ok", text: "SMS queued. Worker will send when running." });
                    setSmsMessage("");
                    setShowSendSmsForm(false);
                  } else {
                    setMessage({ type: "error", text: result.error ?? "Failed to queue." });
                  }
                }}
              >
                {sendingSms ? "Queuing…" : "Send SMS"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowSendSmsForm(false)} disabled={sendingSms}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {message && (
        <p
          className={
            message.type === "error" ? "text-destructive text-sm" : "text-muted-foreground text-sm"
          }
        >
          {message.text}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Timeline of opt-outs, warm leads, form submissions, and notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {timeline.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {timeline.map((item) => (
                <li
                  key={`${item.type}-${item.id}`}
                  className="rounded-md border bg-muted/30 px-3 py-2 dark:bg-muted/20"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-muted-foreground text-xs uppercase">{item.type.replace("_", " ")}</span>
                      <span className="ml-2 text-sm">{item.summary}</span>
                      <span className="ml-2 text-muted-foreground text-xs">{formatDate(item.date)}</span>
                    </div>
                    <div className="flex gap-1">
                      {item.type === "opt_out" && (
                        <>
                          {editingId === item.id ? (
                            <form
                              className="flex flex-wrap gap-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                handleUpdateOptOut(item.id, {
                                  phone_number: (form.querySelector('[name="phone_number"]') as HTMLInputElement)?.value,
                                  source: (form.querySelector('[name="source"]') as HTMLInputElement)?.value,
                                });
                              }}
                            >
                              <Input name="phone_number" defaultValue={item.record.phone_number} placeholder="Phone" className="w-32" />
                              <Input name="source" defaultValue={item.record.source ?? ""} placeholder="Source" className="w-24" />
                              <Button type="submit" size="sm">Save</Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                            </form>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(item.id)}>Edit</Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteOptOut(item.id)}>Delete</Button>
                            </>
                          )}
                        </>
                      )}
                      {item.type === "warm_lead" && (
                        <>
                          {editingId === item.id ? (
                            <form
                              className="flex flex-col gap-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                handleUpdateWarmLead(item.id, {
                                  full_name: (form.querySelector('[name="full_name"]') as HTMLInputElement)?.value || null,
                                  address: (form.querySelector('[name="address"]') as HTMLInputElement)?.value || null,
                                  first_reply_text: (form.querySelector('[name="first_reply_text"]') as HTMLInputElement)?.value || null,
                                  source_campaign: (form.querySelector('[name="source_campaign"]') as HTMLInputElement)?.value || null,
                                });
                              }}
                            >
                              <Input name="full_name" defaultValue={item.record.full_name ?? ""} placeholder="Name" />
                              <Input name="address" defaultValue={item.record.address ?? ""} placeholder="Address" />
                              <Input name="first_reply_text" defaultValue={item.record.first_reply_text ?? ""} placeholder="Reply" />
                              <Input name="source_campaign" defaultValue={item.record.source_campaign ?? ""} placeholder="Campaign" />
                              <div className="flex gap-1">
                                <Button type="submit" size="sm">Save</Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(item.id)}>Edit</Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteWarmLead(item.id)}>Delete</Button>
                            </>
                          )}
                        </>
                      )}
                      {item.type === "form_submission" && (
                        <>
                          {editingId === item.id ? (
                            <form
                              className="flex flex-col gap-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                handleUpdateFormSubmission(item.id, {
                                  name: (form.querySelector('[name="name"]') as HTMLInputElement)?.value || null,
                                  phone: (form.querySelector('[name="phone"]') as HTMLInputElement)?.value || null,
                                  address: (form.querySelector('[name="address"]') as HTMLInputElement)?.value || null,
                                  email: (form.querySelector('[name="email"]') as HTMLInputElement)?.value || null,
                                  message: (form.querySelector('[name="message"]') as HTMLInputElement)?.value || null,
                                });
                              }}
                            >
                              <Input name="name" defaultValue={item.record.name ?? ""} placeholder="Name" />
                              <Input name="phone" defaultValue={item.record.phone ?? ""} placeholder="Phone" />
                              <Input name="address" defaultValue={item.record.address ?? ""} placeholder="Address" />
                              <Input name="email" defaultValue={item.record.email ?? ""} placeholder="Email" />
                              <Input name="message" defaultValue={item.record.message ?? ""} placeholder="Message" />
                              <div className="flex gap-1">
                                <Button type="submit" size="sm">Save</Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(item.id)}>Edit</Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteFormSubmission(item.id)}>Delete</Button>
                            </>
                          )}
                        </>
                      )}
                      {item.type === "note" && (
                        <>
                          {editingId === item.id ? (
                            <form
                              className="flex gap-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                const note = (e.currentTarget.querySelector('[name="note"]') as HTMLInputElement)?.value ?? "";
                                handleUpdateNote(item.id, note);
                              }}
                            >
                              <Input name="note" defaultValue={item.record.note} className="min-w-[200px]" />
                              <Button type="submit" size="sm">Save</Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                            </form>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(item.id)}>Edit</Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteNote(item.id)}>Delete</Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {item.type === "note" && editingId !== item.id && (
                    <p className="mt-2 text-sm text-muted-foreground">{item.record.note}</p>
                  )}
                  {item.type === "form_submission" && editingId !== item.id && item.record.message && (
                    <p className="mt-2 text-sm text-muted-foreground">{item.record.message}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add note</CardTitle>
          <CardDescription>Add a note to this contact.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddNote} className="flex flex-col gap-2">
            <Label htmlFor="new-note">Note</Label>
            <Input
              id="new-note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g. Called back, left voicemail"
            />
            <Button type="submit" size="sm" disabled={addingNote}>
              {addingNote ? "Adding…" : "Add note"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
