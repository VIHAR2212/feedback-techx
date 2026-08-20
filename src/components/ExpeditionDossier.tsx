'use client';

import { useState } from 'react';
import { useUser } from '@/context/UserContext';

const departmentOptions = [
  "AI-DS", "CSE-DS", "COMPS", "EXTC", "MECH",
  "VLSI", "IT", "CIVIL", "MMS"
];

interface ExpeditionDossierProps {
  onSuccess: () => void;
}

export default function ExpeditionDossier({ onSuccess }: ExpeditionDossierProps) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const { login } = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !department) {
      alert('Please complete all fields before continuing.');
      return;
    }

    login({ name, department, email });
    onSuccess();
  };

  return (
    <div className="max-w-[460px] mx-auto py-6 px-4 min-h-screen flex flex-col justify-center box-border">
      <div className="simple-card vintage-border py-9 px-7 relative overflow-hidden bg-uc-parchment border-[1.5px] border-[#8C6F42] rounded shadow-[0_10px_28px_rgba(0,0,0,0.5)]">
        {/* Corner Embellishments */}
        <div className="absolute top-2 left-2.5 text-xs text-[#A88448] pointer-events-none select-none">✦</div>
        <div className="absolute top-2 right-2.5 text-xs text-[#A88448] pointer-events-none select-none">✦</div>
        <div className="absolute bottom-2 left-2.5 text-xs text-[#A88448] pointer-events-none select-none">✦</div>
        <div className="absolute bottom-2 right-2.5 text-xs text-[#A88448] pointer-events-none select-none">✦</div>

        <div className="text-center mb-7">
          <div className="text-xs tracking-[3px] text-uc-rust font-bold font-mono uppercase mb-1.5">
            EXPEDITION LOG DOSSIER • N° 1897
          </div>
          <h1 className="text-3xl sm:text-4xl text-[#2C1E14] my-1 font-uncharted tracking-[1.5px] drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
            Register Your Alias
          </h1>
          <p className="text-sm text-[#523D24] font-serif italic m-0 leading-relaxed">
            &quot;Every lost treasure requires a map. Yours begins here — log your credentials to chart the uncharted.&quot;
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold font-uncharted text-[#422F1B] uppercase tracking-[1.5px] mb-1.5">
              ✦ Explorer Alias (Full Name)
            </label>
            <input
              type="text"
              placeholder="e.g. Nathan Drake"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full py-3 px-3.5 bg-[#FFFDF7] border-[1.5px] border-[#A88448] rounded text-[#2C1E14] font-serif text-base box-border shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] focus:outline-none focus:border-uc-gold transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold font-uncharted text-[#422F1B] uppercase tracking-[1.5px] mb-1.5">
              ✦ Guild / Department Sector
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="w-full py-3 px-3.5 bg-[#FFFDF7] border-[1.5px] border-[#A88448] rounded text-[#2C1E14] font-serif text-base box-border shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] focus:outline-none focus:border-uc-gold transition-colors cursor-pointer"
            >
              <option value="" disabled>Select Department Sector...</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold font-uncharted text-[#422F1B] uppercase tracking-[1.5px] mb-1.5">
              ✦ Coordinates (Email Address)
            </label>
            <input
              type="email"
              placeholder="hunter@expedition.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full py-3 px-3.5 bg-[#FFFDF7] border-[1.5px] border-[#A88448] rounded text-[#2C1E14] font-serif text-base box-border shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] focus:outline-none focus:border-uc-gold transition-colors"
            />
          </div>

          <button
            type="submit"
            className="simple-btn-primary gold-pulse mt-2.5 w-full py-3.5 px-4 text-base font-bold uppercase tracking-wider rounded cursor-pointer touch-manipulation transition-transform active:scale-[0.99]"
          >
            Mark the Map & Begin Expedition ➔
          </button>
        </form>
      </div>
    </div>
  );
}
