'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    pending: 0,
    accepted: 0,
    refused: 0,
  });
  const [formData, setFormData] = useState({
    prospect_name: '',
    amount: '',
    sent_date: '',
    status: 'pending',
    contact_email: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => subscription?.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) fetchQuotes();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) alert(error.message);
      else alert('Vérifiez votre email pour confirmer');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) alert(error.message);
    }

    setLoading(false);
    setEmail('');
    setPassword('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setQuotes([]);
  };

  const fetchQuotes = async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error:', error);
    else {
      setQuotes(data || []);
      calculateAnalytics(data || []);
    }
  };

  const calculateAnalytics = (quotesList: any[]) => {
    let pending = 0;
    let accepted = 0;
    let refused = 0;

    quotesList.forEach((quote) => {
      const amount = parseFloat(quote.amount) || 0;
      if (quote.status === 'pending') pending += amount;
      else if (quote.status === 'accepted') accepted += amount;
      else if (quote.status === 'refused') refused += amount;
    });

    setAnalytics({ pending, accepted, refused });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('quotes').insert([{ 
      ...formData, 
      user_id: user.id 
    }]);

    if (error) {
      console.error('Error:', error);
    } else {
      setFormData({
        prospect_name: '',
        amount: '',
        sent_date: '',
        status: 'pending',
        contact_email: '',
      });
      fetchQuotes();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const deleteQuote = async (id: number) => {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) console.error('Error:', error);
    else fetchQuotes();
  };

  const updateStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from('quotes')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) console.error('Error:', error);
    else fetchQuotes();
  };

  // Landing Page
  if (!user && !showAuth) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20 sm:py-32">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl sm:text-6xl font-bold mb-6">
                Relancez vos devis automatiquement
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                Arrêtez de perdre des ventes à cause des oublis. Relancez vos prospects automatiquement à J+3 et J+7. Convertissez plus, sans effort.
              </p>
              <button
                onClick={() => setShowAuth(true)}
                className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg font-bold text-lg transition shadow-lg"
              >
                C'est parti →
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gray-800 bg-opacity-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20">
            <h2 className="text-3xl font-bold text-center mb-12">Pourquoi choisir Relance Devis ?</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold mb-3">Automatisé</h3>
                <p className="text-gray-400">Vos devis sont relancés automatiquement. Plus d'oubli, plus de perte de temps.</p>
              </div>

              <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold mb-3">Suivi en temps réel</h3>
                <p className="text-gray-400">Voyez exactement combien vous gagnez grâce aux relances automatiques.</p>
              </div>

              <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold mb-3">Simple à utiliser</h3>
                <p className="text-gray-400">5 minutes pour créer votre premier devis. Pas besoin d'être techno.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à augmenter vos ventes ?</h2>
          <p className="text-gray-400 mb-8 text-lg">Testez gratuitement. Aucune carte bancaire requise.</p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg font-bold text-lg transition shadow-lg"
          >
            Créer un compte gratuit
          </button>
        </div>
      </div>
    );
  }

  // Auth Modal
  if (!user && showAuth) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
          <button
            onClick={() => setShowAuth(false)}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold mb-6 text-center">Relance Devis</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-700 p-3 rounded text-white"
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-700 p-3 rounded text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 p-3 rounded font-bold"
            >
              {isSignUp ? 'Créer un compte' : 'Se connecter'}
            </button>
          </form>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full mt-4 text-gray-400 hover:text-white"
          >
            {isSignUp ? 'Déjà inscrit ?' : 'Créer un compte'}
          </button>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Relance Devis</h1>
          <div className="text-sm text-gray-400 flex flex-col sm:flex-row gap-4">
            <span>{user.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Dashboard Analytics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">En attente</p>
            <p className="text-3xl font-bold text-yellow-400">{analytics.pending.toFixed(2)}€</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Acceptés</p>
            <p className="text-3xl font-bold text-green-400">{analytics.accepted.toFixed(2)}€</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Refusés</p>
            <p className="text-3xl font-bold text-red-400">{analytics.refused.toFixed(2)}€</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">Ajouter un devis</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                required
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

        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-6">Devis</h2>
          <div className="space-y-3">
            {quotes.length === 0 ? (
              <p className="text-gray-400">Aucun devis</p>
            ) : (
              quotes.map((quote) => (
                <div key={quote.id} className="bg-gray-800 p-4 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-bold">{quote.prospect_name}</p>
                    <p className="text-gray-400 text-sm">{quote.amount}€ - {quote.sent_date}</p>
                    <p className="text-gray-400 text-sm">Email: {quote.contact_email}</p>
                  </div>
                  <select
                    value={quote.status}
                    onChange={(e) => updateStatus(quote.id, e.target.value)}
                    className={`px-3 py-1 rounded text-sm font-bold ${
                      quote.status === 'pending' ? 'bg-yellow-600' :
                      quote.status === 'accepted' ? 'bg-green-600' :
                      'bg-red-600'
                    }`}
                  >
                    <option value="pending">En attente</option>
                    <option value="accepted">Accepté</option>
                    <option value="refused">Refusé</option>
                  </select>
                  <button
                    onClick={() => deleteQuote(quote.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}