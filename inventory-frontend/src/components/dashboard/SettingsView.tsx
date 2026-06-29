import { ExportButton } from "../ui/ExportButton";

export function SettingsView() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-serif text-gold-light mb-8">Settings</h1>
      
      {/* Drop your export UI here */}
      <div className="glass-card p-6 border border-gold-muted/30 rounded-xl max-w-xl">
        <h2 className="text-lg font-medium text-gold mb-4">Data Export</h2>
        <ExportButton />
      </div>
    </div>
  );
}