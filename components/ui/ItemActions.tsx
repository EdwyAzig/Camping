import { Check, Pencil, Trash2, X } from "lucide-react";

export function ItemActions({
  editing,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: {
  editing?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}) {
  if (editing) {
    return (
      <div className="flex gap-1 shrink-0">
        <button type="button" onClick={onSave} className="text-cream/30 hover:text-green-400 p-1" title="Salva">
          <Check className="w-4 h-4" />
        </button>
        <button type="button" onClick={onCancel} className="text-cream/30 hover:text-cream p-1" title="Annulla">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-1 shrink-0">
      <button type="button" onClick={onEdit} className="text-cream/30 hover:text-ember p-1" title="Modifica">
        <Pencil className="w-4 h-4" />
      </button>
      <button type="button" onClick={onDelete} className="text-cream/30 hover:text-red-300 p-1" title="Elimina">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
