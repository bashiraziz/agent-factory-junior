import Link from "next/link";

interface Section {
  id: string;
  title: string;
  audience: "student" | "teacher" | "parent" | "everyone";
  items: { q: string; a: string }[];
}

const SECTIONS: Section[] = [
  {
    id: "getting-started",
    title: "Getting started",
    audience: "everyone",
    items: [
      { q: "What is Agent Factory Foundations?", a: "A platform for students to build small AI Workers using visual blocks — no coding. Every worker follows safety rules, and every run is watched by a teacher or parent." },
      { q: "How do I sign in?", a: "Students join with a classroom code from a teacher, or a link code from a parent. Teachers and parents create an account with email at /sign-up." },
    ],
  },
  {
    id: "student-learn",
    title: "For students — guided lessons",
    audience: "student",
    items: [
      { q: "What is the Learn tab?", a: "Tap 📖 Learn in the bottom bar. You'll find 'Meet the AI' — a book with 8 core chapters that teach you about AI, plus 4 Explorer chapters you can read any time." },
      { q: "How do I earn a badge?", a: "Read the chapter, tick 'I read this chapter', complete the mission in the builder, then answer the quiz. When all three are done the Earn badge button lights up — tap it to claim your badge!" },
      { q: "Why is the next chapter locked?", a: "Core chapters unlock one at a time. Finish the current chapter (read + mission + quiz) and the next one opens automatically. Explorer chapters are always open." },
      { q: "What is the mission?", a: "Each chapter has a small mission — usually adding a block to your AI Buddy in the builder. Tap 'Open the builder →' to jump straight there, then come back to tick the box." },
      { q: "Can I re-read a chapter I already finished?", a: "Yes, tap it on the learning path and it opens normally. Your badge is kept — you just won't see the earn button again." },
      { q: "What is the Explorer Track?", a: "Four bonus chapters you can read in any order, any time: How to talk to AI, Who made this AI, AI and your feelings, and When NOT to use AI. Each earns its own badge." },
    ],
  },
  {
    id: "student-editor",
    title: "For students — the block editor",
    audience: "student",
    items: [
      { q: "How do I add a block?", a: "Click any block in the left palette. It appears on the canvas. You can drag blocks to connect them into a stack." },
      { q: "What do the different blocks do?", a: "Goal = what your worker helps with. Knowledge = facts it should know. Safety Rule = things it must never do. Ask Student, Explain, Quiz, Output = steps it will follow, in order." },
      { q: "Can I start from a template?", a: "Yes! When you make a new AI Worker you can pick a starter: Homework Helper, Story Buddy, Science Explainer, Word Coach, or AI Buddy (learn about AI). You can change any block after." },
      { q: "How do I delete a block?", a: "Right-click the block on the canvas. Or use Clear canvas at the bottom of the palette to remove all blocks at once." },
      { q: "Why do I need a Safety Rule?", a: "Every AI Worker needs at least one Safety Rule before it can run — this keeps things safe for you and other students." },
      { q: "Does it save automatically?", a: "Yes. Look at the top-left — it says SAVED, SAVING…, or UNSAVED. You never need to press save." },
    ],
  },
  {
    id: "student-runs",
    title: "For students — running your AI Worker",
    audience: "student",
    items: [
      { q: "How do I run my worker?", a: "Click the green Run button on the editor or dashboard. Your worker follows the steps you built, one by one." },
      { q: "How many runs do I get?", a: "5 runs per day by default. Your parent can raise or lower this. The counter is at the top-right of your dashboard." },
      { q: "Can I chat with my worker?", a: "Yes! After it explains something, type your reply in the box at the bottom and press Send. Your worker will answer back — you can go back and forth as many times as you want." },
      { q: "How do I get to the quiz?", a: "After you've chatted at least once, a big button appears — 'Ready for the quiz? 🎯' (or 'Wrap it up! 🎁' if your worker has no quiz). Tap it when you're ready to finish." },
      { q: "What if I get a quiz answer wrong?", a: "That's okay! After you press Check answers, each wrong question shows a friendly 'Why:' explaining the right answer so you learn from it." },
      { q: "What happens if I get all the quiz right?", a: "You get a celebration — a bouncing trophy 🏆 and confetti! Try to score 100% every time." },
      { q: "What is a replay?", a: "After each run, you can open the replay to see exactly what your worker did, what knowledge it used, and what rules it followed." },
      { q: "Why can't I run right now?", a: "A few reasons: (1) you used all today's runs, (2) your parent paused runs, or (3) your worker is waiting for a parent to approve it. The message on screen will say which one — ask your parent to help." },
    ],
  },
  {
    id: "teacher",
    title: "For teachers",
    audience: "teacher",
    items: [
      { q: "How do students join my classroom?", a: "Create a classroom, share the join code with students, and they enter it at /join." },
      { q: "What are seat codes?", a: "Pre-generated codes on the classroom page. Great for students without email — one code per seat, expires when the student joins." },
      { q: "What is a safety flag?", a: "When a run trips a safety rule (unsafe content, off-topic, etc.), it's marked flagged. Review flagged runs from your dashboard or classroom detail." },
      { q: "Can I see what a student's worker did?", a: "Yes — every run has a replay showing the goal, knowledge, rules, steps followed, and output." },
    ],
  },
  {
    id: "parent",
    title: "For parents",
    audience: "parent",
    items: [
      { q: "How do I link to my student?", a: "Ask your student for their link code (from their profile). Enter it on your parent dashboard to link accounts." },
      { q: "What can I see?", a: "Your student's AI Workers, every recent run, safety flags, a weekly activity chart, and daily usage." },
      { q: "How do I change the daily run limit?", a: "On your student's page, use the − / + stepper next to 'Daily run limit'. Any number between 1 and 50. Saves automatically." },
      { q: "How do I pause runs completely?", a: "Flip the 'Runs enabled' switch to 🔴 Paused. Your student sees a friendly message asking you to unpause. Great for homework time or family dinner." },
      { q: "What does 'Reset today's counter' do?", a: "Gives your student a fresh set of runs for the rest of today, without changing the daily limit. Use it if they hit the limit on a project you want them to keep working on." },
      { q: "How do I approve a worker before it runs?", a: "Turn on 'Approve each new worker first' in Preferences. After that, every new AI Worker your student builds shows up as ⏳ Awaiting approval — tap Approve to let it run." },
      { q: "Can I delete a worker my student made?", a: "Yes — each worker in the list has a Delete button. It's permanent, so you'll be asked to confirm." },
      { q: "What is a replay?", a: "A full step-by-step record of what an AI Worker did — the goal, knowledge, rules applied, and every answer. Nothing is hidden from you. Click Replay on any run." },
    ],
  },
  {
    id: "safety",
    title: "Safety & privacy",
    audience: "everyone",
    items: [
      { q: "Is this safe for students under 13?", a: "Yes. Students don't need email — they use codes. We don't collect personal data through the AI Worker, and every worker has enforced safety rules." },
      { q: "What if something goes wrong?", a: "The safety flag system catches problems. Teachers and parents can review any run and delete a worker at any time." },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      <header
        className="h-16 flex items-center justify-between px-6"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-block flex items-center justify-center"
            style={{ background: "#7C5CFF" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="white" opacity="0.9" />
              <rect x="13" y="3" width="8" height="8" rx="2" fill="white" opacity="0.6" />
              <rect x="3" y="13" width="8" height="8" rx="2" fill="white" opacity="0.6" />
              <rect x="13" y="13" width="8" height="8" rx="2" fill="white" opacity="0.9" />
            </svg>
          </div>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>
            Agent Factory <span style={{ color: "#7C5CFF" }}>Foundations</span>
          </span>
        </Link>
        <Link
          href="/"
          className="font-sans font-extrabold text-sm"
          style={{ color: "#7C5CFF" }}
        >
          ← Back
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "#8A8071" }}>
            HELP CENTER
          </div>
          <h1 className="font-display text-4xl font-semibold" style={{ color: "#2A2A3C" }}>
            How to use Agent Factory Foundations
          </h1>
          <p className="font-sans text-lg mt-2" style={{ color: "#5C5747" }}>
            Quick answers for students, teachers, and parents.
          </p>
        </div>

        {/* Table of contents */}
        <nav
          className="rounded-card p-5"
          style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
        >
          <div className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: "#8A8071" }}>
            ON THIS PAGE
          </div>
          <ul className="space-y-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="font-sans font-extrabold text-sm"
                  style={{ color: "#7C5CFF" }}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-20">
            <h2 className="font-display text-2xl font-semibold mb-4" style={{ color: "#2A2A3C" }}>
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <div
                  key={i}
                  className="rounded-card p-5"
                  style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
                >
                  <div className="font-sans font-extrabold text-sm mb-2" style={{ color: "#2A2A3C" }}>
                    {item.q}
                  </div>
                  <div className="font-sans text-sm leading-relaxed" style={{ color: "#5C5747" }}>
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div
          className="rounded-card p-6 text-center"
          style={{ background: "#F4F0FF", border: "2px solid #7C5CFF22" }}
        >
          <div className="font-display text-lg font-semibold mb-2" style={{ color: "#2A2A3C" }}>
            Still stuck?
          </div>
          <p className="font-sans text-sm" style={{ color: "#5C5747" }}>
            Ask your teacher or parent — they can see what your AI Worker did and help you fix it.
          </p>
        </div>
      </main>
    </div>
  );
}
