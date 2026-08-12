import type Database from "better-sqlite3";
import type { AttemptAnswer } from "./types";

function id(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 20);
}

type SeedQuestion = {
  text: string;
  explanation: string;
  options: string[]; // first entry is the correct answer; shuffled on insert
};

type SeedQuiz = {
  slug: string;
  creator: number; // persona index
  title: string;
  description: string;
  industry: string;
  questions: SeedQuestion[];
};

export const PERSONAS = [
  { name: "Priya Sharma", email: "priya@example.com", avatarUrl: "grad:3", headline: "Supply Chain Director @ Meridian Foods", industry: "Supply Chain & Logistics" },
  { name: "Marcus Webb", email: "marcus@example.com", avatarUrl: "grad:1", headline: "Growth Marketing Lead @ Brightline", industry: "Marketing" },
  { name: "Elena Volkov", email: "elena@example.com", avatarUrl: "grad:4", headline: "Staff Software Engineer @ Cascade Systems", industry: "Technology" },
  { name: "David Okafor", email: "david@example.com", avatarUrl: "grad:6", headline: "Talent Acquisition Manager @ Northgate", industry: "HR & Recruiting" },
  { name: "Sofia Reyes", email: "sofia@example.com", avatarUrl: "grad:8", headline: "Senior Financial Analyst @ Harborview Capital", industry: "Finance" },
];

const QUIZZES: SeedQuiz[] = [
  {
    slug: "supply-chain-iq-x7k2",
    creator: 0,
    title: "Supply Chain IQ: Only Real Operators Pass",
    description: "Ten questions pulled straight from the warehouse floor, the freight desk, and the S&OP meeting. If you've never expedited a container, good luck.",
    industry: "Supply Chain & Logistics",
    questions: [
      {
        text: "Your ocean freight quote says 40' HC. What are you actually booking?",
        explanation: "HC = high cube: a standard 40-foot container with an extra foot of height (9'6\" instead of 8'6\"). More cube, same footprint.",
        options: [
          "A 40-foot high-cube container",
          "40 hundredweight of chargeable cargo",
          "A 40-slot half-container share",
          "40 hours of guaranteed cargo hold",
        ],
      },
      {
        text: "What does a freight forwarder actually own?",
        explanation: "Forwarders are orchestrators. They book space on carriers' ships, planes, and trucks — asset-light by design.",
        options: [
          "Almost nothing — they arrange transport on other companies' assets",
          "The vessels your containers sail on",
          "The containers themselves",
          "The cranes at origin and destination ports",
        ],
      },
      {
        text: "Under FOB Incoterms, when does risk transfer from seller to buyer?",
        explanation: "Free On Board: risk transfers when the goods are loaded on board the vessel at the named port of shipment. After that, it's the buyer's problem.",
        options: [
          "When the goods are loaded on board the vessel",
          "When the goods leave the seller's warehouse",
          "When the goods clear customs at destination",
          "When the buyer's payment settles",
        ],
      },
      {
        text: "Safety stock fundamentally exists to absorb…",
        explanation: "It buffers variability — demand spikes and lead-time slips. If demand and supply were perfectly predictable, you'd need none.",
        options: [
          "Variability in demand and supplier lead time",
          "Warehouse shrinkage and theft",
          "Obsolete inventory write-downs",
          "Volume discounts from bulk buying",
        ],
      },
      {
        text: "The 'bullwhip effect' describes what?",
        explanation: "Small demand changes at retail amplify into wild swings upstream, as each tier over-orders to protect itself. Named for how a whip's tip moves further than the handle.",
        options: [
          "Demand variability amplifying as it moves upstream in the chain",
          "Freight rates spiking in the run-up to Chinese New Year",
          "Trucks speeding up on the final delivery mile",
          "Pallets shifting inside a trailer under hard braking",
        ],
      },
      {
        text: "You use a 3PL today. What does moving to a 4PL actually add?",
        explanation: "A 4PL is a single orchestration layer that manages your whole logistics network — including the 3PLs. You outsource the management, not just the execution.",
        options: [
          "End-to-end orchestration of the supply chain, including managing your 3PLs",
          "A guaranteed minimum of four warehouses",
          "Dedicated last-mile delivery capacity",
          "In-house customs brokerage only",
        ],
      },
      {
        text: "Your supplier quotes an MOQ of 5,000 units. MOQ means…",
        explanation: "Minimum Order Quantity — the smallest order the supplier will accept. Negotiating it down usually costs you on unit price.",
        options: [
          "Minimum order quantity",
          "Maximum output quota",
          "Monthly ocean quota",
          "Minimum operational quality",
        ],
      },
      {
        text: "Cross-docking means…",
        explanation: "Inbound freight moves (nearly) straight to outbound trucks — hours, not days, of dwell. Great for flow, brutal without tight scheduling.",
        options: [
          "Transferring inbound freight directly to outbound trucks with little or no storage",
          "Moving containers across the dock by gantry crane",
          "Having two clerks double-check every dock manifest",
          "Splitting inventory across two mirrored warehouses",
        ],
      },
      {
        text: "A shipment is heavy, non-urgent, and moving 1,200 miles inland with rail access at both ends. What wins on cost?",
        explanation: "Intermodal rail dominates heavy, long-haul, non-urgent inland freight — roughly the price of trucking minus the driver-hours, in exchange for slower transit.",
        options: [
          "Intermodal rail",
          "Air freight",
          "Full-truckload expedited",
          "Parcel carriers with freight surcharge",
        ],
      },
      {
        text: "Your OTIF number is 87%. What is OTIF measuring?",
        explanation: "On Time, In Full — the share of orders delivered when promised and complete. Big retailers fine suppliers for missing it, which is why everyone obsesses over it.",
        options: [
          "Deliveries arriving on time and complete, as a share of all orders",
          "Overtime hours in fulfillment centers",
          "On-truck inventory flow rate",
          "Order-to-invoice frequency",
        ],
      },
    ],
  },
  {
    slug: "marketing-metrics-gauntlet-m4tr",
    creator: 1,
    title: "The Marketing Metrics Gauntlet",
    description: "Nine questions that separate people who run campaigns from people who post about running campaigns. Attribution nerds welcome.",
    industry: "Marketing",
    questions: [
      {
        text: "Your CAC is $120 and your LTV is $150. What's the honest read?",
        explanation: "An LTV:CAC around 1.25:1 leaves nothing for payroll, tooling, or margin. The classic healthy benchmark is ~3:1 — below that, scaling spend scales losses.",
        options: [
          "Margin is dangerously thin — you can't scale this profitably yet",
          "You're printing money; triple the ad budget",
          "Break-even economics are fine at scale",
          "LTV is a vanity metric; ignore it",
        ],
      },
      {
        text: "You're seeing 4x ROAS on branded search. What is that mostly telling you?",
        explanation: "Branded search largely captures demand that already existed — many of those clickers would have found you organically. Incrementality tests routinely show branded ROAS is heavily inflated.",
        options: [
          "You're capturing demand you probably already had",
          "Your ads created 4x revenue from a standing start",
          "Incrementality is proven; branded is your best channel",
          "You should shift all prospecting budget into branded",
        ],
      },
      {
        text: "After Apple's Mail Privacy Protection rolled out, your email open rate 'improved.' What actually happened?",
        explanation: "MPP pre-fetches tracking pixels on Apple's servers whether or not the human opens the email — inflating opens. Post-MPP, clicks and conversions are the honest signals.",
        options: [
          "Apple pre-fetches tracking pixels, so opens are inflated",
          "Your subscribers genuinely got more engaged",
          "Your deliverability reputation improved",
          "Nothing — MPP only affects click tracking",
        ],
      },
      {
        text: "Your A/B test shows +12% CTR with p = 0.2. What should you do?",
        explanation: "p = 0.2 means a 1-in-5 chance you'd see this result with no real effect. Keep collecting data or accept you're guessing — don't write it up as a win.",
        options: [
          "Keep the test running — that result isn't significant yet",
          "Ship it — 12% is 12%",
          "Report it as a confirmed win with a caveat footnote",
          "Switch to a multivariate test to speed things up",
        ],
      },
      {
        text: "'Dark social' refers to…",
        explanation: "Sharing that attribution tools can't see: DMs, group chats, Slack, screenshots. It shows up in analytics as 'direct' traffic, quietly stealing credit from word of mouth.",
        options: [
          "Sharing you can't attribute — DMs, group chats, screenshots",
          "Bot traffic on social platforms",
          "Competitors running smear campaigns",
          "Social ads scheduled in overnight slots",
        ],
      },
      {
        text: "In GA4, a session ends by default after…",
        explanation: "30 minutes of inactivity (configurable up to 7 hours 55 minutes). Unlike Universal Analytics, GA4 sessions don't reset at midnight or on campaign change.",
        options: [
          "30 minutes of user inactivity",
          "Midnight in the property's timezone",
          "The user closes the browser tab",
          "24 hours, regardless of activity",
        ],
      },
      {
        text: "The primary job of a lookalike audience is…",
        explanation: "Prospecting: the platform finds new users whose signals resemble your seed list (best customers, converters). Retargeting is a different tool for a different job.",
        options: [
          "Finding new prospects who resemble your best existing customers",
          "Re-engaging users who abandoned their carts",
          "Suppressing existing customers from campaigns",
          "Measuring brand lift across regions",
        ],
      },
      {
        text: "CPM is the cost per…",
        explanation: "Mille — Latin for a thousand. Cost per 1,000 impressions, the lingua franca of display and social buying.",
        options: [
          "Thousand impressions",
          "Million impressions",
          "Marketing-qualified lead",
          "Media placement",
        ],
      },
      {
        text: "Last-click attribution systematically over-credits…",
        explanation: "Bottom-funnel channels — branded search, retargeting, email — that harvest decisions made elsewhere. The top-funnel work that created the demand gets zero credit.",
        options: [
          "Bottom-funnel channels like branded search and retargeting",
          "Top-funnel channels like video and podcasts",
          "Out-of-home and TV",
          "Organic social reach",
        ],
      },
    ],
  },
  {
    slug: "prod-war-stories-9fk3",
    creator: 2,
    title: "Software Engineering: Production War Stories",
    description: "Ten questions you only get right if you've been paged at 3am. No leetcode, no trivia about sorting — just the stuff that actually breaks.",
    industry: "Technology",
    questions: [
      {
        text: "Your service starts returning 502s from the load balancer. First suspicion?",
        explanation: "502 Bad Gateway = the LB reached upstream and got garbage or nothing: crashed instances, failed health checks, or timeouts. Client-side causes don't produce 502s.",
        options: [
          "Upstream instances are unhealthy or not responding",
          "Users are sending malformed requests",
          "A DNS issue on the client's network",
          "The database schema drifted",
        ],
      },
      {
        text: "An API endpoint is 'idempotent' when…",
        explanation: "Calling it once or N times leaves the system in the same state — which is what makes safe retries possible. PUT and DELETE should be idempotent; unguarded POSTs usually aren't.",
        options: [
          "Retrying the same call produces the same end state",
          "It responds in under 100ms",
          "It requires no authentication",
          "It always returns HTTP 200",
        ],
      },
      {
        text: "You're paged: p99 latency doubled but p50 is unchanged. Where do you look?",
        explanation: "The tail. A subset of requests is hitting something slow — cache misses, GC pauses, a hot shard, one bad downstream. If everything were slower, p50 would move too.",
        options: [
          "Whatever a small slice of requests hits: cache misses, GC pauses, a hot shard",
          "A regression that made every request uniformly slower",
          "Frontend bundle size",
          "The median user's network connection",
        ],
      },
      {
        text: "Why is SELECT * in production code a smell?",
        explanation: "Your payload silently changes when the schema does — new columns leak into APIs, break serializers, and drag unneeded bytes (hello, that new BLOB column) across the wire.",
        options: [
          "Schema changes silently change your payloads and fetch data you don't need",
          "It's vulnerable to SQL injection by itself",
          "It takes a table-level write lock",
          "The query planner refuses to use indexes",
        ],
      },
      {
        text: "A migration adds a NOT NULL column with no default to a 200M-row table. What happens?",
        explanation: "Existing rows have no value for the column, so the migration fails outright or sits on a long, table-locking rewrite. The grown-up move: add nullable, backfill in batches, then add the constraint.",
        options: [
          "It fails or locks the table — existing rows can't satisfy the constraint",
          "The database backfills asynchronously by default",
          "Old rows silently get an empty string",
          "Nothing — constraints only apply to new rows",
        ],
      },
      {
        text: "The core point of feature flags is…",
        explanation: "Decoupling deploy from release: ship dark code continuously, then turn features on per-user, per-cohort, or instantly off when they misbehave — no rollback deploy needed.",
        options: [
          "Decoupling deploying code from releasing features",
          "Hiding bugs from users until the postmortem",
          "Running A/B tests, and nothing else",
          "Replacing environment variables",
        ],
      },
      {
        text: "What's a canary deploy?",
        explanation: "Route a small slice of real traffic to the new version and watch error rates and latency before rolling out to everyone. Named for the canary in the coal mine.",
        options: [
          "Releasing to a small share of traffic and watching metrics before full rollout",
          "Deploying only during low-traffic hours",
          "Deploying to a staging environment first",
          "A deploy that automatically reverts after one hour",
        ],
      },
      {
        text: "Tests pass locally but fail intermittently in CI. Most likely culprit?",
        explanation: "Flaky tests: hidden timing assumptions, test-order dependence, shared state, or resource contention on busy CI runners. 'Re-run until green' is a symptom, not a fix.",
        options: [
          "Flaky tests — timing, ordering, or shared-state dependence",
          "CI hardware is fundamentally broken",
          "A compiler bug in the CI toolchain",
          "Cosmic rays flipping bits in the test runner",
        ],
      },
      {
        text: "CAP theorem: during a network partition, a distributed system must trade off between…",
        explanation: "Consistency and availability — when nodes can't talk, you either refuse some requests (consistent) or serve possibly-stale data (available). Partition tolerance isn't optional; networks fail.",
        options: [
          "Consistency and availability",
          "CPU and memory",
          "Cost and performance",
          "Consensus and replication",
        ],
      },
      {
        text: "Bumping a library from 2.4.1 to 3.0.0 signals…",
        explanation: "Breaking changes — that's the semver contract. Major = breaking, minor = features, patch = fixes. It says nothing about how big or exciting the release is.",
        options: [
          "Breaking changes to the public API",
          "A huge new feature set",
          "A ground-up rewrite",
          "Three years of accumulated work",
        ],
      },
    ],
  },
];

// [quizIndex, personaIndex, correctCount, avgSecondsPerQuestion, shared]
const SEED_ATTEMPTS: [number, number, number, number, boolean][] = [
  [0, 4, 9, 7.5, true],
  [0, 2, 8, 6.2, true],
  [0, 1, 6, 9.8, true],
  [0, 3, 5, 11.4, false],
  [1, 0, 7, 8.1, true],
  [1, 4, 8, 6.9, true],
  [1, 2, 5, 10.6, true],
  [2, 3, 7, 9.2, true],
  [2, 0, 6, 8.8, true],
  [2, 1, 4, 12.3, false],
];

// Deterministic pseudo-random so seeded leaderboards look organic but stable.
function makeRng(seedValue: number) {
  let s = seedValue >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function seed(db: Database.Database) {
  const now = Date.now();
  const rng = makeRng(42);

  const insertUser = db.prepare(
    `INSERT INTO users (id, name, email, avatarUrl, headline, industry, authProvider, providerId, createdAt)
     VALUES (@id, @name, @email, @avatarUrl, @headline, @industry, 'mock', @providerId, @createdAt)`
  );
  const insertQuiz = db.prepare(
    `INSERT INTO quizzes (id, slug, creatorId, title, description, industry, status, playCount, createdAt, publishedAt)
     VALUES (@id, @slug, @creatorId, @title, @description, @industry, 'published', @playCount, @createdAt, @publishedAt)`
  );
  const insertQuestion = db.prepare(
    `INSERT INTO questions (id, quizId, ord, text, explanation) VALUES (@id, @quizId, @ord, @text, @explanation)`
  );
  const insertOption = db.prepare(
    `INSERT INTO answer_options (id, questionId, ord, text, isCorrect) VALUES (@id, @questionId, @ord, @text, @isCorrect)`
  );
  const insertAttempt = db.prepare(
    `INSERT INTO attempts (id, quizId, userId, score, maxScore, durationMs, answers, isReplay, sharedAt, createdAt)
     VALUES (@id, @quizId, @userId, @score, @maxScore, @durationMs, @answers, 0, @sharedAt, @createdAt)`
  );

  db.transaction(() => {
    const userIds = PERSONAS.map((p, i) => {
      const uid = id();
      insertUser.run({ ...p, id: uid, providerId: `mock-persona-${i + 1}`, createdAt: now - (30 - i) * 86_400_000 });
      return uid;
    });

    const quizData: { quizId: string; questions: { qid: string; correctOptionId: string; wrongOptionIds: string[] }[] }[] = [];

    QUIZZES.forEach((quiz, qi) => {
      const quizId = id();
      const createdAt = now - (20 - qi * 3) * 86_400_000;
      insertQuiz.run({
        id: quizId,
        slug: quiz.slug,
        creatorId: userIds[quiz.creator],
        title: quiz.title,
        description: quiz.description,
        industry: quiz.industry,
        playCount: 0,
        createdAt,
        publishedAt: createdAt + 3_600_000,
      });

      const questionRefs: { qid: string; correctOptionId: string; wrongOptionIds: string[] }[] = [];
      quiz.questions.forEach((q, ord) => {
        const qid = id();
        insertQuestion.run({ id: qid, quizId, ord, text: q.text, explanation: q.explanation || null });
        // options[0] is correct; shuffle display order deterministically
        const indexed = q.options.map((text, i) => ({ text, isCorrect: i === 0 ? 1 : 0 }));
        const shuffled = [...indexed].sort(() => rng() - 0.5);
        let correctOptionId = "";
        const wrongOptionIds: string[] = [];
        shuffled.forEach((o, ord2) => {
          const oid = id();
          insertOption.run({ id: oid, questionId: qid, ord: ord2, text: o.text, isCorrect: o.isCorrect });
          if (o.isCorrect) correctOptionId = oid;
          else wrongOptionIds.push(oid);
        });
        questionRefs.push({ qid, correctOptionId, wrongOptionIds });
      });
      quizData.push({ quizId, questions: questionRefs });
    });

    const playCounts = new Map<string, number>();
    SEED_ATTEMPTS.forEach(([qi, pi, correct, avgSec, shared], ai) => {
      const { quizId, questions } = quizData[qi];
      const maxScore = questions.length;
      const correctSet = new Set<number>();
      while (correctSet.size < Math.min(correct, maxScore)) correctSet.add(Math.floor(rng() * maxScore));

      let durationMs = 0;
      const answers: AttemptAnswer[] = questions.map((q, i) => {
        const timeMs = Math.round((avgSec + (rng() - 0.5) * 6) * 1000);
        const clamped = Math.max(1800, Math.min(19500, timeMs));
        durationMs += clamped;
        const isCorrect = correctSet.has(i);
        return {
          questionId: q.qid,
          optionId: isCorrect ? q.correctOptionId : q.wrongOptionIds[Math.floor(rng() * q.wrongOptionIds.length)],
          correct: isCorrect,
          timeMs: clamped,
        };
      });

      const createdAt = now - (10 - ai) * 43_200_000;
      insertAttempt.run({
        id: id(),
        quizId,
        userId: userIds[pi],
        score: correctSet.size,
        maxScore,
        durationMs,
        answers: JSON.stringify(answers),
        sharedAt: shared ? createdAt + 300_000 : null,
        createdAt,
      });
      playCounts.set(quizId, (playCounts.get(quizId) ?? 0) + 1);
    });

    const bumpPlays = db.prepare("UPDATE quizzes SET playCount = ? WHERE id = ?");
    for (const [quizId, n] of playCounts) bumpPlays.run(n + 9, quizId); // pad so counts feel lived-in
  })();
}
