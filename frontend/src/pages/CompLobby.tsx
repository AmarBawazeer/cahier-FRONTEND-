import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

type Player = {
  name: string;
  image?: string;
  ready?: boolean;
  host?: boolean;
  empty?: boolean;
  locked?: boolean;
  dimmed?: boolean;
};

type ChatTab = "chat" | "settings" | "players";

const sidebarTabs: Array<{ id: ChatTab; label: string; icon: string }> = [
  { id: "chat", label: "Chat", icon: "forum" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "players", label: "Players", icon: "groups" },
];

const collageFrames = [
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDesfbm2emawYPZnbOdeaIzdpJm7X2qNO2FRtAsQ8kNBuDiq-G3oEmaEgR3t3i2RuyUgG1T5suCk7DYOqAlIp4mIZk9ajN38SugrUUsFXoqPRuQAuTc_mAAPEANnZVCGT8-n5NcimQ_qnFxdepBWS-HH6t6GQlexZJMba9qK1BP5nd5YyEGCsWMAdoH-xDOgmbiSw78s4BMtR2KbSE2KVeWeOkYZ9-4a09Zn4myHeVjrAuVYvUE-yRVIM7daRTmf66Yut2Hgm39-Sas",
    offset: "",
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAvPXZ5mAa5-O1B28C4yIJVQevorXB22Xvo_cEh0U7CwEgzkeTOwwxyAwym-RSKmh-6CN6XGO0RogIVTZBFYVn2DS6hd50ZbCOSRjShTt4yu6gqfNhqVb0_R75n_cdllzaHjgGmn0ViIJgaBFNQjYqmvak30opWJErcOr17z3k8iij4tO-6sinFPgSzCYkuI-eJ3oV0Vdirzhr0Y9I7yREaAzYlHMM4OfpEx64_hXZ1SsgnAhGiNPXlP_ost7K1IpUsoiM-mdZ3qdol",
    offset: "mt-20",
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdvyWSK81FVHfLtxK-tMDBWHvb7Uef481_LyB9QiELbiz7Ic2Ia_ryrAgg45sUik2bH2aX6tmy8TbpMTpESDXN_MuLpi6LE3oTLg_mEa-JLZXyM0G4eq887EAUlmo03D60jzNfRYhtsiBXRlWVSr073E8s9hZ8J_H0ZnQr2V14p5vLK-fIc-JDR-miUGv66-QaXIPNhbBCvNpg0DwBmGNLDUhjGnyanFArqc3Jeh2pVe98hRHNHrtyUOMXb68J4NitPyrFEj3raK7v",
    offset: "-mt-10",
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDskY_DjNWBvBw1Wd5VsdHGmDJQ5jJ2Rf8g2_SlRAncuAno28Sc_YUEFevNzRzJbLFCKyh9g7y5BT0gvnVe7u9lUT8RqW9hy51ww2X1Pi37c_wyFwTLsCIwjlTIl_CSzQXHu4iHjQGZbVZhtibm2OpsyS3W6H2khAhr0hs52Vww1dZURKH3sdGpjSmuwlOvRi6ms31vOvRQx-okC10gRnWPu0S57jq_2XUGoGVHAmxao8N9N5WkD-BnbbR3LQ14pJd3KWgrKY7_Z6sv",
    offset: "mt-32",
  },
];

const players: Player[] = [
  {
    name: "Host Slot",
    ready: true,
    host: true,
  },
  {
    name: "Player Slot 2",
    ready: true,
  },
  {
    name: "Player Slot 3",
  },
  {
    name: "Player Slot 4",
    ready: true,
    dimmed: true,
  },
  {
    name: "Player Slot 5",
  },
  { name: "Invite", empty: true },
  { name: "Locked", locked: true },
  { name: "Locked", locked: true },
];

const settingsPreview = [
  { label: "Rounds", value: "12 Chapters" },
  { label: "Genre Focus", value: "Noir & Thriller" },
  { label: "Difficulty", value: "Criterion", accent: true },
];

function SidebarContent({ tab }: { tab: ChatTab }) {
  if (tab === "settings") {
    return (
      <div className="space-y-4">
        <p className="font-label text-[11px] uppercase tracking-widest text-zinc-600">
          Match Settings
        </p>
        {settingsPreview.map((item) => (
          <div
            key={item.label}
            className="rounded border border-outline-variant/20 bg-surface-container-low p-4"
          >
            <span className="mb-1 block font-label text-[10px] uppercase tracking-[0.22em] text-zinc-600">
              {item.label}
            </span>
            <span
              className={`font-headline text-lg ${
                item.accent ? "text-tertiary" : "text-on-surface"
              }`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "players") {
    return (
      <div className="space-y-3">
        <p className="font-label text-[11px] uppercase tracking-widest text-zinc-600">
          In This Room
        </p>
        {players
          .filter((player) => !player.locked)
          .map((player) => (
            <div
              key={player.name}
              className="flex items-center justify-between rounded border border-outline-variant/20 bg-surface-container-low px-3 py-3"
            >
              <span className="font-body text-sm text-on-surface">
                {player.empty ? "Open slot" : player.name}
              </span>
              <span
                className={`font-label text-[10px] uppercase tracking-[0.2em] ${
                  player.host
                    ? "text-primary"
                    : player.ready
                      ? "text-tertiary"
                      : "text-zinc-600"
                }`}
              >
                {player.empty
                  ? "Invite"
                  : player.host
                    ? "Host"
                    : player.ready
                      ? "Ready"
                      : "Waiting"}
              </span>
            </div>
          ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-2 font-label text-[11px] uppercase tracking-widest text-zinc-600">
        System Broadcast
      </div>
      <div className="rounded border-l-2 border-primary-container bg-surface-container-low p-3">
        <p className="text-sm italic text-on-surface-variant">
          Live room activity will appear here when competitive multiplayer is wired to the backend.
        </p>
      </div>
      <div className="space-y-3">
        <div className="flex flex-col">
          <p className="text-sm text-on-surface">
            Player chat is hidden until the lobby uses real participants and messages.
          </p>
        </div>
        <div className="flex flex-col">
          <p className="text-sm text-on-surface">
            Use this room as the shell for the real battle flow, not as a fake populated demo.
          </p>
        </div>
        <div className="rounded bg-surface-container-low p-3">
          <p className="text-sm italic text-on-surface-variant">
            Waiting for real lobby events.
          </p>
        </div>
      </div>
    </>
  );
}

function PlayerTile({ player }: { player: Player }) {
  if (player.empty) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="group flex h-24 w-24 cursor-pointer items-center justify-center rounded border-2 border-dashed border-zinc-800 transition-colors hover:border-primary-container">
          <span className="material-symbols-outlined text-zinc-700 group-hover:text-primary-container">
            person_add
          </span>
        </div>
        <div className="text-center">
          <p className="font-headline text-lg text-zinc-700">Invite</p>
        </div>
      </div>
    );
  }

  if (player.locked) {
    return (
      <div className="hidden flex-col items-center gap-4 md:flex">
        <div className="flex h-24 w-24 items-center justify-center rounded border border-zinc-900 bg-zinc-950/20 opacity-40">
          <span className="material-symbols-outlined text-zinc-800">lock</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex flex-col items-center gap-4 ${
        player.dimmed ? "opacity-80" : ""
      }`}
    >
      <div className="relative">
        <div
          className={`flex h-24 w-24 items-center justify-center rounded border bg-zinc-950/40 shadow-lg transition-all duration-500 ${
            player.host
              ? "border-2 border-primary-container"
              : "border border-outline-variant/30"
          }`}
        >
          <span className="material-symbols-outlined text-3xl text-zinc-500">
            person
          </span>
        </div>
        {player.host ? (
          <div className="absolute -right-2 -top-2 rounded-full bg-primary-container px-2 py-0.5 text-[8px] font-bold uppercase text-white">
            Host
          </div>
        ) : null}
      </div>
      <div className="text-center">
        <p className="font-headline text-lg font-bold">{player.name}</p>
        {player.ready ? (
          <span className="ready-pulse flex items-center justify-center gap-1 rounded bg-primary-container/10 px-2 py-1 font-label text-[10px] font-bold uppercase tracking-widest text-primary">
            Ready
          </span>
        ) : (
          <span className="px-2 py-1 font-label text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Waiting...
          </span>
        )}
      </div>
    </div>
  );
}

export default function CompLobby() {
  const { lobby } = useParams();
  const [activeTab, setActiveTab] = useState<ChatTab>("chat");

  const roomNumber = useMemo(() => {
    if (!lobby) return "402";
    return lobby.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }, [lobby]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-container-lowest text-on-surface">
      <div className="fixed inset-0 z-0 bg-glow-bleed">
        <div className="film-strip-mask pointer-events-none absolute inset-0 hidden items-center justify-center opacity-20 lg:flex">
          <div className="flex rotate-12 scale-150 gap-4">
            {collageFrames.map((frame, index) => (
              <img
                key={index}
                className={`h-96 w-64 object-cover grayscale brightness-50 ${frame.offset}`}
                src={frame.image}
                alt=""
              />
            ))}
          </div>
        </div>
      </div>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-zinc-950/60 px-4 py-4 shadow-[0_0_15px_rgba(214,221,230,0.08)] backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link to="/" className="font-headline text-2xl tracking-tighter text-zinc-200">
            Cahier
          </Link>
          <div className="flex items-center gap-4 sm:gap-8">
            <nav className="hidden items-center gap-6 md:flex">
              <Link className="border-b border-zinc-300 py-1 font-bold text-zinc-100" to={`/game/comp/${lobby ?? "room-402"}`}>
                Lobby
              </Link>
              <Link className="py-1 text-zinc-500 transition-colors hover:text-zinc-300" to="/vault">
                Library
              </Link>
              <Link className="py-1 text-zinc-500 transition-colors hover:text-zinc-300" to="/leaderboard">
                Community
              </Link>
            </nav>
            <div className="flex items-center gap-2 sm:gap-4">
              <button className="rounded-full p-2 text-on-surface transition-all duration-300 hover:bg-zinc-800/50 active:scale-95">
                <span className="material-symbols-outlined">info</span>
              </button>
              <button className="rounded-full p-2 text-on-surface transition-all duration-300 hover:bg-zinc-800/50 active:scale-95">
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <aside className="fixed right-0 top-0 z-40 hidden h-full w-80 border-l border-zinc-800/30 bg-zinc-950/80 pt-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md xl:flex xl:flex-col">
        <div className="flex border-b border-zinc-900 px-4">
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === tab.id
                  ? "border-r-2 border-zinc-300 bg-zinc-200/5 text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              <span className="font-label text-sm uppercase tracking-widest">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <SidebarContent tab={activeTab} />
        </div>
        <div className="bg-zinc-950 p-6">
          <div className="relative">
            <input
              className="w-full border-0 border-b border-outline-variant/40 bg-transparent py-2 text-sm text-on-surface placeholder:text-zinc-700 focus:border-primary focus:ring-0"
              placeholder="Type a message..."
              type="text"
            />
            <button className="absolute right-0 top-1/2 -translate-y-1/2 text-primary-container duration-200 active:scale-95">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="relative z-10 min-h-screen px-4 pb-28 pt-24 sm:px-5 lg:px-6 xl:pr-80">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface sm:text-5xl">
                {roomNumber}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-zinc-500 sm:gap-4 sm:text-sm">
                <span className="font-bold text-primary-container">Directing Now</span>
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
                <div className="group flex cursor-pointer items-center gap-2">
                  <span>
                    Code: <span className="text-on-surface">CH-8X92</span>
                  </span>
                  <span className="material-symbols-outlined text-xs transition-colors group-hover:text-primary">
                    content_copy
                  </span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right">
              <div className="font-headline text-4xl italic text-on-surface">
                5 <span className="font-body text-2xl not-italic text-zinc-700">/ 8</span>
              </div>
              <div className="animate-pulse font-label text-[10px] uppercase tracking-widest text-primary-container">
                Waiting for players...
              </div>
            </div>
          </div>

          <div className="glass-panel relative overflow-hidden rounded-xl border border-outline-variant/10 p-6 shadow-2xl sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 bg-primary-container/10 blur-[100px]" />
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {players.map((player, index) => (
                <PlayerTile
                  key={`${player.name}-${index}`}
                  player={player}
                />
              ))}
            </div>

            <div className="mt-12 border-t border-zinc-800/50 pt-10">
              <div className="flex flex-col items-center space-y-6">
                <div className="flex w-full max-w-md flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <button className="flex-1 rounded-lg bg-gradient-to-r from-primary-container to-inverse-primary px-8 py-4 font-headline text-sm font-bold uppercase tracking-widest text-on-primary-container shadow-[0_0_20px_rgba(214,221,230,0.2)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:grayscale disabled:opacity-30">
                    Start Game
                  </button>
                  <button className="rounded-lg border border-outline-variant/40 px-6 py-4 font-label text-xs font-semibold uppercase tracking-wider text-tertiary transition-all hover:bg-surface-container-high active:scale-[0.98]">
                    Invite Friends
                  </button>
                </div>
                <p className="text-center font-label text-[10px] uppercase tracking-[0.3em] text-zinc-600">
                  Waiting for 3 more players to be ready
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-6 xl:mt-12 xl:flex-row xl:items-start xl:gap-8">
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
              {settingsPreview.map((item) => (
                <div
                  key={item.label}
                  className="rounded border border-outline-variant/5 bg-surface-container-low p-4"
                >
                  <span className="mb-1 block font-label text-[9px] uppercase tracking-widest text-zinc-600">
                    {item.label}
                  </span>
                  <span
                    className={`font-headline text-xl ${
                      item.accent ? "text-tertiary" : "text-on-surface"
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="xl:w-1/3">
              <p className="border-l-2 border-primary-container/30 pl-4 text-xs italic leading-relaxed text-zinc-500">
                &quot;Cinema is a matter of what&apos;s in the frame and what&apos;s
                out.&quot;
                <span className="mt-1 block font-label text-[9px] font-bold uppercase not-italic tracking-widest text-zinc-400">
                  - Martin Scorsese
                </span>
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-outline-variant/10 bg-zinc-950/50 p-5 xl:hidden">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-label text-[11px] uppercase tracking-widest text-zinc-600">
                {activeTab}
              </p>
              <div className="flex gap-2">
                {sidebarTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-full px-3 py-1 font-label text-[10px] uppercase tracking-[0.2em] ${
                      activeTab === tab.id
                        ? "bg-primary-container/15 text-primary"
                        : "text-zinc-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <SidebarContent tab={activeTab} />
            </div>
            {activeTab === "chat" ? (
              <div className="mt-4 border-t border-outline-variant/15 pt-4">
                <div className="relative">
                  <input
                    className="w-full border-0 border-b border-outline-variant/40 bg-transparent py-2 text-sm text-on-surface placeholder:text-zinc-700 focus:border-primary focus:ring-0"
                    placeholder="Type a message..."
                    type="text"
                  />
                  <button className="absolute right-0 top-1/2 -translate-y-1/2 text-primary-container duration-200 active:scale-95">
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-outline-variant/10 bg-surface-container-low/80 px-6 py-4 backdrop-blur-lg md:hidden">
        {[
          { label: "Lobby", icon: "stadium", active: true },
          { label: "Chat", icon: "chat", tab: "chat" as ChatTab },
          { label: "Settings", icon: "settings", tab: "settings" as ChatTab },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => item.tab && setActiveTab(item.tab)}
            className={`flex flex-col items-center gap-1 ${
              item.active || item.tab === activeTab ? "text-primary" : "text-zinc-600"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label text-[10px] uppercase">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
