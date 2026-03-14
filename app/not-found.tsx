export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Page Not Found</h2>
      <p style={{ color: '#666' }}>The page you are looking for does not exist.</p>
    </div>
  )
}
