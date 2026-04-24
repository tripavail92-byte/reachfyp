import Link from "next/link";
import { getConversationById, getInstantHireDetailById, listMessagesForConversation, markConversationMessagesRead } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { notFound, redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../../lib/auth/session";
import { MarketplaceTopNav } from "../../../marketplace-top-nav";

type ConversationPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

const messageStatusMessages: Record<string, string> = {
  sent: "Your message was added to the hire thread.",
};

const messageErrorMessages: Record<string, string> = {
  "missing-fields": "Enter a message before sending it.",
  "not-authorized": "Only conversation participants can post messages into this thread.",
};

export default async function ConversationPage({ params, searchParams }: ConversationPageProps) {
  const { conversationId } = await params;
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect(`/auth?mode=sign-in&redirectTo=${encodeURIComponent(`/dashboard/messages/${conversationId}`)}`);
  }

  const conversation = await getConversationById(conversationId);

  if (!conversation) {
    notFound();
  }

  const hireDetail = await getInstantHireDetailById(conversation.referenceId);

  if (!hireDetail) {
    notFound();
  }

  if (currentUser.role !== "admin" && !conversation.participantIds.includes(currentUser.id)) {
    redirect(`/dashboard/hires/${hireDetail.hire.id}`);
  }

  if (currentUser.role !== "admin") {
    await markConversationMessagesRead(conversation.id, currentUser.id);
  }

  const messages = await listMessagesForConversation(conversation.id);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const feedbackMessage =
    (resolvedSearchParams?.error ? messageErrorMessages[resolvedSearchParams.error] : undefined) ??
    (resolvedSearchParams?.status ? messageStatusMessages[resolvedSearchParams.status] : undefined);
  const backHref = currentUser.role === "creator" && currentUser.id === hireDetail.hire.creatorAuthUserId ? `/creator/hires/${hireDetail.hire.id}` : `/dashboard/hires/${hireDetail.hire.id}`;
  const canReply = currentUser.role !== "admin" && conversation.participantIds.includes(currentUser.id);

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref={currentUser.role === "creator" ? "/creator/hires" : currentUser.role === "admin" ? "/admin/hires" : "/dashboard/hires"} />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Hire conversation</p>
              <h1 className="hero-card__title">Messages for {hireDetail.hire.packageTitle}</h1>
            </div>
            <Link className="chip" href={backHref}>
              Back to hire detail
            </Link>
          </div>
          <p className="hero-card__copy">
            This hire-scoped thread now supports participant replies and read-state updates in addition to the original system kickoff and briefing message.
          </p>
          {feedbackMessage ? <span className="badge badge--accent">{feedbackMessage}</span> : null}
          <div className="auth-actions">
            <Link className="chip" href="/dashboard/notifications">
              Open notifications
            </Link>
            {currentUser.role === "brand" ? <Link className="chip" href="/dashboard/hires">Back to brand queue</Link> : null}
            {currentUser.role === "creator" ? <Link className="chip" href="/creator/hires">Back to creator queue</Link> : null}
          </div>
        </GlassPanel>

        <section className="profile-sections">
          {canReply ? (
            <GlassPanel className="profile-section-card">
              <div className="profile-section-card__header">
                <div>
                  <h2 className="results-toolbar__title">Reply</h2>
                  <p className="results-toolbar__subtitle">The primary action stays above the thread history so discussion does not get buried beneath older system messages.</p>
                </div>
              </div>
              <form action={`/dashboard/messages/${conversation.id}/reply`} className="auth-form" method="post">
                <label className="auth-field">
                  <span className="auth-field__label">Message</span>
                  <textarea className="auth-input auth-input--textarea" name="content" placeholder="Ask a question, confirm a revision, or give delivery context." required rows={4} />
                </label>
                <div className="auth-actions">
                  <button className="chip chip--solid" type="submit">
                    Send message
                  </button>
                </div>
              </form>
            </GlassPanel>
          ) : null}

          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Thread</h2>
                <p className="results-toolbar__subtitle">Participant-scoped read access backed by the server-owned conversation row, with the newest operational messages still preserved in order.</p>
              </div>
            </div>
            <div className="profile-list-grid">
              {messages.map((message) => (
                <div key={message.id} className="profile-list-card">
                  <h3 className="panel-card-title">{message.senderId === "system" ? "System" : message.senderId === hireDetail.hire.brandUserId ? "Brand" : "Creator"}</h3>
                  <p className="profile-list-card__copy">{message.content}</p>
                  <p className="profile-list-card__copy">{message.readAt ? "Read in thread" : "Unread"}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}