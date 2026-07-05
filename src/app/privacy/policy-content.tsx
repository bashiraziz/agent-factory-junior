const SECTIONS = [
  {
    title: "1. Who we are",
    body: 'Agent Factory Junior is an educational platform where children build AI Workers using visual blocks, supervised by a parent or teacher. We are not directed at children — sign-up is for adults only. Children access the platform through an account created and managed by their parent or teacher.',
  },
  {
    title: "2. How accounts are created",
    body: "Parents or teachers create and manage all accounts. Children never provide an email address or any personal information directly to us. A child's display name and username are chosen by the parent. Both should be nicknames — not the child's real name. The platform encourages anonymous, fun identifiers (e.g. RocketPanda, cool-coder-42) and rejects usernames that appear to contain a birth year.",
  },
  {
    title: "3. What we collect",
    body: "We collect: the parent or teacher's email address and hashed password; the child's username (chosen by the adult); the blocks and AI Worker configurations the child creates; run logs showing what the AI Worker produced. We do not collect the child's real name, date of birth, location, photos, or any other personal information.",
  },
  {
    title: "4. How we use it",
    body: "We use this information solely to operate the platform: to display a child's workers and run history, enforce daily run limits set by the adult, and allow parents and teachers to review activity. We do not use it for advertising, profiling, or any purpose beyond running the service.",
  },
  {
    title: "5. Parental & teacher rights",
    body: "Parents and teachers can view all of a child's activity, pause or reset daily run limits, change a child's PIN, and delete the child's account at any time from the dashboard. To request deletion of all account data — including the parent/teacher email — contact us at the address below and we will process it within 30 days.",
  },
  {
    title: "6. AI processing & safety",
    body: "When a child runs an AI Worker, the block configuration (goal, knowledge, rules, and steps) is sent to Google Gemini. The child's username and no other identifying information is included in the prompt. All AI responses are moderated before being shown to the child. We do not use children's interactions to train AI models.",
  },
  {
    title: "7. Data retention & security",
    body: "We retain account data for as long as the account is active. When an account is deleted, associated data is removed within 30 days. We use industry-standard encryption at rest and in transit, and access to production data is strictly limited.",
  },
  {
    title: "8. Contact & changes",
    body: 'To contact us, request data deletion, or ask questions about this policy: bashiraziz@yahoo.com. We will notify users of material changes by updating the "Last updated" date at the top of this page. Continued use after a change constitutes acceptance.',
  },
];

export function PolicySections() {
  return (
    <div
      className="rounded-2xl p-6 space-y-6"
      style={{ background: "#FFFFFF", border: "2px solid #F0E7D6" }}
    >
      <h2 className="font-display text-2xl font-semibold" style={{ color: "#2A2A3C" }}>
        Full Privacy Policy
      </h2>
      <p className="font-sans text-sm" style={{ color: "#8A8071" }}>
        Last updated: 3 July 2026
      </p>

      {SECTIONS.map((s) => (
        <div key={s.title} className="space-y-2">
          <h3 className="font-display text-lg font-semibold" style={{ color: "#2A2A3C" }}>
            {s.title}
          </h3>
          <p className="font-sans text-sm leading-relaxed" style={{ color: "#5C5747" }}>
            {s.body}
          </p>
        </div>
      ))}
    </div>
  );
}
