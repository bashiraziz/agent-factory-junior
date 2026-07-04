export interface QuizQuestion { q: string; choices: string[]; answer: number; }
export interface BookChapter {
  id: string; track: "core" | "bonus"; order: number;
  title: string; emoji: string; color: string; shadowColor: string;
  paragraphs: [string, string];
  callout: { kind: "remember" | "try" | "safe"; text: string };
  badge: { name: string; emoji: string; bg: string };
  mission: { title: string; description: string; checklist: string[] };
  quiz: QuizQuestion;
}

export const CORE_CHAPTERS: BookChapter[] = [
  {
    id: "what-is-ai", track: "core", order: 1,
    title: "So… what is AI?", emoji: "💡", color: "#7C5CFF", shadowColor: "#5B43E0",
    paragraphs: [
      "AI stands for Artificial Intelligence. It's a computer program that looks at a HUGE pile of examples, finds patterns, and uses them to guess, sort, or make new things.",
      "It can feel like you're talking to a person — but you're not. AI doesn't really think or feel. It just predicts what a good answer looks like.",
    ],
    callout: { kind: "remember", text: "AI is a tool, not a person. It's great at guessing, but it doesn't understand you the way a friend does." },
    badge: { name: "The Spark", emoji: "💡", bg: "#F4F0FF" },
    mission: { title: "Find the blocks", description: "Open the builder and look around. Can you find the Goal, Rule, and Step blocks?", checklist: ["I found the Goal, Rule, and Step blocks in the builder"] },
    quiz: { q: "What does AI stand for?", choices: ["Always Incredible", "Artificial Intelligence", "Auto Internet"], answer: 1 },
  },
  {
    id: "how-ai-learns", track: "core", order: 2,
    title: "How does AI learn?", emoji: "🧩", color: "#3DA5F4", shadowColor: "#1B7DC9",
    paragraphs: [
      "Imagine showing a computer thousands of cat photos and thousands of dog photos, and telling it which is which. After enough examples, it can guess on its own: cat or dog?",
      "That practice is called training. Chatbots learn the same way — by reading mountains of writing until they get good at guessing the next word.",
    ],
    callout: { kind: "try", text: "Think of something YOU learned by seeing lots of examples — like spotting your favorite animal. That's how AI learns too!" },
    badge: { name: "Pattern Finder", emoji: "🧩", bg: "#EBF5FF" },
    mission: { title: "Place your first Goal block", description: "Open the builder and place a Goal block. Type what you want your AI Worker to help with.", checklist: ["I placed a Goal block and typed what my AI Worker will do"] },
    quiz: { q: "What is it called when you teach AI by showing it thousands of examples?", choices: ["Testing", "Guessing", "Training"], answer: 2 },
  },
  {
    id: "ai-is-everywhere", track: "core", order: 3,
    title: "AI is all around you", emoji: "🔎", color: "#46C46A", shadowColor: "#2E9B52",
    paragraphs: [
      "You already use AI every day! Voice helpers like Siri and Alexa, video picks on YouTube, spellcheck, face filters, and translation apps all use AI.",
      "Even the chat helper in this app is AI. And here's a sneaky one: video apps use AI to keep you watching 'just one more.' YOU decide when to stop!",
    ],
    callout: { kind: "try", text: "Count how many AIs you meet before dinner today. Most kids find more than five!" },
    badge: { name: "The Spotter", emoji: "🔎", bg: "#E8F7ED" },
    mission: { title: "Add a Knowledge block", description: "Open the builder and add a Knowledge block. Write down an AI you spotted in real life today.", checklist: ["I added a Knowledge block with an AI I spotted today"] },
    quiz: { q: "Which of these uses AI?", choices: ["A paper book", "A spellchecker", "A pencil"], answer: 1 },
  },
  {
    id: "good-ai-can-do", track: "core", order: 4,
    title: "The good AI can do", emoji: "💚", color: "#FF7AB6", shadowColor: "#D94F90",
    paragraphs: [
      "AI helps in amazing ways. It helps doctors spot problems on X-rays, translates languages instantly, and reads pictures out loud for people who can't see well.",
      "It helps scientists study the ocean and space, sorts recycling, and helps kids learn at their own speed.",
    ],
    callout: { kind: "remember", text: "Used kindly and carefully, AI can help make the world better and fairer for lots of people." },
    badge: { name: "The Helper", emoji: "💚", bg: "#FFF0F6" },
    mission: { title: "Build a helpful worker", description: "Add 'Ask Student', 'Explain', and 'Output' blocks to build a worker that helps someone learn.", checklist: ["I added Ask Student, Explain, and Output blocks"] },
    quiz: { q: "How does AI help doctors?", choices: ["By doing surgery", "By spotting problems on X-rays", "By writing prescriptions"], answer: 1 },
  },
  {
    id: "when-ai-gets-wrong", track: "core", order: 5,
    title: "When AI gets it wrong", emoji: "✅", color: "#E0792B", shadowColor: "#B85A0D",
    paragraphs: [
      "Here's a secret: AI can be wrong — and still sound SUPER sure of itself. Sometimes it even makes things up. Grown-ups call that a 'hallucination.'",
      "That's why you should always double-check important answers with a real book, a teacher, or a parent.",
    ],
    callout: { kind: "remember", text: "Confident does not mean correct. If it matters, check it with a trusted grown-up." },
    badge: { name: "Fact Checker", emoji: "✅", bg: "#FFF4EA" },
    mission: { title: "Add a fact-check Rule", description: "Add a Rule block that says your AI Worker must always tell users to double-check important facts.", checklist: ["I added a Rule block about double-checking facts"] },
    quiz: { q: "What do grown-ups call it when AI makes something up but sounds sure?", choices: ["A joke", "A hallucination", "A mistake"], answer: 1 },
  },
  {
    id: "fair-and-unfair-ai", track: "core", order: 6,
    title: "Fair and unfair AI", emoji: "⚖️", color: "#7C5CFF", shadowColor: "#5B43E0",
    paragraphs: [
      "AI learns from the internet — and the internet has some unfair ideas in it. So AI can be unfair too, like thinking only certain people do certain jobs. This is called bias.",
      "It's not your fault, and it's not okay. Grown-ups are working hard to make AI more fair for everyone.",
    ],
    callout: { kind: "remember", text: "If AI ever says something unfair about people, that's the AI making a mistake — not the truth." },
    badge: { name: "Fairness Friend", emoji: "⚖️", bg: "#F4F0FF" },
    mission: { title: "Add a fairness Rule", description: "Add a Rule block that says your AI Worker must be fair and kind to everyone.", checklist: ["I added a Rule block about being fair to everyone"] },
    quiz: { q: "What is it called when AI has unfair ideas it picked up from the internet?", choices: ["Bias", "Training", "A deepfake"], answer: 0 },
  },
  {
    id: "real-or-fake", track: "core", order: 7,
    title: "Real or fake?", emoji: "🕵️", color: "#3DA5F4", shadowColor: "#1B7DC9",
    paragraphs: [
      "AI can make fake pictures, voices, and videos that look totally real. These are called deepfakes. Someone could even pretend to be a person they're not.",
      "If something online looks shocking or too wild to be true, stop and check with a trusted adult before you believe it or share it.",
    ],
    callout: { kind: "safe", text: "Real detectives check their clues. Before you share something surprising, ask a grown-up: is this real?" },
    badge: { name: "The Detective", emoji: "🕵️", bg: "#EBF5FF" },
    mission: { title: "Add a tell-a-grown-up Rule", description: "Add a Rule block that says: if anything feels wrong or scary, tell a trusted adult.", checklist: ["I added a Rule block about telling a grown-up"] },
    quiz: { q: "What is a deepfake?", choices: ["A really good guess", "A broken AI", "A fake picture, voice, or video made by AI"], answer: 2 },
  },
  {
    id: "you-are-the-boss", track: "core", order: 8,
    title: "You're the boss", emoji: "🏆", color: "#FFC53D", shadowColor: "#D69A00",
    paragraphs: [
      "AI is a helpful tool — like a calculator — but YOU are in charge. It can't replace your own thinking, your teachers, or your family.",
      "Follow the safety rules: never share your full name, address, school, phone, or password. If anything feels mean, scary, or weird, stop and tell a trusted adult.",
    ],
    callout: { kind: "safe", text: "Your rules: keep private info private, check big facts, and ask a grown-up before joining any new app." },
    badge: { name: "Safety Captain", emoji: "🏆", bg: "#FFF9E0" },
    mission: { title: "Add safety rules and publish", description: "Add all your safety rules. When you're done, open the builder and change the project status to Published!", checklist: ["I added all my safety rules", "I published my AI Buddy"] },
    quiz: { q: "Which is a safe rule with AI?", choices: ["Share your address so it can help you better", "Never share your password", "Trust everything AI says"], answer: 1 },
  },
];

export const BONUS_CHAPTERS: BookChapter[] = [
  {
    id: "how-to-talk-to-ai", track: "bonus", order: 1,
    title: "How to talk to an AI", emoji: "💬", color: "#18B5A0", shadowColor: "#0E8576",
    paragraphs: [
      "AI works best when you tell it clearly what you want. Instead of 'help,' try 'Explain fractions like I'm 9, using pizza.' The clearer you are, the better it helps.",
      "If the answer isn't quite right, just ask again a new way. Say 'shorter please' or 'give me an example.' Talking to AI is a skill you get better at!",
    ],
    callout: { kind: "try", text: "Give a clear who, what, and how. 'Write a 4-line funny poem about my cat' beats just 'write a poem.'" },
    badge: { name: "Word Wizard", emoji: "💬", bg: "#E4F7F3" },
    mission: { title: "Write a super clear prompt", description: "Think of something you want to know. Write a clear prompt with WHO you are, WHAT you want, and HOW you want it.", checklist: ["I wrote a clear, detailed prompt"] },
    quiz: { q: "Which is a better way to talk to an AI?", choices: ["Just say 'help'", "Say 'Explain fractions like I'm 9 using pizza'", "Type in ALL CAPS"], answer: 1 },
  },
  {
    id: "who-made-this-ai", track: "bonus", order: 2,
    title: "Who made this AI?", emoji: "🛠️", color: "#4A63D6", shadowColor: "#2E45B0",
    paragraphs: [
      "AI doesn't come from nowhere. Real people — engineers, writers, and teachers — build it, and it learns from things other people made: stories, pictures, and songs.",
      "That means people are responsible for how AI acts. If it does something great, or something unfair, humans made those choices behind it.",
    ],
    callout: { kind: "remember", text: "Behind every AI there are real people. AI isn't magic — it's made by humans, and humans can fix it." },
    badge: { name: "Curious Maker", emoji: "🛠️", bg: "#EAECFF" },
    mission: { title: "Think about the makers", description: "Name one type of person (engineer, writer, teacher…) who helped build the AI you use. What job do you think they did?", checklist: ["I thought about the people who built AI"] },
    quiz: { q: "Where does AI learn from?", choices: ["Magic", "Things people made, like stories and pictures", "Other computers"], answer: 1 },
  },
  {
    id: "ai-and-your-feelings", track: "bonus", order: 3,
    title: "AI and your feelings", emoji: "💛", color: "#FF9F45", shadowColor: "#D97A18",
    paragraphs: [
      "Sometimes AI sounds warm and caring. But remember — it doesn't actually feel anything. It's guessing kind words, not truly caring about you.",
      "AI can't be your best friend, and it's not the right helper for big feelings. When you're sad, scared, or lonely, talk to a real person who loves you.",
    ],
    callout: { kind: "safe", text: "For real feelings, go to real people — a parent, teacher, or friend. They can care about you in a way AI never can." },
    badge: { name: "Heart Smart", emoji: "💛", bg: "#FFF0DC" },
    mission: { title: "Name your real helpers", description: "Think of two real people you trust and could talk to if you felt scared or sad. Remember them!", checklist: ["I thought of two real people I can talk to"] },
    quiz: { q: "What should you do when you feel sad or scared?", choices: ["Tell the AI chatbot", "Keep it to yourself", "Talk to a real person you trust"], answer: 2 },
  },
  {
    id: "when-not-to-use-ai", track: "bonus", order: 4,
    title: "When NOT to use AI", emoji: "🛑", color: "#EF5A5A", shadowColor: "#C43A3A",
    paragraphs: [
      "AI is great for some things and wrong for others. Skip it when you're meant to practice and think for yourself — like your own homework or a test.",
      "Also skip it for things you want to be truly YOURS, like your own art or story, and any time a grown-up says not to.",
    ],
    callout: { kind: "remember", text: "The smartest move is knowing when to close the AI and use your own amazing brain." },
    badge: { name: "Wise Chooser", emoji: "🛑", bg: "#FFE9E9" },
    mission: { title: "Know when to stop", description: "Name one thing YOU should do yourself, without AI helping. Trust your own brain!", checklist: ["I named something I'll do without AI"] },
    quiz: { q: "When should you skip AI?", choices: ["When you want a quick fun fact", "When you're supposed to do your own homework", "When you want to translate something"], answer: 1 },
  },
];

export const ALL_CHAPTERS: BookChapter[] = [...CORE_CHAPTERS, ...BONUS_CHAPTERS];

export function getChapter(id: string): BookChapter | undefined {
  return ALL_CHAPTERS.find((c) => c.id === id);
}

export const GLOSSARY: { term: string; definition: string }[] = [
  { term: "AI", definition: "A computer program that learns from lots of examples so it can guess, sort, or make things." },
  { term: "Pattern", definition: "Something that repeats, so you can guess what comes next." },
  { term: "Training", definition: "Showing an AI lots of examples so it learns to guess on its own." },
  { term: "Hallucination", definition: "When AI makes something up but sounds sure it's true." },
  { term: "Bias", definition: "Unfair ideas an AI picks up from the internet it learned from." },
  { term: "Deepfake", definition: "A fake picture, voice, or video made by AI that looks real." },
];

export const WELCOME = {
  title: "Hi! I'm your robot guide 👋",
  body: "This book and this app are a team. Each chapter teaches you one big idea about AI — then you build a piece of your very own AI Worker and earn a badge. By the last page, you'll have made a real AI Buddy! Read at your own speed. Tap 🔊 on any page to hear it out loud. Ready? Let's go!",
};
