import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTrades } from '../hooks/useTrades';
import { TradeTable } from '../components/journal/TradeTable';
import { TradeForm } from '../components/journal/TradeForm';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import type { Trade } from '../types';
import client from '../api/client';
import { Plus } from 'lucide-react';

interface OutletCtx { accountId: string }

export function JournalPage() {
  const { accountId } = useOutletContext<OutletCtx>();
  const { trades, loading, refetch } = useTrades({ account_id: accountId });
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Trade | null>(null);

  const openAdd = () => { setEditing(null); setModal('add'); };
  const openEdit = (t: Trade) => { setEditing(t); setModal('edit'); };
  const close = () => setModal(null);

  const handleSubmit = async (data: { symbol: string; side: 'long' | 'short'; entry_price: number; exit_price: number; quantity: number; entry_time: string; exit_time: string; commission: number; notes: string; screenshot_url: string; tags: string }) => {
    const payload = {
      account_id: accountId,
      symbol: data.symbol.toUpperCase(),
      side: data.side,
      entry_price: data.entry_price,
      exit_price: data.exit_price,
      quantity: data.quantity,
      entry_time: new Date(data.entry_time).toISOString(),
      exit_time: new Date(data.exit_time).toISOString(),
      commission: data.commission,
      notes: data.notes,
      screenshot_url: data.screenshot_url,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
    if (editing) {
      await client.patch(`/trades/${editing.id}`, payload);
    } else {
      await client.post('/trades', payload);
    }
    close();
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trade?')) return;
    await client.delete(`/trades/${id}`);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{trades.length} trade{trades.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus size={14} /> Add Trade
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Spinner /></div>
        ) : trades.length === 0 ? (
          <EmptyState
            title="No trades yet"
            description="Add your first trade to start tracking your performance"
            action={<Button onClick={openAdd} size="sm"><Plus size={14} /> Add Trade</Button>}
          />
        ) : (
          <TradeTable trades={trades} onEdit={openEdit} onDelete={handleDelete} />
        )}
      </div>

      <Modal
        open={modal !== null}
        onClose={close}
        title={editing ? 'Edit Trade' : 'Add Trade'}
        size="lg"
      >
        <TradeForm
          defaultValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={close}
        />
      </Modal>
    </div>
  );
}
