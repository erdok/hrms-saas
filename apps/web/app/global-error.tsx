'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ fontFamily: 'monospace', padding: 32, background: '#fee', color: '#900' }}>
        <h1>Global error caught:</h1>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
{error.message}
{'\n\n'}
{error.stack}
        </pre>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
