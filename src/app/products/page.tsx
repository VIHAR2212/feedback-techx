import MinecraftCard from "@/components/MinecraftCard";

const products = [
  { id: 'ai-projector', name: 'AI Projector', icon: '🤖' },
  { id: 'vr-experience', name: 'VR Experience', icon: '🕶️' },
  { id: 'iot-smart-garden', name: 'IoT Smart Garden', icon: '🌿' },
  { id: 'blockchain-voting', name: 'Blockchain Voting', icon: '🔗' },
];

export default function ProductsPage() { // Renamed to ProductsPage for clarity
  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'monospace' }}>
          TechX Feedback Portal
        </h1>
        <p style={{ color: '#a0a0a0', fontFamily: 'monospace' }}>
          Click a project to give feedback!
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
        {products.map((product) => (
          <MinecraftCard key={product.id} {...product} />
        ))}
      </div>
    </main>
  );
}