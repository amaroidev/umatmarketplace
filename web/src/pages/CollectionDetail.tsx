import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import productService from '../services/product.service';
import { ProductGrid } from '../components/product';

const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    productService
      .getCollectionBySlug(slug, 24)
      .then((res) => {
        if (res.success) {
          setCollection(res.data);
        } else {
          setError('Collection not found');
        }
      })
      .catch(() => setError('Collection not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-8 w-48 bg-earth-100 animate-pulse" />
        <div className="mt-3 h-5 w-72 bg-earth-100 animate-pulse" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-earth-400">Collection</p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-earth-900">Not found</h1>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-earth-500 hover:text-earth-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Back home
        </Link>
      </div>
    );
  }

  return (
    <main className="bg-white">
      <section className="border-b border-earth-200 bg-earth-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-earth-500 hover:text-earth-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <h1 className="mt-5 text-4xl font-black uppercase tracking-tight text-earth-900">{collection.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-earth-500">{collection.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-earth-400">
            <span>{collection.listingCount} active listings</span>
            <span className="h-1 w-1 rounded-full bg-earth-300" />
            <span>Avg GHS {Number(collection.avgPrice || 0).toLocaleString('en-GH')}</span>
            <span className="h-1 w-1 rounded-full bg-earth-300" />
            <Link to={`/products?category=${collection.categorySlug}`} className="inline-flex items-center gap-1 text-earth-600 hover:text-earth-900">
              Browse full category <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <ProductGrid products={collection.products || []} emptyMessage="No listings in this collection yet" />
      </section>
    </main>
  );
};

export default CollectionDetailPage;
