export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-2">Settings</h1>
      <p className="text-sm text-white/30">API keys and configuration.</p>

      <div className="mt-6 bg-[#161616] border border-white/[0.06] rounded-lg p-5 max-w-md">
        <p className="text-xs text-white/40 mb-3">
          Add your API keys to the <code className="text-white/60">.env</code> file in the project root:
        </p>
        <pre className="text-xs text-white/60 bg-black/30 rounded p-3 font-mono leading-relaxed">
{`ANTHROPIC_API_KEY=sk-ant-...
PEXELS_API_KEY=...
GITHUB_TOKEN=github_pat_...`}
        </pre>
        <p className="text-xs text-white/30 mt-3">Restart the server after updating.</p>
      </div>
    </div>
  );
}
