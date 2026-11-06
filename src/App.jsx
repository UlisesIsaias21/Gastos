import { useState, useEffect } from 'react'

const MES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIA = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const SC = { General:'🛒', Despensa:'🥦', Limpieza:'🧴', Salud:'💊', Personal:'👕', Hogar:'🏠', Otro:'✨' }
const EC = { 'Comida':'🍔', 'Bebidas/Antojos':'🥤', 'Gasolina/Transporte':'⛽', 'Ropa/Personal':'👕', 'Salud':'💊', 'Hogar':'🏠', 'Servicios':'💡', 'Ocio':'🎮', 'Otro':'✨' }
const MAP = { General:'Otro', Despensa:'Comida', Limpieza:'Hogar', Salud:'Salud', Personal:'Ropa/Personal', Hogar:'Hogar', Otro:'Otro' }
const KEY = 'admin-lgc-v1'

const money = n => 'MX$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
const load = () => { try { return { items: [], expenses: [], theme: 'dark', ...JSON.parse(localStorage.getItem(KEY)) } } catch { return { items: [], expenses: [], theme: 'dark' } } }

export default function App() {
  const [db, setDb] = useState(load)
  const [tab, setTab] = useState('hoy')
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)) } catch {}
    document.documentElement.dataset.theme = db.theme
  }, [db])

  const up = f => setDb(d => f(d))
  const act = {
    addItem: it => up(d => ({ ...d, items: [...d.items, { id: uid(), done: false, ...it }] })),
    editItem: (id, p) => up(d => {
      const items = d.items.map(i => (i.id === id ? { ...i, ...p } : i))
      const it = items.find(i => i.id === id)
      const expenses = d.expenses.map(e => e.itemId === id ? { ...e, amount: it.qty * it.price, note: it.name, cat: MAP[it.cat] } : e)
      return { ...d, items, expenses }
    }),
    delItem: id => up(d => ({ ...d, items: d.items.filter(i => i.id !== id) })),
    toggle: id => up(d => {
      const it = d.items.find(i => i.id === id)
      const done = !it.done
      let expenses = d.expenses.filter(e => e.itemId !== id)
      if (done && it.price > 0) expenses = [...expenses, { id: uid(), itemId: id, amount: it.qty * it.price, cat: MAP[it.cat], date: iso(new Date()), note: it.name }]
      return { ...d, expenses, items: d.items.map(i => (i.id === id ? { ...i, done } : i)) }
    }),
    addExp: e => up(d => ({ ...d, expenses: [...d.expenses, { id: uid(), ...e }] })),
    delExp: id => up(d => ({ ...d, expenses: d.expenses.filter(e => e.id !== id) })),
  }

  const now = new Date()
  const dark = db.theme === 'dark'
  return (
    <div className="app">
      <header className="top">
        <div className="top-in">
          <div className="brand">
            <div className="logo"><img src="/logo-u.png" alt="" /></div>
            <div><b>Admin</b><small>{'Lista & Gastos & Compras'}</small></div>
          </div>
          <div className="date">
            <span>{DIA[now.getDay()]}, {now.getDate()} de {MES[now.getMonth()]}</span>
            <button className={'sw' + (dark ? '' : ' on')} aria-label="Cambiar tema" onClick={() => up(d => ({ ...d, theme: dark ? 'light' : 'dark' }))}>
              <i>{dark ? '🌙' : '☀️'}</i>
            </button>
          </div>
        </div>
      </header>
      <nav className="tabs">
          {[['hoy', 'Notas'], ['gastos', 'Gastos'], ['despues', 'Después']].map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </nav>
      <main className="wrap">
        {tab === 'gastos' ? <Gastos db={db} act={act} /> : <Lista key={tab} list={tab} db={db} act={act} />}
      </main>
    </div>
  )
}

function ItemForm({ init, onSave, onCancel }) {
  const [f, setF] = useState({ name: '', qty: 1, price: '', cat: 'General', note: '', ...init })
  const s = k => e => setF({ ...f, [k]: e.target.value })
  const save = () => f.name.trim() && onSave({ ...f, name: f.name.trim(), qty: Math.max(1, +f.qty || 1), price: +f.price || 0 })
  return (
    <div className="card form">
      <input className="s2" autoFocus placeholder="¿Qué necesitas comprar?" value={f.name} onChange={s('name')} />
      <input type="number" min="1" inputMode="numeric" value={f.qty} onChange={s('qty')} />
      <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="Precio MX$" value={f.price} onChange={s('price')} />
      <select value={f.cat} onChange={s('cat')}>{Object.keys(SC).map(c => <option key={c} value={c}>{SC[c]} {c}</option>)}</select>
      <span className="hide-m" />
      <input className="s2" placeholder="Nota (opcional) — marca, tamaño, tienda..." value={f.note} onChange={s('note')} />
      <div className="acts s2">
        <button className="btn ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn" onClick={save}>Guardar artículo</button>
      </div>
    </div>
  )
}

function Lista({ list, db, act }) {
  const [form, setForm] = useState(null)
  const [showDone, setShowDone] = useState(false)
  const [quick, setQuick] = useState('')
  const hoy = list === 'hoy'
  const all = db.items.filter(i => i.list === list)
  const pend = all.filter(i => !i.done)
  const done = all.filter(i => i.done)
  const est = pend.reduce((s, i) => s + i.qty * i.price, 0)
  const pct = all.length ? Math.round((done.length / all.length) * 100) : 0

  const addQuick = e => {
    e.preventDefault()
    const name = quick.trim()
    if (!name) return alert('Escribe algo para anotar.')
  }

  const row = i => (
    <div key={i.id} className={'card item' + (i.done ? ' done' : '')}>
      <button className="chk" aria-label="Marcar comprado" onClick={() => act.toggle(i.id)}>{i.done && '✓'}</button>
      <div className="im">
        <b>{i.name}</b>
        <small>{SC[i.cat]} {i.cat}{i.qty > 1 ? ` · ${i.qty} pzas` : ''}{i.note ? ` · ${i.note}` : ''}</small>
      </div>
      {i.price > 0 && <span className="mono">{money(i.qty * i.price)}</span>}
      <div className="ia">
        <button title="Editar" onClick={() => setForm(i)}>✎</button>
        <button title={hoy ? 'Mover a Después' : 'Mover a Notas'} onClick={() => act.editItem(i.id, { list: hoy ? 'despues' : 'hoy' })}>⇄</button>
        <button title="Borrar" onClick={() => act.delItem(i.id)}>✕</button>
      </div>
    </div>
  )

  return (
    <section>
      <p className="eyebrow">Lista de compras</p>
      <h1>{hoy ? 'Notas' : 'Para comprar después'}</h1>
      <p className="lead">
        {hoy
          ? 'Anota al momento lo que se te ocurra comprar hoy.'
          : 'Cosas que no necesitas hoy, pero quieres tener anotadas para cuando salgas.'}
      </p>
      {hoy && (
        <>
          <form className="quick" onSubmit={addQuick}>
            <input
              value={quick}
              onChange={e => setQuick(e.target.value)}
              placeholder="¿Qué se te acaba de ocurrir?"
              enterKeyHint="done"
              autoComplete="off"
            />
            <button type="submit" className="btn" aria-label="Agregar nota">+</button>
          </form>
          <div className="stats">
            <div><small>Progreso</small><span className="mono big">{pct}%</span></div>
            <div><small>Comprados</small><span className="mono big">{done.length}/{all.length}</span></div>
            <div><small>Estimado</small><span className="mono big">{money(est)}</span></div>
          </div>
          <div className="track"><i style={{ width: pct + '%' }} /></div>
        </>
      )}
      <div className="bar">
        <span className="eyebrow">{hoy ? 'Mis notas' : 'Artículos'}</span>
        <button className="btn" onClick={() => setForm('new')}>+ Agregar artículo</button>
      </div>
      {form && (
        <ItemForm
          key={form.id || 'new'}
          init={form === 'new' ? {} : form}
          onCancel={() => setForm(null)}
          onSave={p => { form === 'new' ? act.addItem({ ...p, list }) : act.editItem(form.id, p); setForm(null) }}
        />
      )}
      {all.length === 0 ? (
        <div className="empty">
          <div>{hoy ? '📝' : '🗒️'}</div>
          <h3>{hoy ? 'Todavía no tienes notas' : 'Nada pendiente para después'}</h3>
          <p>{hoy ? 'Escribe arriba lo que se te ocurra y listo.' : 'Anota aquí lo que se te vaya ocurriendo.'}</p>
        </div>
      ) : (
        <div className="list">{pend.map(row)}</div>
      )}
      {done.length > 0 && (
        <>
          <button className="fold" onClick={() => setShowDone(!showDone)}>{showDone ? '▾' : '▸'} Comprados ({done.length})</button>
          {showDone && <div className="list">{done.map(row)}</div>}
        </>
      )}
    </section>
  )
}
function ExpForm({ onSave, onCancel }) {
  const [f, setF] = useState({ amount: '', cat: 'Comida', date: iso(new Date()), note: '' })
  const s = k => e => setF({ ...f, [k]: e.target.value })
  const save = () => {
  if (!f.name.trim()) return alert('Escribe qué necesitas comprar antes de guardar.')
  onSave({ ...f, name: f.name.trim(), qty: Math.max(1, +f.qty || 1), price: +f.price || 0 })
}
  return (
    <div className="card form">
      <input type="number" min="0" step="0.01" inputMode="decimal" autoFocus placeholder="Monto MX$" value={f.amount} onChange={s('amount')} />
      <input type="date" value={f.date} onChange={s('date')} />
      <select className="s2" value={f.cat} onChange={s('cat')}>{Object.keys(EC).map(c => <option key={c} value={c}>{EC[c]} {c}</option>)}</select>
      <input className="s2" placeholder="Nota (opcional)" value={f.note} onChange={s('note')} />
      <div className="acts s2">
        <button className="btn ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn" onClick={save}>Guardar gasto</button>
      </div>
    </div>
  )
}

const CatBars = ({ rows }) => rows.length === 0 ? <p className="mut">Sin gastos registrados en este periodo.</p> : rows.map(([c, v]) => (
  <div className="cat" key={c}>
    <span className="em">{EC[c] || '✨'}</span>
    <div className="cb">
      <div className="ct"><span>{c}</span><b className="mono">{money(v)}</b></div>
      <div className="tr"><i style={{ width: (v / rows[0][1]) * 100 + '%' }} /></div>
    </div>
  </div>
))

function Gastos({ db, act }) {
  const t = new Date()
  const [mode, setMode] = useState('mes')
  const [y, setY] = useState(t.getFullYear())
  const [m, setM] = useState(t.getMonth())
  const [form, setForm] = useState(false)

  const sum = a => a.reduce((s, e) => s + e.amount, 0)
  const byCat = a => { const o = {}; a.forEach(e => (o[e.cat] = (o[e.cat] || 0) + e.amount)); return Object.entries(o).sort((a, b) => b[1] - a[1]) }
  const inYear = db.expenses.filter(e => +e.date.slice(0, 4) === y)
  const inMonth = inYear.filter(e => +e.date.slice(5, 7) - 1 === m)
  const shift = n => { let nm = m + n, ny = y; if (nm < 0) { nm = 11; ny-- } if (nm > 11) { nm = 0; ny++ } setM(nm); setY(ny) }

  const total = sum(inMonth)
  const dim = new Date(y, m + 1, 0).getDate()
  const cur = y === t.getFullYear() && m === t.getMonth()
  const perDay = Array.from({ length: dim }, (_, i) => sum(inMonth.filter(e => +e.date.slice(8, 10) === i + 1)))
  const maxD = Math.max(...perDay, 0)
  const cats = byCat(inMonth)

  const yTotal = sum(inYear)
  const prev = sum(db.expenses.filter(e => +e.date.slice(0, 4) === y - 1))
  const diff = prev > 0 ? Math.round(((yTotal - prev) / prev) * 100) : null
  const perMonth = Array.from({ length: 12 }, (_, i) => sum(inYear.filter(e => +e.date.slice(5, 7) - 1 === i)))
  const maxM = Math.max(...perMonth, 0)
  const mAvg = yTotal / (y === t.getFullYear() ? t.getMonth() + 1 : 12)

  return (
    <section>
      <div className="head">
        <div>
          <p className="eyebrow">Control de gastos</p>
          <h1>{mode === 'mes' ? `${MES[m]} ${y}` : y}</h1>
        </div>
        <div className="seg">
          <button className={mode === 'mes' ? 'on' : ''} onClick={() => setMode('mes')}>Mes</button>
          <button className={mode === 'año' ? 'on' : ''} onClick={() => setMode('año')}>Año</button>
        </div>
      </div>

      {mode === 'mes' ? (
        <>
          <div className="nav">
            <button className="sq" onClick={() => shift(-1)} aria-label="Mes anterior">‹</button>
            <span className="serif">{MES[m]} {y}</span>
            <button className="sq" onClick={() => shift(1)} aria-label="Mes siguiente">›</button>
            <button className="link" onClick={() => setMode('año')}>Ver año completo →</button>
          </div>
          <div className="grid">
            <div className="card k"><small>Total del mes</small><span className="mono big">{money(total)}</span></div>
            <div className="card k"><small>Promedio diario</small><span className="mono big">{money(total / (cur ? t.getDate() : dim))}</span></div>
            <div className="card k"><small>Categoría principal</small><span className="big2">{cats[0] ? `${EC[cats[0][0]] || '✨'} ${cats[0][0]}` : '—'}</span></div>
          </div>
          <div className="two">
            <div className="card"><p className="eyebrow">Por categoría</p><CatBars rows={cats} /></div>
            <div className="card">
              <p className="eyebrow">Por día</p>
              <div className="days">
                {perDay.map((v, i) => (
                  <div className="dc" key={i} title={`Día ${i + 1}: ${money(v)}`}>
                    <i style={{ height: maxD ? Math.max((v / maxD) * 100, v ? 4 : 0) + '%' : 0 }} />
                    <span>{i === 0 || (i + 1) % 5 === 0 ? i + 1 : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bar">
            <span className="eyebrow">Movimientos</span>
            <button className="btn" onClick={() => setForm(true)}>+ Agregar gasto</button>
          </div>
          {form && <ExpForm onCancel={() => setForm(false)} onSave={e => { act.addExp(e); setForm(false) }} />}
          {inMonth.length === 0 ? <p className="mut">Aún no registras gastos en este mes.</p> : (
            <div className="list">
              {[...inMonth].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                <div className="card item" key={e.id}>
                  <span className="em">{EC[e.cat] || '✨'}</span>
                  <div className="im"><b>{e.note || e.cat}</b><small>{e.cat} · {+e.date.slice(8, 10)} de {MES[+e.date.slice(5, 7) - 1]}</small></div>
                  <span className="mono">{money(e.amount)}</span>
                  <div className="ia"><button title="Borrar" onClick={() => act.delExp(e.id)}>✕</button></div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="nav">
            <button className="sq" onClick={() => setY(y - 1)} aria-label="Año anterior">‹</button>
            <span className="serif">{y}</span>
            <button className="sq" onClick={() => setY(y + 1)} aria-label="Año siguiente">›</button>
          </div>
          <div className="grid">
            <div className="card k"><small>Total del año</small><span className="mono big">{money(yTotal)}</span></div>
            <div className="card k"><small>Vs. año anterior</small><span className={'mono big ' + (diff === null ? '' : diff > 0 ? 'up' : 'dn')}>{diff === null ? '—' : `${diff > 0 ? '▲' : '▼'} ${Math.abs(diff)}%`}</span></div>
            <div className="card k"><small>Promedio mensual</small><span className="mono big">{money(mAvg)}</span></div>
          </div>
          <div className="card">
            <p className="eyebrow">Gasto por mes — toca un mes para ver el detalle</p>
            <div className="days yr">
              {perMonth.map((v, i) => (
                <button className="dc" key={i} onClick={() => { setM(i); setMode('mes') }} title={money(v)}>
                  <i style={{ height: maxM ? Math.max((v / maxM) * 100, v ? 4 : 0) + '%' : 0 }} />
                  <span>{MES[i].slice(0, 3)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="card"><p className="eyebrow">Por categoría (año completo)</p><CatBars rows={byCat(inYear)} /></div>
        </>
      )}
    </section>
  )
}
