export default function ComoJugar() {
  return (
    <div className="page">
      <h1 className="condensed" style={{ fontSize: '2rem', color: 'var(--gold)', marginBottom: '1.5rem' }}>
        ℹ️ Cómo Jugar
      </h1>

      <section style={sectionStyle}>
        <h2 className="condensed" style={headingStyle}>Para Empezar</h2>
        <p style={textStyle}>
          El organizador de la quiniela te dio un código de acceso personal. Ingrésalo en la pantalla de inicio para entrar — no necesitas correo ni contraseña. Tus picks y tu nombre están ligados a ese código, así que guárdalo para ti.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 className="condensed" style={headingStyle}>Cómo Hacer tus Picks</h2>
        <p style={textStyle}>
          Ve a <strong style={{ color: 'var(--text)' }}>My Picks</strong> y elige cualquier grupo o ronda en la barra de pestañas de arriba. Para cada partido, ingresa el marcador que predices — goles del equipo local a la izquierda, visitante a la derecha.
        </p>
        <p style={{ ...textStyle, marginTop: '0.5rem' }}>
          Puedes cambiar tus picks en cualquier momento <strong style={{ color: 'var(--text)' }}>hasta 1 hora antes del pitido inicial</strong>, cuando se bloquean automáticamente. Una vez bloqueado un pick, ya no se puede editar.
        </p>
        <div style={noteStyle}>
          🔒 Los picks se bloquean <strong>1 hora antes del inicio de cada partido</strong>. Planifica con anticipación, especialmente para los partidos tempraneros.
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 className="condensed" style={headingStyle}>Puntuación por Partido</h2>
        <p style={textStyle}>Todas las predicciones se puntúan con base en el <strong style={{ color: 'var(--text)' }}>resultado a los 90 minutos</strong>. La prórroga y los penaltis no afectan la puntuación individual de cada partido.</p>
        <p style={{ ...textStyle, marginTop: '0.4rem' }}>Los puntos son acumulativos — puedes sumar hasta <strong style={{ color: 'var(--gold)' }}>8 pts</strong> por partido:</p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.4rem', marginTop: '0.75rem' }}>
          <ScoreRow pts={4} label="Resultado correcto" desc="Acertaste el ganador o el empate" />
          <ScoreRow pts={6} label="+ goles del ganador" desc="Resultado correcto + goles del equipo ganador exactos (+2)" />
          <ScoreRow pts={6} label="+ goles del perdedor" desc="Resultado correcto + goles del equipo perdedor exactos (+2)" />
          <ScoreRow pts={8} label="Marcador exacto (máx)" desc="Resultado correcto + ambos marcadores exactos (+2+2)" />
        </div>
        <div style={noteStyle}>
          💡 Ejemplo: predices 2-1 y el resultado es 2-1 → 4 (resultado) + 2 (goles ganador) + 2 (goles perdedor) = <strong style={{ color: 'var(--gold)' }}>8 pts</strong>.
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 className="condensed" style={headingStyle}>Picks de Bonificación</h2>
        <p style={textStyle}>
          En la pestaña <strong style={{ color: 'var(--text)' }}>★ Bonus</strong> encontrarás predicciones globales del torneo que valen puntos extra. Estos son sobre <strong style={{ color: 'var(--text)' }}>quién avanza</strong>, no sobre marcadores individuales — la regla de los 90 minutos no aplica aquí.
        </p>
        <p style={{ ...textStyle, marginTop: '0.5rem' }}>
          Si elegiste a Brasil como semifinalista y clasifican en la tanda de penaltis, ese pick de bonificación se cuenta. No importa cómo llegaron — solo que llegaron.
        </p>
        <p style={{ ...textStyle, marginTop: '0.5rem' }}>
          Los picks de bonificación se bloquean antes del primer partido de cada ronda correspondiente.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.4rem', marginTop: '0.75rem' }}>
          <ScoreRow pts={20} label="Campeón" desc="1 pick — el equipo que gana el torneo" />
          <ScoreRow pts={15} label="Subcampeón" desc="1 pick — equipo que llega a la final y pierde" />
          <ScoreRow pts={10} label="3er lugar" desc="1 pick — ganador del partido por el 3er puesto" />
          <ScoreRow pts={5}  label="4to lugar" desc="1 pick — perdedor del partido por el 3er puesto" />
          <ScoreRow pts={2}  label="Clasificado a Octavos" desc="16 picks — equipos que avanzan desde la Ronda de 32" />
        </div>
        <div style={noteStyle}>
          💡 Cada pick de bonificación correcto se puntúa de forma independiente.
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 className="condensed" style={headingStyle}>Premios</h2>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.4rem' }}>
          {[
            { icon: '🎟️', label: 'Cuota de entrada', value: '$10 por persona' },
            { icon: '🥇', label: '1er lugar',         value: '$250' },
            { icon: '🥈', label: '2do lugar',         value: '$50' },
            { icon: '🥉', label: '3er lugar',         value: '$20' },
          ].map(p => (
            <div key={p.label} style={{
              background: 'var(--surface)', border: '1px solid var(--surface2)',
              borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.icon} {p.label}</span>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800,
                fontSize: '1.1rem', color: 'var(--gold)',
              }}>{p.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 className="condensed" style={headingStyle}>Clasificación</h2>
        <p style={textStyle}>
          La pestaña <strong style={{ color: 'var(--text)' }}>Standings</strong> muestra la tabla de posiciones en tiempo real, actualizada automáticamente conforme llegan resultados. Los puntos de partidos y los de bonificación se suman en un total único.
        </p>
      </section>

      <section style={{ ...sectionStyle, marginBottom: 0 }}>
        <h2 className="condensed" style={headingStyle}>Consejos Rápidos</h2>
        <ul style={{ ...textStyle, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' }}>
          <li>Haz tus picks de bonificación pronto — se bloquean antes de lo que esperas.</li>
          <li>No olvides la pestaña del 3er Lugar para esa predicción extra.</li>
          <li>El marcador exacto (8 pts) es de alto riesgo y alta recompensa — apunta a él en partidos de eliminatoria cerrados.</li>
          <li>Los 16 picks de clasificados a Octavos son fáciles de olvidar y valen 2 pts cada uno — ¡llénalos todos!</li>
        </ul>
      </section>
    </div>
  );
}

function ScoreRow({ pts, label, desc }: { pts: number; label: string; desc: string }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--surface2)',
      borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
    }}>
      <span style={{
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800,
        fontSize: '1.1rem', color: 'var(--gold)', minWidth: '36px', textAlign: 'center' as const,
      }}>
        {pts}
      </span>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{desc}</div>
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '1.75rem',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  color: 'var(--gold)',
  marginBottom: '0.5rem',
  borderBottom: '1px solid var(--surface2)',
  paddingBottom: '0.25rem',
};

const textStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--text-dim)',
  lineHeight: 1.6,
};

const noteStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  background: 'rgba(240,165,0,0.07)',
  border: '1px solid rgba(240,165,0,0.2)',
  borderRadius: 'var(--radius)',
  padding: '0.4rem 0.75rem',
  fontSize: '0.78rem',
  color: 'var(--text-dim)',
};
