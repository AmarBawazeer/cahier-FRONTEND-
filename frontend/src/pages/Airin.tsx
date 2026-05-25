import { motion } from "framer-motion";
import PageLayout from "../components/PageLayout";

const suggestions = [
  "Recommend a noir film",
  "Break down my session history",
  "Suggest what to rank next",
];

const conversation = [
  {
    speaker: "Airin",
    content:
      "Airin interface ready. Recommendations, profile analysis, and session debriefs can land in this thread once the assistant endpoint is connected.",
    ai: true,
    width: "max-w-[85%]",
  },
  {
    speaker: "Airin",
    content:
      "Use the prompt bar below as the final interaction surface. This page keeps the intended chat layout without inventing a fake conversation.",
    ai: true,
    width: "max-w-[90%]",
  },
];

export default function Airin() {
  return (
    <PageLayout>

      <main className="relative flex min-h-screen flex-col items-center overflow-hidden pb-56 pt-6">
        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-primary-container/5 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-secondary-container/5 blur-[150px]" />

        <section className="flex w-full max-w-xl flex-col space-y-10 px-4 sm:px-5">
          {conversation.map((message, index) => (
            <motion.div
              key={`${message.speaker}-${index}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`group flex flex-col ${
                message.ai ? "items-start self-start" : "items-end self-end"
              } ${message.width}`}
            >
              <div
                className={`mb-3 flex items-center gap-3 ${
                  message.ai ? "" : "justify-end"
                }`}
              >
                {message.ai ? (
                  <>
                    <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                      {message.speaker}
                    </span>
                    <span className="h-px w-8 bg-outline-variant/30" />
                  </>
                ) : (
                  <>
                    <span className="h-px w-8 bg-outline-variant/30" />
                    <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                      {message.speaker}
                    </span>
                  </>
                )}
              </div>
              <div
                className={`rounded-xl leading-relaxed shadow-sm ${
                  message.ai
                    ? "bg-surface-container-low/60 px-5 py-4 font-headline text-base italic text-on-surface backdrop-blur-md"
                    : "bg-outline-variant/15 px-6 py-4 font-body text-base tracking-tight text-on-surface-variant"
                }`}
              >
                {message.content}
              </div>
            </motion.div>
          ))}

          <div className="flex items-center gap-2 px-2 opacity-60">
            <span className="typing-dot animate-pulse" />
            <span
              className="typing-dot animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <span
              className="typing-dot animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        </section>
      </main>

      <div className="pointer-events-none fixed bottom-0 left-0 z-40 w-full">
        <div className="pointer-events-auto mx-auto max-w-xl px-4 pb-24 sm:px-5 md:pb-8">
          <div className="no-scrollbar mb-6 flex gap-3 overflow-x-auto pb-2">
            {suggestions.map((item) => (
              <button
                key={item}
                className="whitespace-nowrap rounded-full border border-outline-variant/20 bg-surface-container-highest/40 px-4 py-2 font-label text-[11px] uppercase tracking-widest text-on-surface-variant transition-all hover:bg-surface-container-highest/80 active:scale-95"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="group relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 opacity-25 blur transition duration-1000 group-focus-within:opacity-50" />
            <div className="relative flex items-center rounded-2xl bg-surface-container-highest/80 p-2 shadow-2xl backdrop-blur-2xl">
              <input
                className="flex-1 border-none bg-transparent px-4 py-3 font-body text-sm text-on-surface placeholder:text-zinc-600 focus:ring-0"
                placeholder="Speak to Airin..."
                type="text"
              />
              <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-lg transition-transform hover:scale-105 active:scale-90">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  north
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
