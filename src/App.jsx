import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxnrWL2IWP-fruqdXxuT7CoeZKnoFKlPCLyXAB1LWcxf04VgltRiYT9ABmExe2yWyKM/exec";

// ─── BITÁCORAS REGISTRY ──────────────────────────────────────────────────────
const BITACORAS_REGISTRY = [
  { tipo: "salida_emergencia", numero: "001", nombre: "Salida de Emergencia", descripcion: "Revisión de vías y salidas de emergencia", norma: "NOM-001-STPS-2008", tituloNorma: "Edificios, locales e instalaciones", frecuencia: "Semestral" },
  { tipo: "aire", numero: "001", nombre: "Aire Acondicionado", descripcion: "Mantenimiento del sistema de ventilación artificial", norma: "NOM-001-STPS-2008", tituloNorma: "Edificios, locales e instalaciones", frecuencia: "Anual" },
  { tipo: "ocular", numero: "001", nombre: "Verificación Ocular", descripcion: "Verificación ocular de centros de trabajo", norma: "NOM-001-STPS-2008", tituloNorma: "Edificios, locales e instalaciones", frecuencia: "Anual" },
  { tipo: "lavaojos", numero: "002", nombre: "Lavaojos de Emergencia", descripcion: "Inspección de lavaojos de emergencia", norma: "NOM-002-STPS-2010", tituloNorma: "Prevención y protección contra incendios", frecuencia: "Mensual" },
  { tipo: "kit_derrames", numero: "002", nombre: "Kit Antiderrames", descripcion: "Inspección del kit antiderrames", norma: "NOM-002-STPS-2010", tituloNorma: "Prevención y protección contra incendios", frecuencia: "Mensual" },
  { tipo: "detectores", numero: "002", nombre: "Detectores de Humo", descripcion: "Inspección de detectores de humo", norma: "NOM-002-STPS-2010", tituloNorma: "Prevención y protección contra incendios", frecuencia: "Mensual" },
  { tipo: "lamparas", numero: "002", nombre: "Lámparas de Emergencia", descripcion: "Inspección de lámparas de emergencia", norma: "NOM-002-STPS-2010", tituloNorma: "Prevención y protección contra incendios", frecuencia: "Mensual" },
  { tipo: "pallet", numero: "006", nombre: "Pallet Jack", descripcion: "Revisión mensual de pallet jack", norma: "NOM-006-STPS-2023", tituloNorma: "Almacenamiento y manejo de materiales", frecuencia: "Mensual" },
  { tipo: "estantes", numero: "006", nombre: "Estantes", descripcion: "Revisión de estantes y racks", norma: "NOM-006-STPS-2023", tituloNorma: "Almacenamiento y manejo de materiales", frecuencia: "Mensual" },
  { tipo: "montacargas", numero: "006", nombre: "Montacargas", descripcion: "Inspección preoperacional de montacargas", norma: "NOM-006-STPS-2023", tituloNorma: "Almacenamiento y manejo de materiales", frecuencia: "Diario" },
  { tipo: "escaleras", numero: "009", nombre: "Escaleras para Trabajos en Altura", descripcion: "Revisión de escaleras para trabajos en altura", norma: "NOM-009-STPS-2011", tituloNorma: "Trabajos en altura", frecuencia: "Mensual" },
  { tipo: "equipos", numero: "009", nombre: "Equipo para Trabajos en Altura", descripcion: "Revisión de equipos para trabajos en altura", norma: "NOM-009-STPS-2011", tituloNorma: "Trabajos en altura", frecuencia: "Diario" },
  { tipo: "compresor", numero: "020", nombre: "Bitácora de Compresor", descripcion: "Operación y revisión de recipientes sujetos a presión", norma: "NOM-020-STPS-2011", tituloNorma: "Recipientes sujetos a presión y calderas", frecuencia: "Diario" },
  { tipo: "mto_compresor", numero: "020", nombre: "Mantenimiento a Compresor", descripcion: "Mantenimiento de recipientes sujetos a presión", norma: "NOM-020-STPS-2011", tituloNorma: "Recipientes sujetos a presión y calderas", frecuencia: "Mensual" },
  { tipo: "personal_autorizado", numero: "030", nombre: "Personal Autorizado", descripcion: "Personal autorizado para trabajos de riesgo", norma: "NOM-030-STPS-2009", tituloNorma: "Servicios preventivos de seguridad y salud", frecuencia: "Anual" },
];

const FRECUENCIA_COLORS = {
  Diario: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/40" },
  "Cada uso": { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/40" },
  Semanal: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/40" },
  Mensual: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/40" },
  Trimestral: { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/40" },
  Semestral: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/40" },
  Anual: { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/40" },
};

// ─── SIGNATURE PAD ────────────────────────────────────────────────────────────
const SignaturePad = ({ onSave, onClear }) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [hasSig, setHasSig] = useState(false);
  const [saved, setSaved] = useState(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
    setSaved(false);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasSig(true);
  };

  const stopDraw = () => { isDrawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
    setSaved(false);
    onClear && onClear();
  };

  const saveSig = () => {
    if (!hasSig) return;
    const data = canvasRef.current.toDataURL("image/png");
    onSave(data);
    setSaved(true);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Firma Digital del Responsable</h3>
      <div className="relative rounded-xl border border-slate-700 overflow-hidden bg-slate-900/60">
        <canvas
          ref={canvasRef}
          width={800}
          height={160}
          className="w-full cursor-crosshair touch-none block"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasSig && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-slate-600 text-sm">Firme aquí</span>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={clearCanvas} className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-600">
          Limpiar
        </button>
        <button
          type="button"
          onClick={saveSig}
          disabled={!hasSig}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${saved ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/40" : "bg-blue-600/20 text-blue-400 border-blue-600/40 hover:bg-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed"}`}
        >
          {saved ? "✓ Firma Guardada" : "Guardar Firma"}
        </button>
      </div>
    </div>
  );
};

// ─── FORM FIELDS ─────────────────────────────────────────────────────────────
const Field = ({ label, children, required }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
      {label}{required && <span className="text-rose-400 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const Input = ({ id, type = "text", placeholder, required, value, onChange }) => (
  <input
    id={id}
    type={type}
    placeholder={placeholder}
    required={required}
    value={value}
    onChange={onChange}
    className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors"
  />
);

const Select = ({ id, options, value, onChange }) => (
  <select
    id={id}
    value={value}
    onChange={onChange}
    className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
  >
    <option value="">Seleccionar</option>
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

const Textarea = ({ id, placeholder, value, onChange, rows = 3 }) => (
  <textarea
    id={id}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-y transition-colors"
  />
);

const PO_OPTIONS = [
  { value: "P", label: "P – Cumple" },
  { value: "O", label: "O – No Cumple" },
];

const TableWrapper = ({ children }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-700/60">
    <table className="w-full border-collapse text-sm">{children}</table>
  </div>
);

const TH = ({ children, className = "" }) => (
  <th className={`px-3 py-2.5 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider bg-slate-800/80 border-b border-slate-700 whitespace-nowrap ${className}`}>
    {children}
  </th>
);

const TD = ({ children, className = "" }) => (
  <td className={`px-3 py-2 border-b border-slate-800 ${className}`}>{children}</td>
);

const CellInput = ({ value, onChange, type = "text", placeholder }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full min-w-[80px] bg-slate-900/40 border border-slate-700/60 rounded px-2 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
  />
);

const CellSelect = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full min-w-[80px] bg-slate-900/40 border border-slate-700/60 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
  >
    <option value="">-</option>
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

// ─── HOOKS ───────────────────────────────────────────────────────────────────
const useTableRows = (initialCount, createEmpty) => {
  const [rows, setRows] = useState(() => Array.from({ length: initialCount }, (_, i) => createEmpty(i)));
  const addRow = () => setRows((r) => [...r, createEmpty(r.length)]);
  const removeRow = () => setRows((r) => r.length > 1 ? r.slice(0, -1) : r);
  const updateRow = (idx, field, val) =>
    setRows((r) => r.map((row, i) => i === idx ? { ...row, [field]: val } : row));
  return { rows, addRow, removeRow, updateRow };
};

const useSig = () => {
  const [sig, setSig] = useState(null);
  return { sig, saveSig: setSig, clearSig: () => setSig(null) };
};

// ─── BITÁCORA: SALIDA DE EMERGENCIA ──────────────────────────────────────────
const VERIFICACIONES_SALIDA = [
  "La vía de salida es lo suficientemente ancha",
  "La vía de salida se encuentra protegida contra el paso de llamas y humo",
  "La vía de salida hacia el exterior es la más corta",
  "La vía de salida se encuentra libre de obstáculos",
  "La vía de salida no está obstruida o anulada",
  "La salida de emergencia cuenta con luces de emergencia",
  "La salida de emergencia cuenta con señalización adecuada",
  "El estado físico de la salida cuenta con buenas condiciones de seguridad",
  "La salida cuenta con fácil manejo de entrada y salida",
  "El señalamiento se encuentra en un punto de fácil visualización",
];

const BitacoraSalidaEmergencia = ({ onSubmit }) => {
  const [header, setHeader] = useState({ fecha: "", responsable: "", ubicacion: "" });
  const [items, setItems] = useState(() =>
    VERIFICACIONES_SALIDA.map((_, i) => ({ cumple: false, cantidad: "", obs: "" }))
  );
  const [obsGenerales, setObsGenerales] = useState("");
  const { sig, saveSig, clearSig } = useSig();

  const toggleCumple = (i) =>
    setItems((rows) => rows.map((r, idx) => idx === i ? { ...r, cumple: !r.cumple } : r));
  const updateItem = (i, field, val) =>
    setItems((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const handleSubmit = () => {
    if (!header.fecha || !header.responsable) return alert("Complete los campos obligatorios");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ header, items: items.map((it, i) => ({ verificacion: VERIFICACIONES_SALIDA[i], ...it })), obsGenerales, firma: sig });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Fecha de Inspección" required><Input id="fecha" type="date" value={header.fecha} onChange={(e) => setHeader({ ...header, fecha: e.target.value })} required /></Field>
        <Field label="Responsable" required><Input id="responsable" placeholder="Nombre completo" value={header.responsable} onChange={(e) => setHeader({ ...header, responsable: e.target.value })} required /></Field>
        <Field label="Área / Ubicación"><Input id="ubicacion" placeholder="Ubicación de la salida" value={header.ubicacion} onChange={(e) => setHeader({ ...header, ubicacion: e.target.value })} /></Field>
      </div>

      <TableWrapper>
        <thead>
          <tr>
            <TH className="w-8">#</TH>
            <TH>Verificación</TH>
            <TH className="text-center">Cumple</TH>
            <TH className="text-center">Cantidad</TH>
            <TH>Observaciones</TH>
          </tr>
        </thead>
        <tbody>
          {VERIFICACIONES_SALIDA.map((v, i) => (
            <tr key={i} className="hover:bg-slate-800/30">
              <TD><span className="text-slate-500 text-xs">{i + 1}</span></TD>
              <TD><span className="text-slate-300 text-xs">{v}</span></TD>
              <TD className="text-center">
                <button type="button" onClick={() => toggleCumple(i)} className={`w-10 h-5 rounded-full transition-colors relative ${items[i].cumple ? "bg-emerald-500" : "bg-slate-700"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${items[i].cumple ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </TD>
              <TD><CellInput type="number" value={items[i].cantidad} onChange={(e) => updateItem(i, "cantidad", e.target.value)} placeholder="0" /></TD>
              <TD><CellInput value={items[i].obs} onChange={(e) => updateItem(i, "obs", e.target.value)} placeholder="Observaciones" /></TD>
            </tr>
          ))}
        </tbody>
      </TableWrapper>

      <Field label="Observaciones Generales">
        <Textarea value={obsGenerales} onChange={(e) => setObsGenerales(e.target.value)} placeholder="Observaciones adicionales..." />
      </Field>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: AIRE ACONDICIONADO ─────────────────────────────────────────────
const BitacoraAire = ({ onSubmit }) => {
  const emptyRow = (i) => ({ id: i, no_id: "", tipo_equipo: "", capacidad: "", area: "", tipo_mto: "", preventivo: false, predictivo: false, correctivo: false, fecha: "", responsable: "", acciones: "" });
  const { rows, addRow, removeRow, updateRow } = useTableRows(4, emptyRow);
  const { sig, saveSig, clearSig } = useSig();

  const handleSubmit = () => {
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ rows, firma: sig });
  };

  return (
    <div className="space-y-6">
      <TableWrapper>
        <thead>
          <tr>
            <TH>No. ID</TH><TH>Tipo Equipo</TH><TH>Capacidad</TH><TH>Área</TH>
            <TH>Tipo Mto.</TH><TH className="text-center">Prev.</TH><TH className="text-center">Pred.</TH><TH className="text-center">Corr.</TH>
            <TH>Fecha</TH><TH>Responsable</TH><TH>Acciones Realizadas</TH>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="hover:bg-slate-800/30">
              <TD><CellInput value={r.no_id} onChange={(e) => updateRow(i, "no_id", e.target.value)} /></TD>
              <TD><CellInput value={r.tipo_equipo} onChange={(e) => updateRow(i, "tipo_equipo", e.target.value)} /></TD>
              <TD><CellInput value={r.capacidad} onChange={(e) => updateRow(i, "capacidad", e.target.value)} /></TD>
              <TD><CellInput value={r.area} onChange={(e) => updateRow(i, "area", e.target.value)} /></TD>
              <TD><CellInput value={r.tipo_mto} onChange={(e) => updateRow(i, "tipo_mto", e.target.value)} /></TD>
              {["preventivo", "predictivo", "correctivo"].map((f) => (
                <TD key={f} className="text-center">
                  <input type="checkbox" checked={r[f]} onChange={(e) => updateRow(i, f, e.target.checked)} className="w-4 h-4 accent-blue-500" />
                </TD>
              ))}
              <TD><CellInput type="date" value={r.fecha} onChange={(e) => updateRow(i, "fecha", e.target.value)} /></TD>
              <TD><CellInput value={r.responsable} onChange={(e) => updateRow(i, "responsable", e.target.value)} /></TD>
              <TD><CellInput value={r.acciones} onChange={(e) => updateRow(i, "acciones", e.target.value)} placeholder="Acciones..." /></TD>
            </tr>
          ))}
        </tbody>
      </TableWrapper>

      <div className="flex gap-3">
        <button type="button" onClick={addRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">+ Agregar fila</button>
        <button type="button" onClick={removeRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">− Eliminar fila</button>
      </div>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: VERIFICACIÓN OCULAR ───────────────────────────────────────────
const SECCIONES_OCULAR = [
  { titulo: "1. Señalamientos", items: ["Los señalamientos están visibles", "Se encuentran libres de obstrucciones", "Están colocados de manera segura", "Los señalamientos se encuentran en buen estado", "Los señalamientos son del tamaño adecuado", "Se identifican todas las áreas de riesgo"] },
  { titulo: "2. Salidas normales y de emergencia", items: ["Las puertas están libres de obstrucción", "Las puertas se encuentran en buen estado", "Cuentan con señalización de 'Salida de Emergencia'", "Se cuenta con punto de reunión correctamente señalizada"] },
  { titulo: "3. Pisos", items: ["Los pisos se encuentran en buen estado", "Se identifican los cambios de nivel", "Se encuentran libres de estancamientos de líquidos", "Son llanos en las vías de tránsito de personal", "Libres de riesgos"] },
  { titulo: "4. Diques de contención", items: ["Libre de obstrucciones", "Recubrimiento en buen estado", "Diques de contenido libres de químicos y sin agua"] },
  { titulo: "5. Paredes", items: ["Se mantienen con colores que eviten la reflexión de la luz", "Cuenta con señalización en las zonas de riesgo", "Se encuentran en buen estado", "Son utilizadas para soportar cargas sólo si fueron destinadas para estos fines"] },
  { titulo: "6. Orden y limpieza", items: ["Recipientes para basura y residuos", "Orden y limpieza de las áreas", "Pasillos libres de obstáculos", "Condiciones generales de comedor y baños"] },
  { titulo: "7. Cuartos / Tableros Eléctricos", items: ["Acceso restringido, limpio y ordenado", "Señalamientos visibles", "En buenas condiciones", "No se observan riesgos aparentes"] },
];

const BitacoraOcular = ({ onSubmit }) => {
  const [header, setHeader] = useState({ domicilio: "", responsable: "", puesto: "", causa: "", evento: "" });
  const [checks, setChecks] = useState(() => {
    const map = {};
    SECCIONES_OCULAR.forEach((s, si) => s.items.forEach((_, ii) => { map[`${si}_${ii}`] = ""; }));
    return map;
  });
  const [notas, setNotas] = useState(() => SECCIONES_OCULAR.map(() => ""));
  const { sig, saveSig, clearSig } = useSig();

  const setCheck = (key, val) => setChecks((c) => ({ ...c, [key]: val }));

  const counts = () => {
    let si = 0, no = 0, na = 0;
    Object.values(checks).forEach((v) => { if (v === "si") si++; else if (v === "no") no++; else if (v === "na") na++; });
    return { si, no, na };
  };
  const { si, no, na } = counts();

  const handleSubmit = () => {
    if (!header.responsable) return alert("Complete los campos obligatorios");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ header, checks, notas, firma: sig });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Domicilio"><Input value={header.domicilio} onChange={(e) => setHeader({ ...header, domicilio: e.target.value })} placeholder="Domicilio del centro de trabajo" /></Field>
        <Field label="Responsable" required><Input value={header.responsable} onChange={(e) => setHeader({ ...header, responsable: e.target.value })} placeholder="Nombre del responsable" required /></Field>
        <Field label="Puesto"><Input value={header.puesto} onChange={(e) => setHeader({ ...header, puesto: e.target.value })} placeholder="Puesto del responsable" /></Field>
        <Field label="Causa de la inspección"><Input value={header.causa} onChange={(e) => setHeader({ ...header, causa: e.target.value })} placeholder="Motivo de la inspección" /></Field>
        <Field label="Tipo de evento extraordinario"><Input value={header.evento} onChange={(e) => setHeader({ ...header, evento: e.target.value })} placeholder="Si aplica" /></Field>
      </div>

      {SECCIONES_OCULAR.map((sec, si_idx) => (
        <div key={si_idx} className="bg-slate-800/30 rounded-xl border border-slate-700/60 overflow-hidden">
          <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-700/60">
            <h4 className="text-sm font-semibold text-slate-200">{sec.titulo}</h4>
          </div>
          <TableWrapper>
            <thead>
              <tr>
                <TH>Condición</TH>
                <TH className="text-center w-16">Sí</TH>
                <TH className="text-center w-16">No</TH>
                <TH className="text-center w-16">N.A.</TH>
              </tr>
            </thead>
            <tbody>
              {sec.items.map((item, ii) => {
                const key = `${si_idx}_${ii}`;
                return (
                  <tr key={ii} className="hover:bg-slate-800/30">
                    <TD><span className="text-slate-300 text-xs">{item}</span></TD>
                    {["si", "no", "na"].map((v) => (
                      <TD key={v} className="text-center">
                        <input type="radio" name={key} value={v} checked={checks[key] === v} onChange={() => setCheck(key, v)} className="w-4 h-4 accent-blue-500" />
                      </TD>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </TableWrapper>
          <div className="px-4 py-3">
            <Textarea value={notas[si_idx]} onChange={(e) => { const n = [...notas]; n[si_idx] = e.target.value; setNotas(n); }} placeholder="Condiciones detectadas / reparaciones necesarias..." rows={2} />
          </div>
        </div>
      ))}

      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Total Sí", val: si, color: "text-emerald-400" }, { label: "Total No", val: no, color: "text-rose-400" }, { label: "Total N.A.", val: na, color: "text-blue-400" }].map(({ label, val, color }) => (
          <div key={label} className="bg-slate-800/40 rounded-xl p-4 text-center border border-slate-700/60">
            <div className={`text-3xl font-bold ${color}`}>{val}</div>
            <div className="text-xs text-slate-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: LAVAOJOS ───────────────────────────────────────────────────────
const BitacoraLavaojos = ({ onSubmit }) => {
  const emptyRow = (i) => ({ id: i, fecha: "", liquido: "", senaletica: "", presion: "", soporte: "", estado: "", obs: "" });
  const { rows, addRow, removeRow, updateRow } = useTableRows(4, emptyRow);
  const [responsable, setResponsable] = useState("");
  const { sig, saveSig, clearSig } = useSig();

  const handleSubmit = () => {
    if (!responsable) return alert("Ingrese el nombre del responsable");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ rows, responsable, firma: sig });
  };

  return (
    <div className="space-y-6">
      <TableWrapper>
        <thead>
          <tr>
            <TH>Fecha</TH>
            <TH>Líq. Lavador</TH>
            <TH>Señalética</TH>
            <TH>Presión/Flujo</TH>
            <TH>Soporte</TH>
            <TH>Estado Físico</TH>
            <TH>Observaciones</TH>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="hover:bg-slate-800/30">
              <TD><CellInput type="date" value={r.fecha} onChange={(e) => updateRow(i, "fecha", e.target.value)} /></TD>
              {["liquido", "senaletica", "presion", "soporte", "estado"].map((f) => (
                <TD key={f}><CellSelect value={r[f]} onChange={(e) => updateRow(i, f, e.target.value)} options={PO_OPTIONS} /></TD>
              ))}
              <TD><CellInput value={r.obs} onChange={(e) => updateRow(i, "obs", e.target.value)} placeholder="Observaciones" /></TD>
            </tr>
          ))}
        </tbody>
      </TableWrapper>

      <div className="flex gap-3">
        <button type="button" onClick={addRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">+ Agregar fila</button>
        <button type="button" onClick={removeRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">− Eliminar fila</button>
      </div>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 flex items-center gap-4 text-xs text-slate-400">
        <span><strong className="text-emerald-400">P</strong> = Cumple condiciones adecuadas</span>
        <span><strong className="text-rose-400">O</strong> = No cumple condiciones adecuadas</span>
      </div>

      <Field label="Responsable de Ejecución" required>
        <Input value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre completo" required />
      </Field>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: KIT DERRAMES ───────────────────────────────────────────────────
const BitacoraKitDerrames = ({ onSubmit }) => {
  const emptyRow = (i) => ({ id: i, fecha: "", tarima: "", toallas: "", aserin: "", equipo: "", obs: "" });
  const { rows, addRow, removeRow, updateRow } = useTableRows(4, emptyRow);
  const [responsable, setResponsable] = useState({ nombre: "", puesto: "" });
  const { sig, saveSig, clearSig } = useSig();

  const handleSubmit = () => {
    if (!responsable.nombre) return alert("Ingrese el nombre del responsable");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ rows, responsable, firma: sig });
  };

  return (
    <div className="space-y-6">
      <TableWrapper>
        <thead>
          <tr>
            <TH>Fecha</TH>
            <TH>Tarima Almacenadora</TH>
            <TH>Toallas Absorbentes</TH>
            <TH>Aserrín</TH>
            <TH>Equipo Manual</TH>
            <TH>Observaciones</TH>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="hover:bg-slate-800/30">
              <TD><CellInput type="date" value={r.fecha} onChange={(e) => updateRow(i, "fecha", e.target.value)} /></TD>
              {["tarima", "toallas", "aserin", "equipo"].map((f) => (
                <TD key={f}><CellSelect value={r[f]} onChange={(e) => updateRow(i, f, e.target.value)} options={PO_OPTIONS} /></TD>
              ))}
              <TD><CellInput value={r.obs} onChange={(e) => updateRow(i, "obs", e.target.value)} placeholder="Observaciones" /></TD>
            </tr>
          ))}
        </tbody>
      </TableWrapper>

      <div className="flex gap-3">
        <button type="button" onClick={addRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">+ Agregar fila</button>
        <button type="button" onClick={removeRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">− Eliminar fila</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre del Responsable" required>
          <Input value={responsable.nombre} onChange={(e) => setResponsable({ ...responsable, nombre: e.target.value })} placeholder="Nombre completo" required />
        </Field>
        <Field label="Puesto">
          <Input value={responsable.puesto} onChange={(e) => setResponsable({ ...responsable, puesto: e.target.value })} placeholder="Puesto del responsable" />
        </Field>
      </div>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: DETECTORES DE HUMO ────────────────────────────────────────────
const BitacoraDetectores = ({ onSubmit }) => {
  const emptyRow = (i) => ({ id: i, fecha: "", no_detector: "", ubicacion: "", revision: "", alarma: "", fecha_remplazo: "", panel: "", obs: "", reviso: false });
  const { rows, addRow, removeRow, updateRow } = useTableRows(5, emptyRow);
  const [responsable, setResponsable] = useState({ nombre: "", puesto: "" });
  const { sig, saveSig, clearSig } = useSig();

  const handleSubmit = () => {
    if (!responsable.nombre) return alert("Ingrese el nombre del responsable");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ rows, responsable, firma: sig });
  };

  return (
    <div className="space-y-6">
      <TableWrapper>
        <thead>
          <tr>
            <TH>Fecha</TH><TH>No. Detector</TH><TH>Ubicación</TH><TH>Rev. Visual</TH>
            <TH>Alarma Sonora</TH><TH>Fecha Remplazo</TH><TH>Panel Control</TH><TH>Observaciones</TH><TH className="text-center">Revisó</TH>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="hover:bg-slate-800/30">
              <TD><CellInput type="date" value={r.fecha} onChange={(e) => updateRow(i, "fecha", e.target.value)} /></TD>
              <TD><CellInput value={r.no_detector} onChange={(e) => updateRow(i, "no_detector", e.target.value)} placeholder="No." /></TD>
              <TD><CellInput value={r.ubicacion} onChange={(e) => updateRow(i, "ubicacion", e.target.value)} placeholder="Ubicación" /></TD>
              {["revision", "alarma", "panel"].map((f) => (
                <TD key={f}><CellSelect value={r[f]} onChange={(e) => updateRow(i, f, e.target.value)} options={PO_OPTIONS} /></TD>
              ))}
              <TD><CellInput type="date" value={r.fecha_remplazo} onChange={(e) => updateRow(i, "fecha_remplazo", e.target.value)} /></TD>
              <TD><CellInput value={r.obs} onChange={(e) => updateRow(i, "obs", e.target.value)} placeholder="Observaciones" /></TD>
              <TD className="text-center"><input type="checkbox" checked={r.reviso} onChange={(e) => updateRow(i, "reviso", e.target.checked)} className="w-4 h-4 accent-blue-500" /></TD>
            </tr>
          ))}
        </tbody>
      </TableWrapper>

      <div className="flex gap-3">
        <button type="button" onClick={addRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">+ Agregar fila</button>
        <button type="button" onClick={removeRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">− Eliminar fila</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre del Responsable" required>
          <Input value={responsable.nombre} onChange={(e) => setResponsable({ ...responsable, nombre: e.target.value })} placeholder="Nombre completo" required />
        </Field>
        <Field label="Puesto">
          <Input value={responsable.puesto} onChange={(e) => setResponsable({ ...responsable, puesto: e.target.value })} placeholder="Puesto del responsable" />
        </Field>
      </div>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: LÁMPARAS DE EMERGENCIA ────────────────────────────────────────
const BitacoraLamparas = ({ onSubmit }) => {
  const emptyRow = (i) => ({ id: i, ubicacion: "", pila: "", prueba: "", conexiones: "", limpia: "", focos: "", obs: "" });
  const { rows, addRow, removeRow, updateRow } = useTableRows(4, emptyRow);
  const [meta, setMeta] = useState({ responsable: "", puesto: "", mes: "", fecha: "" });
  const { sig, saveSig, clearSig } = useSig();

  const handleSubmit = () => {
    if (!meta.responsable) return alert("Ingrese el nombre del responsable");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ rows, meta, firma: sig });
  };

  return (
    <div className="space-y-6">
      <TableWrapper>
        <thead>
          <tr>
            <TH className="w-8">#</TH><TH>Ubicación</TH><TH>Pila Buen Estado</TH><TH>Prueba Enc/Ap</TH>
            <TH>Conexiones</TH><TH>Limpia</TH><TH>Focos</TH><TH>Obs / Acción Correctiva</TH>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="hover:bg-slate-800/30">
              <TD><span className="text-slate-500 text-xs font-bold">{i + 1}</span></TD>
              <TD><CellInput value={r.ubicacion} onChange={(e) => updateRow(i, "ubicacion", e.target.value)} placeholder="Ubicación" /></TD>
              {["pila", "prueba", "conexiones", "limpia", "focos"].map((f) => (
                <TD key={f}><CellSelect value={r[f]} onChange={(e) => updateRow(i, f, e.target.value)} options={PO_OPTIONS} /></TD>
              ))}
              <TD><CellInput value={r.obs} onChange={(e) => updateRow(i, "obs", e.target.value)} placeholder="Observación..." /></TD>
            </tr>
          ))}
        </tbody>
      </TableWrapper>

      <div className="flex gap-3">
        <button type="button" onClick={addRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">+ Agregar fila</button>
        <button type="button" onClick={removeRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">− Eliminar fila</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Responsable" required><Input value={meta.responsable} onChange={(e) => setMeta({ ...meta, responsable: e.target.value })} placeholder="Nombre completo" required /></Field>
        <Field label="Puesto"><Input value={meta.puesto} onChange={(e) => setMeta({ ...meta, puesto: e.target.value })} placeholder="Puesto" /></Field>
        <Field label="Mes de Inspección"><Input type="month" value={meta.mes} onChange={(e) => setMeta({ ...meta, mes: e.target.value })} /></Field>
        <Field label="Fecha de Inspección"><Input type="date" value={meta.fecha} onChange={(e) => setMeta({ ...meta, fecha: e.target.value })} /></Field>
      </div>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: PALLET JACK ────────────────────────────────────────────────────
const BitacoraPallet = ({ onSubmit }) => {
  const emptyRow = (i) => ({ id: i, serie: "", fecha: "", c1: "", c2: "", c3: "", c4: "", c5: "", c6: "", c7: "", c8: "", obs: "" });
  const { rows, addRow, removeRow, updateRow } = useTableRows(6, emptyRow);
  const [meta, setMeta] = useState({ responsable: "", supervisor: "", mes: "", area: "" });
  const { sig, saveSig, clearSig } = useSig();

  const cols = [
    "Estructura General", "Prueba Velocidad", "Ruedas/Rodillos",
    "Mecanismo Elevación", "Frenos", "Señalización",
    "Aceite Hidráulico", "Estado Horquillas"
  ];

  const handleSubmit = () => {
    if (!meta.responsable) return alert("Ingrese el nombre del responsable");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ rows, meta, firma: sig });
  };

  return (
    <div className="space-y-6">
      <TableWrapper>
        <thead>
          <tr>
            <TH className="w-8">#</TH><TH>Serie</TH><TH>Fecha</TH>
            {cols.map((c) => <TH key={c}>{c}</TH>)}
            <TH>Observaciones</TH>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="hover:bg-slate-800/30">
              <TD><span className="text-slate-500 text-xs font-bold">{i + 1}</span></TD>
              <TD><CellInput value={r.serie} onChange={(e) => updateRow(i, "serie", e.target.value)} placeholder="Serie" /></TD>
              <TD><CellInput type="date" value={r.fecha} onChange={(e) => updateRow(i, "fecha", e.target.value)} /></TD>
              {["c1","c2","c3","c4","c5","c6","c7","c8"].map((f) => (
                <TD key={f}><CellSelect value={r[f]} onChange={(e) => updateRow(i, f, e.target.value)} options={PO_OPTIONS} /></TD>
              ))}
              <TD><CellInput value={r.obs} onChange={(e) => updateRow(i, "obs", e.target.value)} placeholder="Observaciones" /></TD>
            </tr>
          ))}
        </tbody>
      </TableWrapper>

      <div className="flex gap-3">
        <button type="button" onClick={addRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">+ Agregar equipo</button>
        <button type="button" onClick={removeRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">− Eliminar último</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Responsable" required><Input value={meta.responsable} onChange={(e) => setMeta({ ...meta, responsable: e.target.value })} placeholder="Nombre del inspector" required /></Field>
        <Field label="Supervisor"><Input value={meta.supervisor} onChange={(e) => setMeta({ ...meta, supervisor: e.target.value })} placeholder="Nombre del supervisor" /></Field>
        <Field label="Mes de Inspección"><Input type="month" value={meta.mes} onChange={(e) => setMeta({ ...meta, mes: e.target.value })} /></Field>
        <Field label="Área / Departamento"><Input value={meta.area} onChange={(e) => setMeta({ ...meta, area: e.target.value })} placeholder="Área o departamento" /></Field>
      </div>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: ESTANTES ───────────────────────────────────────────────────────
const BitacoraEstantes = ({ onSubmit }) => {
  const emptyRow = (i) => ({ id: i, ubicacion: "", fecha: "", estado_carga: "", trabajo_carga: "", orden: "", cantidad_pesos: "", distribucion: "", anclajes: "", obs: "" });
  const { rows, addRow, removeRow, updateRow } = useTableRows(5, emptyRow);
  const [meta, setMeta] = useState({ responsable: "", supervisor: "", mes: "", area: "" });
  const { sig, saveSig, clearSig } = useSig();

  const handleSubmit = () => {
    if (!meta.responsable) return alert("Ingrese el nombre del responsable");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ rows, meta, firma: sig });
  };

  return (
    <div className="space-y-6">
      <TableWrapper>
        <thead>
          <tr>
            <TH className="w-8">#</TH><TH>Ubicación / No. ID</TH><TH>Fecha</TH>
            <TH>Estado/Carga</TH><TH>Trabajo Carga</TH><TH>Orden/Limpieza</TH>
            <TH>Pesos/Niveles</TH><TH>Barras Arriostre</TH><TH>Anclajes</TH><TH>Observaciones</TH>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="hover:bg-slate-800/30">
              <TD><span className="text-slate-500 text-xs font-bold">{i + 1}</span></TD>
              <TD><CellInput value={r.ubicacion} onChange={(e) => updateRow(i, "ubicacion", e.target.value)} placeholder="Ubicación y No." /></TD>
              <TD><CellInput type="date" value={r.fecha} onChange={(e) => updateRow(i, "fecha", e.target.value)} /></TD>
              {["estado_carga","trabajo_carga","orden","cantidad_pesos","distribucion","anclajes"].map((f) => (
                <TD key={f}><CellSelect value={r[f]} onChange={(e) => updateRow(i, f, e.target.value)} options={PO_OPTIONS} /></TD>
              ))}
              <TD><CellInput value={r.obs} onChange={(e) => updateRow(i, "obs", e.target.value)} placeholder="Observaciones" /></TD>
            </tr>
          ))}
        </tbody>
      </TableWrapper>

      <div className="flex gap-3">
        <button type="button" onClick={addRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">+ Agregar estante</button>
        <button type="button" onClick={removeRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">− Eliminar último</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Responsable" required><Input value={meta.responsable} onChange={(e) => setMeta({ ...meta, responsable: e.target.value })} required placeholder="Inspector" /></Field>
        <Field label="Supervisor"><Input value={meta.supervisor} onChange={(e) => setMeta({ ...meta, supervisor: e.target.value })} placeholder="Supervisor" /></Field>
        <Field label="Mes"><Input type="month" value={meta.mes} onChange={(e) => setMeta({ ...meta, mes: e.target.value })} /></Field>
        <Field label="Área / Almacén"><Input value={meta.area} onChange={(e) => setMeta({ ...meta, area: e.target.value })} placeholder="Área inspeccionada" /></Field>
      </div>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: MONTACARGAS ────────────────────────────────────────────────────
const MONTACARGAS_ITEMS = [
  { cat: "Parte Externa", items: ["Espejos laterales", "Limpieza general", "Luces traseras", "Alarma de reversa", "Extintor", "Llantas", "Placa de montacargas", "Cilindros de elevación e inclinación"] },
  { cat: "Compartimiento del Motor", items: ["Fuente de energía", "Conexiones eléctricas", "Refrigeración/mangueras", "Líneas hidráulicas", "Niveles de aceite", "Cableado eléctrico", "Botella de dirección"] },
  { cat: "Interior de la Cabina", items: ["Espejos retrovisor", "Vidrios/parabrisas", "Limpiador parabrisas", "Estado de la cabina", "Indicador combustible", "Indicador presión aceite", "Sillas/apoyo cabeza", "Pedales", "Cinturones de seguridad", "Claxon", "Timón/volante", "Frenos", "Horómetro"] },
];

const DIAS = ["LUN", "MAR", "MIER", "JUE", "VIER", "SAB", "DOM"];

const BitacoraMontacargas = ({ onSubmit }) => {
  const [meta, setMeta] = useState({ inspector: "", supervisor: "", mes: "", marca: "", serie: "", semana_ini: "", semana_fin: "" });
  const allItems = MONTACARGAS_ITEMS.flatMap((c) => c.items.map((it) => ({ cat: c.cat, item: it })));
  const [checks, setChecks] = useState(() => {
    const m = {};
    allItems.forEach((_, i) => DIAS.forEach((_, d) => { m[`${i}_${d}`] = ""; }));
    return m;
  });
  const [obs, setObs] = useState("");
  const { sig, saveSig, clearSig } = useSig();

  const setCheck = (key, val) => setChecks((c) => ({ ...c, [key]: val }));

  const handleSubmit = () => {
    if (!meta.inspector) return alert("Ingrese el nombre del inspector");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ meta, checks, obs, firma: sig });
  };

  let globalIdx = 0;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Inspector" required><Input value={meta.inspector} onChange={(e) => setMeta({ ...meta, inspector: e.target.value })} placeholder="Nombre" required /></Field>
        <Field label="Supervisor"><Input value={meta.supervisor} onChange={(e) => setMeta({ ...meta, supervisor: e.target.value })} placeholder="Nombre" /></Field>
        <Field label="Mes"><Input type="month" value={meta.mes} onChange={(e) => setMeta({ ...meta, mes: e.target.value })} /></Field>
        <Field label="Marca"><Input value={meta.marca} onChange={(e) => setMeta({ ...meta, marca: e.target.value })} placeholder="Marca del montacargas" /></Field>
        <Field label="Serie / Placa"><Input value={meta.serie} onChange={(e) => setMeta({ ...meta, serie: e.target.value })} placeholder="No. de serie" /></Field>
        <Field label="Semana Inicio"><Input type="date" value={meta.semana_ini} onChange={(e) => setMeta({ ...meta, semana_ini: e.target.value })} /></Field>
        <Field label="Semana Fin"><Input type="date" value={meta.semana_fin} onChange={(e) => setMeta({ ...meta, semana_fin: e.target.value })} /></Field>
      </div>

      {MONTACARGAS_ITEMS.map((sec) => (
        <div key={sec.cat} className="bg-slate-800/30 rounded-xl border border-slate-700/60 overflow-hidden">
          <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-700/60">
            <h4 className="text-sm font-semibold text-slate-200">{sec.cat}</h4>
          </div>
          <TableWrapper>
            <thead>
              <tr>
                <TH>Elemento</TH>
                {DIAS.map((d) => (
                  <TH key={d} className="text-center">
                    <div className="text-center">{d}</div>
                    <div className="flex justify-center gap-2 text-[10px] font-normal mt-0.5">
                      <span className="text-emerald-400">S</span>
                      <span className="text-rose-400">N</span>
                      <span className="text-blue-400">C</span>
                    </div>
                  </TH>
                ))}
              </tr>
            </thead>
            <tbody>
              {sec.items.map((item) => {
                const idx = globalIdx++;
                return (
                  <tr key={item} className="hover:bg-slate-800/30">
                    <TD><span className="text-slate-300 text-xs">{item}</span></TD>
                    {DIAS.map((_, d) => {
                      const key = `${idx}_${d}`;
                      return (
                        <TD key={d} className="text-center">
                          <div className="flex justify-center gap-2">
                            {["S", "N", "C"].map((v) => (
                              <input key={v} type="radio" name={key} value={v} checked={checks[key] === v} onChange={() => setCheck(key, v)} className="w-3 h-3 accent-blue-500" />
                            ))}
                          </div>
                        </TD>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </TableWrapper>
        </div>
      ))}

      <Field label="Recomendaciones / Observaciones">
        <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observaciones de la inspección..." rows={3} />
      </Field>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <div className="flex items-center gap-6 text-xs text-slate-400 mb-4">
          <span><strong className="text-emerald-400">S</strong> = Sí Cumple</span>
          <span><strong className="text-rose-400">N</strong> = No Cumple</span>
          <span><strong className="text-blue-400">C</strong> = No Aplica</span>
        </div>
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: ESCALERAS ──────────────────────────────────────────────────────
const ESTADO_OPTIONS = [
  { value: "B", label: "B – Bien" },
  { value: "M", label: "M – Mal" },
  { value: "R", label: "R – Repone" },
  { value: "C", label: "C – Cambio" },
  { value: "N", label: "N – Nuevo" },
  { value: "SC", label: "SC – Sucia" },
  { value: "S", label: "S – 1ª vez" },
];

const ITEMS_ESCALERA = [
  "Zapatas, pistas, cieladas", "Planos verticales, bordes", "Escalones, pistas, pasamanos",
  "Torno superior, barandales", "Torno inferior, base, suelo", "Frecuencia de uso",
  "Limpieza general", "Aseguramiento de material", "Estado general", "Eliminación de obstáculos",
  "Soporte estructural", "Cuadro superior", "Cuadro inferior",
  "Obturaciones superiores", "Obturaciones medias", "Obturaciones inferiores",
  "Obturaciones laterales", "Obturaciones de seguridad", "Observaciones generales", "No. TAG y Ubicación",
];

const BitacoraEscaleras = ({ onSubmit }) => {
  const emptyRow = (i) => ({ id: i, elemento: ITEMS_ESCALERA[i] || `Elemento ${i + 1}`, estado: "", obs: "", fecha: "", reviso: false });
  const { rows, addRow, removeRow, updateRow } = useTableRows(ITEMS_ESCALERA.length, emptyRow);
  const [meta, setMeta] = useState({ responsable: "", ubicacion: "", tag: "", tipo: "" });
  const { sig, saveSig, clearSig } = useSig();

  const handleSubmit = () => {
    if (!meta.responsable) return alert("Ingrese el nombre del responsable");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ rows, meta, firma: sig });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Responsable" required><Input value={meta.responsable} onChange={(e) => setMeta({ ...meta, responsable: e.target.value })} placeholder="Inspector" required /></Field>
        <Field label="Ubicación"><Input value={meta.ubicacion} onChange={(e) => setMeta({ ...meta, ubicacion: e.target.value })} placeholder="Área o ubicación" /></Field>
        <Field label="No. TAG / ID"><Input value={meta.tag} onChange={(e) => setMeta({ ...meta, tag: e.target.value })} placeholder="Identificación" /></Field>
        <Field label="Tipo de Escalera">
          <Select value={meta.tipo} onChange={(e) => setMeta({ ...meta, tipo: e.target.value })} options={[{ value: "fija", label: "Fija" }, { value: "portatil", label: "Portátil" }, { value: "extension", label: "Extensión" }, { value: "tijera", label: "Tijera" }, { value: "caracol", label: "Caracol/Espiral" }]} />
        </Field>
      </div>

      <TableWrapper>
        <thead>
          <tr>
            <TH className="w-8">#</TH>
            <TH>Elemento de Revisión</TH>
            <TH>Estado Actual</TH>
            <TH>Observaciones</TH>
            <TH>Fecha Revisión</TH>
            <TH className="text-center">Revisó</TH>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="hover:bg-slate-800/30">
              <TD><span className="text-slate-500 text-xs font-bold">{i + 1}</span></TD>
              <TD><span className="text-slate-300 text-xs">{r.elemento}</span></TD>
              <TD><CellSelect value={r.estado} onChange={(e) => updateRow(i, "estado", e.target.value)} options={ESTADO_OPTIONS} /></TD>
              <TD><CellInput value={r.obs} onChange={(e) => updateRow(i, "obs", e.target.value)} placeholder="Observaciones" /></TD>
              <TD><CellInput type="date" value={r.fecha} onChange={(e) => updateRow(i, "fecha", e.target.value)} /></TD>
              <TD className="text-center"><input type="checkbox" checked={r.reviso} onChange={(e) => updateRow(i, "reviso", e.target.checked)} className="w-4 h-4 accent-blue-500" /></TD>
            </tr>
          ))}
        </tbody>
      </TableWrapper>

      <div className="flex gap-3">
        <button type="button" onClick={addRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">+ Agregar elemento</button>
        <button type="button" onClick={removeRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">− Eliminar último</button>
      </div>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: EQUIPOS PARA TRABAJOS EN ALTURA ───────────────────────────────
const EQUIPOS_ALTURA = [
  { id: "arnes", desc: "Arnés de Seguridad", tipo: "Personal" },
  { id: "casco", desc: "Casco de Seguridad", tipo: "Personal" },
  { id: "linea_vida", desc: "Línea de Vida", tipo: "Colectivo" },
  { id: "eslingas", desc: "Eslingas y Cables", tipo: "Personal" },
  { id: "mosqueton", desc: "Mosquetones y Conectores", tipo: "Personal" },
  { id: "disipador", desc: "Disipador de Energía", tipo: "Personal" },
  { id: "andamio", desc: "Andamio", tipo: "Colectivo" },
  { id: "plataforma", desc: "Plataforma Elevadora", tipo: "Colectivo" },
  { id: "escalera_p", desc: "Escalera Portátil", tipo: "Acceso" },
  { id: "cuerdas", desc: "Cuerdas de Seguridad", tipo: "Personal" },
  { id: "barandales", desc: "Barandales de Protección", tipo: "Colectivo" },
  { id: "red", desc: "Red de Seguridad", tipo: "Colectivo" },
  { id: "botas", desc: "Botas Antideslizantes", tipo: "Personal" },
  { id: "kit_rescate", desc: "Kit de Rescate en Altura", tipo: "Emergencia" },
];

const TIPO_COLORS = { Personal: "text-emerald-400", Colectivo: "text-blue-400", Acceso: "text-violet-400", Emergencia: "text-orange-400" };

const BitacoraEquiposAltura = ({ onSubmit }) => {
  const [rows, setRows] = useState(() =>
    EQUIPOS_ALTURA.map((e) => ({ ...e, estado: "", serie: "", obs: "", proxima: "", verificado: false }))
  );
  const [meta, setMeta] = useState({ responsable: "", supervisor: "", fecha: "", area: "" });
  const { sig, saveSig, clearSig } = useSig();

  const updateRow = (i, field, val) =>
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const handleSubmit = () => {
    if (!meta.responsable) return alert("Ingrese el nombre del responsable");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ rows, meta, firma: sig });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Responsable" required><Input value={meta.responsable} onChange={(e) => setMeta({ ...meta, responsable: e.target.value })} placeholder="Inspector" required /></Field>
        <Field label="Supervisor"><Input value={meta.supervisor} onChange={(e) => setMeta({ ...meta, supervisor: e.target.value })} placeholder="Supervisor" /></Field>
        <Field label="Fecha de Revisión"><Input type="date" value={meta.fecha} onChange={(e) => setMeta({ ...meta, fecha: e.target.value })} /></Field>
        <Field label="Área de Trabajo"><Input value={meta.area} onChange={(e) => setMeta({ ...meta, area: e.target.value })} placeholder="Área de trabajo" /></Field>
      </div>

      <TableWrapper>
        <thead>
          <tr>
            <TH className="w-8">#</TH><TH>Equipo</TH><TH>Tipo</TH><TH>Estado</TH>
            <TH>No. Serie</TH><TH>Observaciones</TH><TH>Próxima Revisión</TH><TH className="text-center">Verificado</TH>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="hover:bg-slate-800/30">
              <TD><span className="text-slate-500 text-xs font-bold">{i + 1}</span></TD>
              <TD><span className="text-slate-200 text-xs font-medium">{r.desc}</span></TD>
              <TD><span className={`text-xs font-semibold ${TIPO_COLORS[r.tipo]}`}>{r.tipo}</span></TD>
              <TD><CellSelect value={r.estado} onChange={(e) => updateRow(i, "estado", e.target.value)} options={ESTADO_OPTIONS} /></TD>
              <TD><CellInput value={r.serie} onChange={(e) => updateRow(i, "serie", e.target.value)} placeholder="No. serie" /></TD>
              <TD><CellInput value={r.obs} onChange={(e) => updateRow(i, "obs", e.target.value)} placeholder="Observaciones" /></TD>
              <TD><CellInput type="date" value={r.proxima} onChange={(e) => updateRow(i, "proxima", e.target.value)} /></TD>
              <TD className="text-center"><input type="checkbox" checked={r.verificado} onChange={(e) => updateRow(i, "verificado", e.target.checked)} className="w-4 h-4 accent-blue-500" /></TD>
            </tr>
          ))}
        </tbody>
      </TableWrapper>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: COMPRESOR ──────────────────────────────────────────────────────
const BitacoraCompresor = ({ onSubmit }) => {
  const today = new Date().toISOString().split("T")[0];
  const emptyRow = (i) => {
    const h = 6 + Math.floor(i / 2);
    const m = i % 2 === 0 ? "00" : "30";
    return { id: i, hora: `${String(h).padStart(2, "0")}:${m}`, fecha: today, presion: "", temperatura: "", purga: "", estado: "", responsable: "", firmado: false };
  };
  const { rows, addRow, removeRow, updateRow } = useTableRows(12, emptyRow);
  const [equipo, setEquipo] = useState({ nombre: "", numero_stps: "", presion_max: "", temp_max: "", capacidad: "" });
  const [incidente, setIncidente] = useState({ tipo: "", descripcion: "" });
  const [obs, setObs] = useState("");
  const { sig, saveSig, clearSig } = useSig();

  const handleSubmit = () => {
    if (!equipo.nombre) return alert("Ingrese el nombre del equipo");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ equipo, rows, incidente, obs, firma: sig });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Field label="Nombre del Equipo" required><Input value={equipo.nombre} onChange={(e) => setEquipo({ ...equipo, nombre: e.target.value })} placeholder="Ej: Compresor de aire" required /></Field>
        <Field label="No. Control STPS"><Input value={equipo.numero_stps} onChange={(e) => setEquipo({ ...equipo, numero_stps: e.target.value })} placeholder="No. registro STPS" /></Field>
        <Field label="Presión Máx. Operación (kg/cm²)"><Input type="number" value={equipo.presion_max} onChange={(e) => setEquipo({ ...equipo, presion_max: e.target.value })} placeholder="Ej: 10.5" /></Field>
        <Field label="Temperatura Máx. (°C)"><Input type="number" value={equipo.temp_max} onChange={(e) => setEquipo({ ...equipo, temp_max: e.target.value })} placeholder="Ej: 120" /></Field>
        <Field label="Capacidad (litros)"><Input type="number" value={equipo.capacidad} onChange={(e) => setEquipo({ ...equipo, capacidad: e.target.value })} placeholder="Ej: 500" /></Field>
      </div>

      <TableWrapper>
        <thead>
          <tr>
            <TH>Hora</TH><TH>Fecha</TH><TH>Presión (kg/cm²)</TH><TH>Temp. (°C)</TH>
            <TH>Purga</TH><TH>Estado General</TH><TH>Responsable</TH><TH className="text-center">Firmado</TH>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="hover:bg-slate-800/30">
              <TD><span className="text-slate-400 text-xs font-mono">{r.hora}</span></TD>
              <TD><CellInput type="date" value={r.fecha} onChange={(e) => updateRow(i, "fecha", e.target.value)} /></TD>
              <TD><CellInput type="number" value={r.presion} onChange={(e) => updateRow(i, "presion", e.target.value)} placeholder="kg/cm²" /></TD>
              <TD><CellInput type="number" value={r.temperatura} onChange={(e) => updateRow(i, "temperatura", e.target.value)} placeholder="°C" /></TD>
              <TD>
                <CellSelect value={r.purga} onChange={(e) => updateRow(i, "purga", e.target.value)} options={[
                  { value: "realizada", label: "Realizada" },
                  { value: "no_realizada", label: "No Realizada" },
                  { value: "no_aplica", label: "No Aplica" },
                ]} />
              </TD>
              <TD>
                <CellSelect value={r.estado} onChange={(e) => updateRow(i, "estado", e.target.value)} options={[
                  { value: "normal", label: "Normal" },
                  { value: "atencion", label: "Requiere Atención" },
                  { value: "critico", label: "Crítico" },
                  { value: "parado", label: "Parado" },
                ]} />
              </TD>
              <TD><CellInput value={r.responsable} onChange={(e) => updateRow(i, "responsable", e.target.value)} placeholder="Responsable" /></TD>
              <TD className="text-center">
                <button type="button" onClick={() => updateRow(i, "firmado", !r.firmado)} className={`px-2 py-1 text-xs font-medium rounded transition-colors ${r.firmado ? "bg-emerald-600/20 text-emerald-400" : "bg-slate-700/60 text-slate-400"}`}>
                  {r.firmado ? "Firmado" : "Firmar"}
                </button>
              </TD>
            </tr>
          ))}
        </tbody>
      </TableWrapper>

      <div className="flex gap-3">
        <button type="button" onClick={addRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">+ Agregar registro</button>
        <button type="button" onClick={removeRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">− Eliminar último</button>
      </div>

      <div className="bg-slate-800/30 rounded-xl border border-amber-700/40 overflow-hidden">
        <div className="px-4 py-3 bg-amber-900/20 border-b border-amber-700/40">
          <h4 className="text-sm font-semibold text-amber-300">Registro de Incidentes / Observaciones</h4>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tipo de Incidente">
            <Select value={incidente.tipo} onChange={(e) => setIncidente({ ...incidente, tipo: e.target.value })} options={[
              { value: "sobrepresion", label: "Sobrepresión" },
              { value: "fuga", label: "Fuga" },
              { value: "temp_alta", label: "Temperatura Alta" },
              { value: "falla_valvula", label: "Falla en Válvula" },
              { value: "otro", label: "Otro" },
            ]} />
          </Field>
          <Field label="Descripción del Incidente">
            <Input value={incidente.descripcion} onChange={(e) => setIncidente({ ...incidente, descripcion: e.target.value })} placeholder="Descripción..." />
          </Field>
        </div>
      </div>

      <Field label="Observaciones Generales">
        <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observaciones finales del día..." rows={3} />
      </Field>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: MANTENIMIENTO COMPRESOR ────────────────────────────────────────
const ITEMS_MTO_COMPRESOR = [
  "¿El equipo esta rotulado o adecuadamente identificado?",
  "¿El equipo cuenta con placa de datos?",
  "¿La pintura del equipo se encuentra en buen estado?",
  "¿El equipo está libre de corrosión, roturas, abolladuras o golpes?",
  "¿Existe orden y limpieza alrededor del equipo?",
  "¿El acceso al equipo se encuentra libre de obstrucciones?",
  "¿La purga del equipo opera correctamente?",
  "¿El manómetro se encuentra en buen estado?",
  "¿El equipo se encuentra libre de fugas visibles?",
  "¿La válvula de seguridad o relevo operan correctamente?",
  "¿Las válvulas de bloqueo funcionan adecuadamente?",
  "¿Las conexiones al equipo se observan en buen estado?",
  "¿El equipo cuenta con la señalización adecuada?",
  "¿Existe alguna vibración o ruido inusual?",
];

const BitacoraMtoCompresor = ({ onSubmit }) => {
  const [equipo, setEquipo] = useState({ nombre: "", tag: "", numero_stps: "" });
  const [checks, setChecks] = useState(() => ITEMS_MTO_COMPRESOR.map(() => ({ cumple: "", obs: "", acciones: "" })));
  const [condicion, setCondicion] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [tecnico, setTecnico] = useState({ nombre: "", certificacion: "", supervisor: "" });
  const { sig, saveSig, clearSig } = useSig();

  const updateCheck = (i, field, val) =>
    setChecks((c) => c.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const si_count = checks.filter((c) => c.cumple === "si").length;
  const no_count = checks.filter((c) => c.cumple === "no").length;
  const pct = Math.round((si_count / ITEMS_MTO_COMPRESOR.length) * 100);

  const handleSubmit = () => {
    if (!equipo.nombre) return alert("Ingrese el nombre del equipo");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ equipo, checks, condicion, recomendaciones, tecnico, firma: sig });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Nombre del Equipo" required><Input value={equipo.nombre} onChange={(e) => setEquipo({ ...equipo, nombre: e.target.value })} placeholder="Ej: Compresor de aire" required /></Field>
        <Field label="TAG"><Input value={equipo.tag} onChange={(e) => setEquipo({ ...equipo, tag: e.target.value })} placeholder="Identificación del equipo" /></Field>
        <Field label="No. Registro STPS"><Input value={equipo.numero_stps} onChange={(e) => setEquipo({ ...equipo, numero_stps: e.target.value })} placeholder="No. registro" /></Field>
      </div>

      <TableWrapper>
        <thead>
          <tr>
            <TH className="w-8">#</TH>
            <TH>Descripción</TH>
            <TH className="text-center w-16 text-emerald-400">Sí</TH>
            <TH className="text-center w-16 text-rose-400">No</TH>
            <TH>Observaciones</TH>
            <TH>Acciones Correctivas</TH>
          </tr>
        </thead>
        <tbody>
          {ITEMS_MTO_COMPRESOR.map((item, i) => (
            <tr key={i} className="hover:bg-slate-800/30">
              <TD><span className="text-slate-500 text-xs font-bold">{i + 1}</span></TD>
              <TD><span className="text-slate-300 text-xs">{item}</span></TD>
              <TD className="text-center">
                <input type="radio" name={`cumple_${i}`} checked={checks[i].cumple === "si"} onChange={() => updateCheck(i, "cumple", "si")} className="w-4 h-4 accent-emerald-500" />
              </TD>
              <TD className="text-center">
                <input type="radio" name={`cumple_${i}`} checked={checks[i].cumple === "no"} onChange={() => updateCheck(i, "cumple", "no")} className="w-4 h-4 accent-rose-500" />
              </TD>
              <TD><CellInput value={checks[i].obs} onChange={(e) => updateCheck(i, "obs", e.target.value)} placeholder="Observaciones" /></TD>
              <TD><CellInput value={checks[i].acciones} onChange={(e) => updateCheck(i, "acciones", e.target.value)} placeholder="Acciones correctivas" /></TD>
            </tr>
          ))}
        </tbody>
      </TableWrapper>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/40 rounded-xl p-4 text-center border border-slate-700/60">
          <div className="text-3xl font-bold text-emerald-400">{si_count}</div>
          <div className="text-xs text-slate-400 mt-1">Items que cumplen</div>
        </div>
        <div className="bg-slate-800/40 rounded-xl p-4 text-center border border-slate-700/60">
          <div className="text-3xl font-bold text-rose-400">{no_count}</div>
          <div className="text-xs text-slate-400 mt-1">Items que no cumplen</div>
        </div>
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
          <div className="text-xs text-slate-400 mb-2">% Cumplimiento</div>
          <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-emerald-500" : pct >= 70 ? "bg-blue-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="text-right text-sm font-bold text-slate-200 mt-1">{pct}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Condición General del Equipo">
          <Select value={condicion} onChange={(e) => setCondicion(e.target.value)} options={[
            { value: "excelente", label: "Excelente – Sin observaciones" },
            { value: "bueno", label: "Bueno – Observaciones menores" },
            { value: "regular", label: "Regular – Mantenimiento programado" },
            { value: "malo", label: "Malo – Mantenimiento inmediato" },
            { value: "critico", label: "Crítico – No operar hasta reparar" },
          ]} />
        </Field>
        <Field label="Recomendaciones Generales">
          <Textarea value={recomendaciones} onChange={(e) => setRecomendaciones(e.target.value)} placeholder="Recomendaciones de mantenimiento..." rows={2} />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Técnico de Mantenimiento" required><Input value={tecnico.nombre} onChange={(e) => setTecnico({ ...tecnico, nombre: e.target.value })} placeholder="Nombre del técnico" required /></Field>
        <Field label="No. Certificación"><Input value={tecnico.certificacion} onChange={(e) => setTecnico({ ...tecnico, certificacion: e.target.value })} placeholder="No. de certificación" /></Field>
        <Field label="Supervisor de Mantenimiento"><Input value={tecnico.supervisor} onChange={(e) => setTecnico({ ...tecnico, supervisor: e.target.value })} placeholder="Nombre del supervisor" /></Field>
      </div>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA: PERSONAL AUTORIZADO ───────────────────────────────────────────
const ACTIVIDADES_RIESGO = [
  "Materiales Peligrosos", "Montacargas", "Instalación/Op./Mto. Maquinaria",
  "Trabajos en Altura", "Espacios Confinados", "Riesgo Eléctrico",
  "Corte y Soldadura", "Comisión Seg. e Higiene", "Recipientes a Presión",
];

const BitacoraPersonalAutorizado = ({ onSubmit }) => {
  const emptyRow = (i) => ({ id: i, nombre: "", actividades: Object.fromEntries(ACTIVIDADES_RIESGO.map((a) => [a, { calif: "", fecha: "" }])) });
  const { rows, addRow, removeRow, updateRow } = useTableRows(5, emptyRow);
  const [meta, setMeta] = useState({ fecha_elab: "", elaborado: "", revisado: "", aprobado: "" });
  const { sig, saveSig, clearSig } = useSig();

  const updateActividad = (i, actividad, field, val) =>
    setRows((r) => r.map((row, idx) => {
      if (idx !== i) return row;
      return { ...row, actividades: { ...row.actividades, [actividad]: { ...row.actividades[actividad], [field]: val } } };
    }));

  const handleSubmit = () => {
    if (!meta.elaborado) return alert("Ingrese quién elaboró el documento");
    if (!sig) return alert("Capture su firma antes de guardar");
    onSubmit({ rows, meta, firma: sig });
  };

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-slate-700/60">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="px-3 py-2.5 text-left bg-slate-800/80 border-b border-slate-700 text-slate-300 font-semibold sticky left-0 z-10 min-w-[40px]">#</th>
              <th className="px-3 py-2.5 text-left bg-slate-800/80 border-b border-slate-700 text-slate-300 font-semibold sticky left-10 z-10 min-w-[160px]">Nombre del Personal</th>
              {ACTIVIDADES_RIESGO.map((a) => (
                <th key={a} colSpan={2} className="px-3 py-2.5 text-center bg-slate-800/80 border-b border-l border-slate-700 text-slate-300 font-semibold uppercase tracking-wide whitespace-nowrap" style={{ minWidth: "160px" }}>
                  {a}
                </th>
              ))}
            </tr>
            <tr>
              <th className="px-3 py-2 bg-slate-800/60 border-b border-slate-700 sticky left-0 z-10" />
              <th className="px-3 py-2 bg-slate-800/60 border-b border-slate-700 sticky left-10 z-10" />
              {ACTIVIDADES_RIESGO.map((a) => (
                <>
                  <th key={`${a}-c`} className="px-2 py-1.5 bg-slate-800/60 border-b border-l border-slate-700 text-slate-400 font-normal text-[10px] text-center">CALIFIC.</th>
                  <th key={`${a}-f`} className="px-2 py-1.5 bg-slate-800/60 border-b border-slate-700 text-slate-400 font-normal text-[10px] text-center">FECHA ACRED.</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="hover:bg-slate-800/20">
                <td className="px-3 py-2 border-b border-slate-800 text-slate-500 font-bold sticky left-0 bg-slate-900/80">{i + 1}</td>
                <td className="px-3 py-2 border-b border-slate-800 sticky left-10 bg-slate-900/80">
                  <input
                    value={r.nombre}
                    onChange={(e) => updateRow(i, "nombre", e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full min-w-[140px] bg-slate-900/40 border border-slate-700/60 rounded px-2 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </td>
                {ACTIVIDADES_RIESGO.map((a) => (
                  <>
                    <td key={`${a}-c`} className="px-2 py-2 border-b border-l border-slate-800">
                      <input
                        value={r.actividades[a].calif}
                        onChange={(e) => updateActividad(i, a, "calif", e.target.value)}
                        placeholder="—"
                        className="w-full min-w-[60px] bg-slate-900/40 border border-slate-700/60 rounded px-2 py-1.5 text-xs text-slate-100 text-center placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td key={`${a}-f`} className="px-2 py-2 border-b border-slate-800">
                      <input
                        type="date"
                        value={r.actividades[a].fecha}
                        onChange={(e) => updateActividad(i, a, "fecha", e.target.value)}
                        className="w-full min-w-[110px] bg-slate-900/40 border border-slate-700/60 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </td>
                  </>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={addRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">+ Agregar fila</button>
        <button type="button" onClick={removeRow} className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors">− Eliminar última</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Fecha de Elaboración"><Input type="date" value={meta.fecha_elab} onChange={(e) => setMeta({ ...meta, fecha_elab: e.target.value })} /></Field>
        <Field label="Elaborado por" required><Input value={meta.elaborado} onChange={(e) => setMeta({ ...meta, elaborado: e.target.value })} placeholder="Nombre" required /></Field>
        <Field label="Revisado por"><Input value={meta.revisado} onChange={(e) => setMeta({ ...meta, revisado: e.target.value })} placeholder="Nombre del revisor" /></Field>
        <Field label="Aprobado por"><Input value={meta.aprobado} onChange={(e) => setMeta({ ...meta, aprobado: e.target.value })} placeholder="Nombre del aprobador" /></Field>
      </div>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
        <SignaturePad onSave={saveSig} onClear={clearSig} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
          Guardar Bitácora
        </button>
      </div>
    </div>
  );
};

// ─── BITÁCORA ROUTER ──────────────────────────────────────────────────────────
const FORM_COMPONENTS = {
  salida_emergencia: BitacoraSalidaEmergencia,
  aire: BitacoraAire,
  ocular: BitacoraOcular,
  lavaojos: BitacoraLavaojos,
  kit_derrames: BitacoraKitDerrames,
  detectores: BitacoraDetectores,
  lamparas: BitacoraLamparas,
  pallet: BitacoraPallet,
  estantes: BitacoraEstantes,
  montacargas: BitacoraMontacargas,
  escaleras: BitacoraEscaleras,
  equipos: BitacoraEquiposAltura,
  compresor: BitacoraCompresor,
  mto_compresor: BitacoraMtoCompresor,
  personal_autorizado: BitacoraPersonalAutorizado,
};

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────────────
const NotificationBanner = ({ pendientes, onDismiss }) => {
  if (!pendientes || pendientes.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full space-y-2 animate-in slide-in-from-top-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-amber-500/10 px-4 py-3 flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 text-sm font-semibold">{pendientes.length} Bitácoras Pendientes</span>
          </div>
          <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none">&times;</button>
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
          {pendientes.map((p, i) => (
            <div key={i} className="px-4 py-3">
              <div className="text-sm font-medium text-slate-200">{p.nombre || "—"}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {p.norma} · {p.frecuencia} · Última: {p.ultimaRealizacion || "Nunca"}
              </div>
              {p.diasDesdeUltima && (
                <div className="text-xs text-rose-400 mt-0.5">{p.diasDesdeUltima} días sin registrar</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    error: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    info: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-sm bg-slate-900/90 flex items-center gap-3 ${colors[type] || colors.info}`}>
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  );
};

// ─── BITÁCORA CARD ────────────────────────────────────────────────────────────
const BitacoraCard = ({ bitacora, onClick }) => {
  const fColor = FRECUENCIA_COLORS[bitacora.frecuencia] || FRECUENCIA_COLORS.Mensual;
  return (
    <div
      onClick={() => onClick(bitacora)}
      className="group relative bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20 flex flex-col min-h-[200px]"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-bold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2.5 py-1 rounded-full">
          NOM-{bitacora.numero}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${fColor.bg} ${fColor.text} ${fColor.border}`}>
          {bitacora.frecuencia}
        </span>
      </div>
      <h3 className="text-sm font-bold text-slate-100 mb-2 leading-tight group-hover:text-blue-300 transition-colors">{bitacora.nombre}</h3>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed flex-1">{bitacora.descripcion}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 truncate max-w-[140px]">{bitacora.norma}</span>
        <span className="text-xs text-blue-400 group-hover:text-blue-300 font-medium transition-colors flex items-center gap-1">
          Abrir <span className="group-hover:translate-x-0.5 transition-transform inline-block">›</span>
        </span>
      </div>
    </div>
  );
};

// ─── NORMA GROUP ─────────────────────────────────────────────────────────────
const NormaGroup = ({ norma, tituloNorma, bitacoras, onOpenBitacora }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-100">{norma}</h2>
        <p className="text-xs text-slate-400">{tituloNorma}</p>
      </div>
      <span className="ml-auto text-xs text-slate-500 bg-slate-800/60 border border-slate-700/40 px-2.5 py-1 rounded-full">
        {bitacoras.length} {bitacoras.length === 1 ? "bitácora" : "bitácoras"}
      </span>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {bitacoras.map((b) => (
        <BitacoraCard key={b.tipo} bitacora={b} onClick={onOpenBitacora} />
      ))}
    </div>
  </div>
);

// ─── HISTORIAL VIEW ───────────────────────────────────────────────────────────
const HistorialView = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${APPS_SCRIPT_URL}?action=getConcentrado`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setRegistros(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (registros.length === 0)
    return (
      <div className="text-center py-16 text-slate-500">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">No hay registros en el historial</p>
      </div>
    );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/60">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {["Norma", "Título de la Norma", "Nombre", "Descripción", "Frecuencia", "Fecha de Realizado"].map((h) => (
              <TH key={h}>{h}</TH>
            ))}
          </tr>
        </thead>
        <tbody>
          {registros.map((r, i) => {
            const frec = r["Frecuencia"] || "";
            const fColor = FRECUENCIA_COLORS[frec] || {};
            return (
              <tr key={i} className="hover:bg-slate-800/30">
                <TD><span className="text-blue-400 font-medium">{r["Número"] || ""}</span></TD>
                <TD><span className="text-slate-300">{r["Título de la norma"] || ""}</span></TD>
                <TD><span className="text-slate-200 font-medium">{r["Nombre"] || ""}</span></TD>
                <TD><span className="text-slate-400">{r["Descripción"] || ""}</span></TD>
                <TD>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${fColor.bg || ""} ${fColor.text || "text-slate-400"} ${fColor.border || ""}`}>
                    {frec}
                  </span>
                </TD>
                <TD><span className="text-slate-300">{r["Fecha de realizado"] || ""}</span></TD>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── CONFIGURACION VIEW ───────────────────────────────────────────────────────
const ConfiguracionView = ({ onNotify }) => {
  const [listado, setListado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    fetch(`${APPS_SCRIPT_URL}?action=getListado`)
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setListado(d.data.map((r, i) => ({ ...r, _idx: i }))); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateFrecuencia = async (item) => {
    setSaving(item._idx);
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateFrecuencia", norma: item["Número"], nombre: item["Nombre"], frecuencia: item["Frecuencia"] }),
      });
      const d = await res.json();
      if (d.success) onNotify("Frecuencia actualizada correctamente", "success");
      else onNotify("Error al actualizar: " + (d.error || "Error desconocido"), "error");
    } catch {
      onNotify("Error de conexión", "error");
    } finally {
      setSaving(null);
    }
  };

  const setFrecuencia = (idx, val) =>
    setListado((l) => l.map((item) => item._idx === idx ? { ...item, Frecuencia: val } : item));

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/60">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {["Norma", "Título de la Norma", "Nombre", "Descripción", "Frecuencia", "Acción"].map((h) => (
              <TH key={h}>{h}</TH>
            ))}
          </tr>
        </thead>
        <tbody>
          {listado.map((item) => (
            <tr key={item._idx} className="hover:bg-slate-800/30">
              <TD><span className="text-blue-400 font-medium">{item["Número"] || ""}</span></TD>
              <TD><span className="text-slate-300">{item["Título de la norma"] || ""}</span></TD>
              <TD><span className="text-slate-200 font-medium">{item["Nombre"] || ""}</span></TD>
              <TD><span className="text-slate-400">{item["Descripción"] || ""}</span></TD>
              <TD>
                <select
                  value={item["Frecuencia"] || ""}
                  onChange={(e) => setFrecuencia(item._idx, e.target.value)}
                  className="bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {["Diario", "Cada uso", "Semanal", "Mensual", "Trimestral", "Semestral", "Anual"].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </TD>
              <TD>
                <button
                  type="button"
                  disabled={saving === item._idx}
                  onClick={() => updateFrecuencia(item)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                >
                  {saving === item._idx ? "Guardando..." : "Guardar"}
                </button>
              </TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── FORM VIEW ────────────────────────────────────────────────────────────────
const FormView = ({ bitacora, onBack, onNotify }) => {
  const FormComponent = FORM_COMPONENTS[bitacora.tipo];

  const handleSubmit = async (data) => {
    onNotify("Generando PDF y guardando en Drive...", "info");
    try {
      const fecha = new Date();
      const fechaStr = `${String(fecha.getDate()).padStart(2, "0")}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${fecha.getFullYear()}`;
      const fileName = `${bitacora.norma} - ${bitacora.nombre} - ${fechaStr}`;

      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "savePDFToDrive",
          fileName,
          formData: JSON.stringify(data),
          bitacoraData: {
            numero: bitacora.numero,
            norma: bitacora.norma,
            tituloNorma: bitacora.tituloNorma,
            nombre: bitacora.nombre,
            descripcion: bitacora.descripcion,
            frecuencia: bitacora.frecuencia,
            fecha: fechaStr,
          },
        }),
      });
      const result = await res.json();
      if (result.success) {
        onNotify("Bitácora guardada exitosamente en Google Drive", "success");
        setTimeout(onBack, 2000);
      } else {
        onNotify("Error al guardar: " + (result.error || "Error desconocido"), "error");
      }
    } catch {
      onNotify("Error de conexión con Google Drive", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al Dashboard
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-600/10 to-violet-600/10 border border-blue-500/20 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">{bitacora.nombre}</h1>
        <p className="text-sm text-slate-400">{bitacora.norma} — {bitacora.descripcion}</p>
        <div className="flex gap-3 mt-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${(FRECUENCIA_COLORS[bitacora.frecuencia] || FRECUENCIA_COLORS.Mensual).bg} ${(FRECUENCIA_COLORS[bitacora.frecuencia] || FRECUENCIA_COLORS.Mensual).text} ${(FRECUENCIA_COLORS[bitacora.frecuencia] || FRECUENCIA_COLORS.Mensual).border}`}>
            {bitacora.frecuencia}
          </span>
          <span className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/40 px-2.5 py-1 rounded-full">{bitacora.tituloNorma}</span>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-6">
        {FormComponent ? (
          <FormComponent onSubmit={handleSubmit} />
        ) : (
          <div className="text-center py-16 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-sm font-medium">Formulario en desarrollo</p>
            <p className="text-xs mt-1">Esta bitácora estará disponible próximamente</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("dashboard");
  const [activeBitacora, setActiveBitacora] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [showPendientes, setShowPendientes] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterNorma, setFilterNorma] = useState("");
  const [filterFrecuencia, setFilterFrecuencia] = useState("");
  const [bitacoras, setBitacoras] = useState(BITACORAS_REGISTRY);

  const notify = useCallback((message, type = "info") => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    fetch(`${APPS_SCRIPT_URL}?action=getListado`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setBitacoras((prev) =>
            prev.map((b) => {
              const match = d.data.find((row) => {
                const n = (row["Nombre"] || "").toLowerCase();
                return n.includes(b.nombre.toLowerCase().slice(0, 8));
              });
              return match ? { ...b, frecuencia: match["Frecuencia"] || b.frecuencia } : b;
            })
          );
        }
      })
      .catch(() => {});

    const ts = Date.now();
    fetch(`${APPS_SCRIPT_URL}?action=verificarPendientes&_=${ts}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.pendientes && d.pendientes.length > 0) {
          setPendientes(d.pendientes);
          setShowPendientes(true);
        }
      })
      .catch(() => {});
  }, []);

  const openBitacora = (bitacora) => {
    setActiveBitacora(bitacora);
    setView("form");
  };

  const filteredBitacoras = bitacoras.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || b.nombre.toLowerCase().includes(q) || b.descripcion.toLowerCase().includes(q) || b.norma.toLowerCase().includes(q);
    const matchNorma = !filterNorma || b.norma === filterNorma;
    const matchFrecuencia = !filterFrecuencia || b.frecuencia === filterFrecuencia;
    return matchSearch && matchNorma && matchFrecuencia;
  });

  const groupedBitacoras = filteredBitacoras.reduce((acc, b) => {
    if (!acc[b.norma]) acc[b.norma] = { tituloNorma: b.tituloNorma, items: [] };
    acc[b.norma].items.push(b);
    return acc;
  }, {});

  const NORMAS = [...new Set(BITACORAS_REGISTRY.map((b) => b.norma))];
  const FRECUENCIAS = ["Diario", "Cada uso", "Semanal", "Mensual", "Trimestral", "Semestral", "Anual"];

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { id: "historial", label: "Historial", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: "configuracion", label: "Configuración", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  return (
    <div className="min-h-screen bg-[#080d14] text-slate-100 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-violet-600/6 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-800/6 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-slate-800/80 bg-[#080d14]/90 backdrop-blur-xl sticky top-0">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 leading-tight">Sistema EHS</div>
              <div className="text-[10px] text-slate-500 leading-tight">Wunderbar · IVEMSA</div>
            </div>
          </div>

          <nav className="flex items-center gap-1 flex-1">
            {NAV_ITEMS.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => { setView(n.id); setActiveBitacora(null); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === n.id ? "bg-blue-600/20 text-blue-300" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"}`}
              >
                {n.icon}
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 flex-shrink-0">
            {pendientes.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPendientes(true)}
                className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-lg hover:bg-amber-500/20 transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {pendientes.length} pendientes
              </button>
            )}
            <div className="text-xs text-slate-500 hidden md:block">Marco Cruger</div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-screen-2xl mx-auto px-6 py-8">
        {view === "form" && activeBitacora ? (
          <FormView bitacora={activeBitacora} onBack={() => { setView("dashboard"); setActiveBitacora(null); }} onNotify={notify} />
        ) : view === "historial" ? (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-100">Historial de Bitácoras</h1>
            <HistorialView />
          </div>
        ) : view === "configuracion" ? (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-100">Configuración de Frecuencias</h1>
            <ConfiguracionView onNotify={notify} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar bitácora..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors"
                />
              </div>
              <select
                value={filterNorma}
                onChange={(e) => setFilterNorma(e.target.value)}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500/60 transition-colors"
              >
                <option value="">Todas las normas</option>
                {NORMAS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <select
                value={filterFrecuencia}
                onChange={(e) => setFilterFrecuencia(e.target.value)}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500/60 transition-colors"
              >
                <option value="">Todas las frecuencias</option>
                {FRECUENCIAS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {Object.keys(groupedBitacoras).length === 0 ? (
              <div className="text-center py-24 text-slate-500">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="font-medium">No se encontraron bitácoras</p>
                <p className="text-sm mt-1">Intente con otros criterios de búsqueda</p>
              </div>
            ) : (
              Object.entries(groupedBitacoras).sort().map(([norma, { tituloNorma, items }]) => (
                <NormaGroup key={norma} norma={norma} tituloNorma={tituloNorma} bitacoras={items} onOpenBitacora={openBitacora} />
              ))
            )}
          </div>
        )}
      </main>

      {showPendientes && (
        <NotificationBanner pendientes={pendientes} onDismiss={() => setShowPendientes(false)} />
      )}

      {toast && (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}