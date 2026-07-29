'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    prospect_name: '',
    amount: '',
    sent_date: '',
    status: 'pending',
    contact_email: '',
    contact_phone: '',
  });

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching quotes:', error);
    else setQuotes(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('quotes').insert([formData]);

    if (error) {
      console.error('Error adding quote:', error);
    } else {
      setFormData({
        prospect_name: '',
        amount: '',
        sent_date: '',
        status: 'pending',
        contact_email: '',
        contact_phone: '',
      });
      fetchQuotes();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Relance Devis</h1>

        {/* Formulaire */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold mb-6">Ajouter un devis</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="prospect_name"
                placeholder="Nom du prospect"
                value={formData.prospect_name}
                onChange={handleChange}
                required
                className="bg-gray-700 p-3 rounded text-white"
              />
              <input
                type="number"
                name="amount"
                placeholder="Montant"
                value={formData.amount}
                onChange={handleChange}
                required
                className="bg-gray-700 p-3 rounded text-white"
              />
              <input
                type="date"
                name="sent_date"
                value={formData.sent_date}
                onChange={handleChange}
                required
                className="bg-gray-700 p-3 rounded text-white"
              />
              <input
                type="email"
                name="contact_email"
                placeholder="Email"
                value={formData.contact_email}
                onChange={handleChange}
                className="bg-gray-700 p-3 rounded text-white"
              />
              <input
                type="tel"
                name="contact_phone"
                placeholder="Téléphone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="bg-gray-700 p-3 rounded text-white"
              />
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="bg-gray-700 p-3 rounded text-white"
              >
                <option value="pending">En attente</option>
                <option value="accepted">Accepté</option>
                <option value="refused">Refusé</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-bold"
            >
              Ajouter
            </button>
          </form>
        </div>

        {/* Liste des devis */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Devis</h2>
          <div className="space-y-3">
            {quotes.length === 0 ? (
              <p className="text-gray-400">Aucun devis</p>
            ) : (
              quotes.map((quote) => (
                <div key={quote.id} className="bg-gray-800 p-4 rounded flex justify-between items-center">
                  <div>
                    <p className="font-bold">{quote.prospect_name}</p>
                    <p className="text-gray-400 text-sm">{quote.amount}€ - {quote.sent_date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-bold ${
                    quote.status === 'pending' ? 'bg-yellow-600' :
                    quote.status === 'accepted' ? 'bg-green-600' :
                    'bg-red-600'
                  }`}>
                    {quote.status === 'pending' ? 'En attente' :
                     quote.status === 'accepted' ? 'Accepté' : 'Refusé'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}