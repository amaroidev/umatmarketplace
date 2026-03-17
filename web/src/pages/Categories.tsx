import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Smartphone,
  Utensils,
  Shirt,
  Briefcase,
  Home as HomeIcon,
  PenTool,
  Dumbbell,
  Package,
  ArrowRight,
  Search,
} from 'lucide-react';
import categoryService, { CategoryWithCount } from '../services/category.service';
import { LoadingSpinner } from '../components/ui';

const iconMap: Record<string, React.ReactNode> = {
  'book-open': <BookOpen className="h-6 w-6" />,
  smartphone: <Smartphone className="h-6 w-6" />,
  utensils: <Utensils className="h-6 w-6" />,
  shirt: <Shirt className="h-6 w-6" />,
  briefcase: <Briefcase className="h-6 w-6" />,
  home: <HomeIcon className="h-6 w-6" />,
  'pen-tool': <PenTool className="h-6 w-6" />,
  dumbbell: <Dumbbell className="h-6 w-6" />,
  package: <Package className="h-6 w-6" />,
};

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getCategoriesWithCounts();
        if (res.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSpinner text="Loading categories..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-10 pt-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-3">Browse</p>
        <h1 className="text-3xl md:text-4xl font-black text-earth-900 uppercase tracking-tight mb-3">
          All Categories
        </h1>
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-earth-200" />
          <span className="text-sm text-earth-500">
            {totalProducts} listing{totalProducts !== 1 ? 's' : ''} across {categories.length} categories
          </span>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-earth-200 border border-earth-200">
        {categories.map((cat) => (
          <Link
            key={cat._id}
            to={`/products?category=${cat.slug}`}
            className="group flex items-center gap-4 p-6 bg-white hover:bg-earth-50 transition-colors"
          >
            <div className="flex-shrink-0 text-earth-400 group-hover:text-earth-900 transition-colors">
              {iconMap[cat.icon] || <Package className="h-6 w-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-earth-900 uppercase tracking-wide text-sm mb-0.5">
                {cat.name}
              </h3>
              <p className="text-xs text-earth-500">
                {cat.productCount} listing{cat.productCount !== 1 ? 's' : ''}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-earth-300 group-hover:text-earth-700 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Browse All CTA */}
      <div className="mt-12 pt-8 border-t border-earth-200 flex items-center justify-between">
        <p className="text-sm text-earth-500 uppercase tracking-[0.15em]">
          Can't find what you're looking for?
        </p>
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-earth-900 text-white text-sm font-bold uppercase tracking-[0.12em] hover:bg-earth-700 transition-colors"
        >
          <Search className="h-4 w-4" />
          Browse All Products
        </button>
      </div>
    </div>
  );
};

export default Categories;
