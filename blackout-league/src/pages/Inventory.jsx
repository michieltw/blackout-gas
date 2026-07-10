import React, { useState } from 'react';
import { Package, Plus, Pencil, Trash2, CheckCircle, AlertCircle, XCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const INITIAL = [
  { id: 1, name: 'Home Jersey Kit (Red)', category: 'Jerseys', quantity: 20, status: 'Available', assignedTo: '' },
  { id: 2, name: 'Away Jersey Kit (White)', category: 'Jerseys', quantity: 18, status: 'Available', assignedTo: '' },
  { id: 3, name: 'Practice Pucks', category: 'Equipment', quantity: 48, status: 'Available', assignedTo: '' },
  { id: 4, name: 'Goalie Blocker (L)', category: 'Equipment', quantity: 3, status: 'In Use', assignedTo: 'Ice Wolves' },
  { id: 5, name: 'Goalie Blocker (R)', category: 'Equipment', quantity: 3, status: 'In Use', assignedTo: 'Northern Hawks' },
  { id: 6, name: 'Ice Time Slot – Thialf Mon 19:00', category: 'Ice Time', quantity: 1, status: 'Booked', assignedTo: 'Division A' },
  { id: 7, name: 'Ice Time Slot – De Vliet Wed 20:00', category: 'Ice Time', quantity: 1, status: 'Available', assignedTo: '' },
  { id: 8, name: 'First Aid Kit', category: 'Medical', quantity: 4, status: 'Available', assignedTo: '' },
  { id: 9, name: 'Helmet Set (Senior)', category: 'Equipment', quantity: 10, status: 'Maintenance', assignedTo: '' },
  { id: 10, name: 'Training Cones', category: 'Equipment', quantity: 30, status: 'Available', assignedTo: '' },
];

const statusConfig = {
  Available: { color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle },
  'In Use': { color: 'text-primary', bg: 'bg-primary/10', icon: AlertCircle },
  Booked: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: AlertCircle },
  Maintenance: { color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
};

const CATEGORIES = ['All', 'Jerseys', 'Equipment', 'Ice Time', 'Medical'];

export default function Inventory() {
  const [items, setItems] = useState(INITIAL);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [dialog, setDialog] = useState(null); // null | 'new' | item
  const [form, setForm] = useState({ name: '', category: 'Equipment', quantity: 1, status: 'Available', assignedTo: '' });

  const filtered = items.filter(i => {
    const matchCat = category === 'All' || i.category === category;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.assignedTo.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openNew = () => {
    setForm({ name: '', category: 'Equipment', quantity: 1, status: 'Available', assignedTo: '' });
    setDialog('new');
  };

  const openEdit = (item) => {
    setForm({ ...item });
    setDialog(item);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (dialog === 'new') {
      setItems(prev => [...prev, { ...form, id: Date.now(), quantity: Number(form.quantity) }]);
    } else {
      setItems(prev => prev.map(i => i.id === dialog.id ? { ...form, id: dialog.id, quantity: Number(form.quantity) } : i));
    }
    setDialog(null);
  };

  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" /> Equipment Inventory
          </h1>
          <p className="text-muted-foreground mt-1">Track league-owned equipment, jerseys, and ice time rentals</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Item</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 bg-card" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${category === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left p-3 text-muted-foreground font-medium">Item</th>
              <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Category</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Qty</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
              <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Assigned To</th>
              <th className="p-3 w-16" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const sc = statusConfig[item.status] || statusConfig['Available'];
              return (
                <tr key={item.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{item.category}</td>
                  <td className="p-3 font-mono">{item.quantity}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                      <sc.icon className="w-3 h-3" /> {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{item.assignedTo || '—'}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(item.id)} className="p-1.5 text-muted-foreground hover:text-red-400 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No items found</div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === 'new' ? 'Add New Item' : 'Edit Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Item name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-background" />
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>{['Jerseys', 'Equipment', 'Ice Time', 'Medical'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="bg-background" />
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.keys(statusConfig).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Assigned to (team/division)" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} className="bg-background" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
