import React, { useState, useMemo } from 'react';

function isPlainObject(v: any) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function renderPrimitive(v: any) {
  if (v === null || v === undefined) return 'N/A';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function TableFromObjects({ items }: { items: Record<string, any>[] }) {
  const columns = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => Object.keys(it || {}).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [items]);

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full table-fixed border divide-y divide-gray-200 text-[13px]">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-2 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {items.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50 align-top">
              {columns.map((col) => (
                <td key={col} className="px-2 py-2 align-top text-gray-700 max-w-[220px] truncate whitespace-normal">
                  {(() => {
                    const val = r[col];
                    if (typeof val === 'string' && /^https?:\/\//i.test(val)) {
                      const isImg = /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(val);
                      if (isImg) {
                        return (
                          <a href={val} target="_blank" rel="noreferrer" className="inline-block">
                            <img src={val} alt={String(col)} loading="lazy" className="max-w-[120px] max-h-[120px] object-contain rounded border" />
                          </a>
                        );
                      }
                      // non-image URL -> show short link
                      return (
                        <a href={val} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs break-words">{val}</a>
                      );
                    }

                    if (isPlainObject(val) || Array.isArray(val)) {
                      return <pre className="whitespace-pre-wrap text-xs max-h-[28vh] overflow-auto break-words">{JSON.stringify(val, null, 2)}</pre>;
                    }

                    return renderPrimitive(val);
                  })()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GenericJsonRenderer({ data, level = 0 }: { data: any; level?: number }) {
  if (data === null || data === undefined) return <div className="text-sm text-gray-500">N/A</div>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <div className="text-sm text-gray-500">[ ]</div>;

    const allObjects = data.every((it) => isPlainObject(it));
    const allPrimitives = data.every((it) => !isPlainObject(it) && !Array.isArray(it));

    if (allObjects) {
      return <TableFromObjects items={data as Record<string, any>[]} />;
    }

    if (allPrimitives) {
      return (
        <ul className="list-disc list-inside text-sm">
          {data.map((it, i) => (
            <li key={i}>{renderPrimitive(it)}</li>
          ))}
        </ul>
      );
    }

    // mixed or nested arrays
    return (
      <div className="space-y-2">
        {data.map((it, i) => (
          <div key={i} className="p-2 border rounded bg-gray-50">
            <GenericJsonRenderer data={it} level={level + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (isPlainObject(data)) {
    const entries = Object.entries(data as Record<string, any>);
    if (entries.length === 0) return <div className="text-sm text-gray-500">{JSON.stringify(data)}</div>;

    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <KeyValue key={k} k={k} v={v} />
        ))}
      </div>
    );
  }

  // primitive
  return <div className="text-sm text-gray-700">{renderPrimitive(data)}</div>;
}

function KeyValue({ k, v }: { k: string; v: any }) {
  const [open, setOpen] = useState(false);
  const isNode = isPlainObject(v) || Array.isArray(v);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-500">{k}</div>
          <div className="text-sm text-gray-800">{!isNode ? renderPrimitive(v) : (Array.isArray(v) ? `Array[${v.length}]` : 'Object')}</div>
        </div>
        {isNode && (
          <button onClick={() => setOpen((s) => !s)} className="text-xs text-blue-600 hover:underline">{open ? 'Thu gọn' : 'Chi tiết'}</button>
        )}
      </div>
      {isNode && open && (
        <div className="mt-2 ml-3 p-3 border rounded bg-gray-50">
          <GenericJsonRenderer data={v} level={1} />
        </div>
      )}
    </div>
  );
}
