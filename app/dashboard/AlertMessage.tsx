const alerts: Record<string, { cls: string; icon: string; text: string }> = {
  success: {
    cls: 'alert-success',
    icon: 'bi-check-circle-fill',
    text: 'Data boarding pass berhasil ditambahkan!',
  },
  updated: {
    cls: 'alert-info',
    icon: 'bi-info-circle-fill',
    text: 'Data boarding pass berhasil diperbarui!',
  },
  deleted: {
    cls: 'alert-danger',
    icon: 'bi-trash-fill',
    text: 'Data boarding pass telah berhasil dihapus!',
  },
};

export default function AlertMessage({ status }: { status?: string }) {
  const a = status ? alerts[status] : undefined;
  if (!a) return null;

  return (
    <div
      className={`alert ${a.cls} alert-dismissible fade show border-0 shadow-sm rounded-4 mb-4`}
      role="alert"
    >
      <i className={`bi ${a.icon} me-2`}></i> {a.text}
      <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
    </div>
  );
}
