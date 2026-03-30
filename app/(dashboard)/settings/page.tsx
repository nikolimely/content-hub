export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-[#0F172A] mb-2">Settings</h1>
      <p className="text-sm text-[#64748B]">API keys and configuration.</p>

      <div className="mt-6 bg-white border border-[#E2E8F0] rounded-xl p-5 max-w-md shadow-sm">
        <p className="text-xs text-[#64748B] mb-3">
          Add your API keys to the <code className="text-[#475569] bg-[#F1F5F9] px-1 py-0.5 rounded">.env</code> file in the project root:
        </p>
        <pre className="text-xs text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 font-mono leading-relaxed">
{`ANTHROPIC_API_KEY=sk-ant-...
PEXELS_API_KEY=...
GITHUB_TOKEN=github_pat_...`}
        </pre>
        <p className="text-xs text-[#94A3B8] mt-3">Restart the server after updating.</p>
      </div>
    </div>
  );
}
