import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import productService from '../services/product.service';
import categoryService from '../services/category.service';
import { ImageUpload } from '../components/product';
import { Category, ProductPopulated } from '../types';

const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  price: z.number({ invalid_type_error: 'Price is required' }).min(0.5, 'Min price is GHS 0.50').max(100000, 'Max price is GHS 100,000'),
  category: z.string().min(1, 'Category is required'),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor'], { required_error: 'Condition is required' }),
  deliveryOption: z.enum(['pickup', 'delivery', 'both']).default('pickup'),
  pickupLocation: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['active', 'draft']).default('active'),
});

type ProductFormData = z.infer<typeof productSchema>;

const CAMPUS_LOCATIONS = [
  'Main Gate', 'Esther Hall', 'Independence Hall', 'Unity Hall', 'Queens Hall',
  'Engineering Block', 'Science Block', 'Library', 'Student Center', 'Cafeteria',
  'Sports Complex', 'Admin Block', 'ICT Center', 'Tarkwa Market',
];

// Shared underline field classes
const fieldBase = 'w-full bg-transparent border-0 border-b border-earth-300 focus:border-earth-900 focus:ring-0 text-earth-900 text-sm py-2 px-0 outline-none transition-colors placeholder:text-earth-300';
const fieldError = 'border-red-400';

const CreateEditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{ url: string; publicId: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      deliveryOption: 'pickup',
      status: 'active',
    },
  });

  const deliveryOption = watch('deliveryOption');

  useEffect(() => {
    categoryService.getCategories().then((res) => {
      if (res.success) setCategories(res.data.categories);
    });
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;

    const fetchProduct = async () => {
      try {
        const res = await productService.getProduct(id);
        if (res.success) {
          const p = res.data.product;
          reset({
            title: p.title,
            description: p.description,
            price: p.price,
            category: typeof p.category === 'string' ? p.category : p.category._id,
            condition: p.condition,
            deliveryOption: p.deliveryOption,
            pickupLocation: p.pickupLocation,
            tags: p.tags.join(', '),
            status: p.status === 'active' || p.status === 'draft' ? p.status : 'active',
          });
          setExistingImages(p.images);
        }
      } catch {
        toast.error('Failed to load product');
        navigate('/my-listings');
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [id, isEdit, navigate, reset]);

  const onSubmit = async (data: ProductFormData) => {
    const totalImages = existingImages.length + images.length;
    if (totalImages === 0 && !isEdit) {
      toast.error('Please add at least one image');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && removedImageIds.length > 0) {
        await productService.deleteImages(id!, removedImageIds);
      }

      const tags = data.tags
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      if (isEdit) {
        await productService.updateProduct(id!, {
          title: data.title,
          description: data.description,
          price: data.price,
          category: data.category,
          condition: data.condition,
          deliveryOption: data.deliveryOption,
          pickupLocation: data.pickupLocation,
          tags,
          status: data.status,
          images: images.length > 0 ? images : undefined,
        });
        toast.success('Product updated successfully!');
      } else {
        await productService.createProduct({
          title: data.title,
          description: data.description,
          price: data.price,
          category: data.category,
          condition: data.condition,
          deliveryOption: data.deliveryOption,
          pickupLocation: data.pickupLocation,
          tags,
          status: data.status,
          images: images.length > 0 ? images : undefined,
        });
        toast.success('Product listed successfully!');
      }

      navigate('/my-listings');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save product';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveExistingImage = (publicId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.publicId !== publicId));
    setRemovedImageIds((prev) => [...prev, publicId]);
  };

  if (loadingProduct) {
    return (
      <div className="page-container flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-b-2 border-earth-900" />
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em] text-earth-500 hover:text-earth-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      {/* Page header */}
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-2">
        {isEdit ? 'Edit listing' : 'New listing'}
      </p>
      <h1 className="text-3xl font-black text-earth-900 uppercase tracking-tight mb-1">
        {isEdit ? 'Edit Listing' : 'Create Listing'}
      </h1>
      <div className="h-px bg-earth-200 mb-8" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Images */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-3">Photos</p>
          <ImageUpload
            images={images}
            existingImages={existingImages}
            onChange={setImages}
            onRemoveExisting={handleRemoveExistingImage}
            maxImages={5}
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-1">
            Title
          </label>
          <input
            type="text"
            placeholder="e.g., Samsung Galaxy S24 Ultra — 256GB"
            className={`${fieldBase} ${errors.title ? fieldError : ''}`}
            {...register('title')}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-1">
            Description
          </label>
          <textarea
            placeholder="Describe your item — condition details, why you're selling, any defects, etc."
            rows={5}
            className={`${fieldBase} resize-none ${errors.description ? fieldError : ''}`}
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Price + Condition */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-1">
              Price (GHS)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.5"
              max="100000"
              placeholder="0.00"
              className={`${fieldBase} ${errors.price ? fieldError : ''}`}
              {...register('price', { valueAsNumber: true })}
            />
            {errors.price && (
              <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-1">
              Condition
            </label>
            <select
              className={`${fieldBase} ${errors.condition ? fieldError : ''}`}
              {...register('condition')}
            >
              <option value="">Select condition</option>
              <option value="new">Brand New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
            {errors.condition && (
              <p className="mt-1 text-xs text-red-500">{errors.condition.message}</p>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-1">
            Category
          </label>
          <select
            className={`${fieldBase} ${errors.category ? fieldError : ''}`}
            {...register('category')}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
          )}
        </div>

        {/* Delivery + Pickup */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-1">
              Delivery Option
            </label>
            <select className={fieldBase} {...register('deliveryOption')}>
              <option value="pickup">Campus Pickup</option>
              <option value="delivery">Delivery Available</option>
              <option value="both">Pickup or Delivery</option>
            </select>
          </div>

          {(deliveryOption === 'pickup' || deliveryOption === 'both') && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-1">
                Pickup Location
              </label>
              <select className={fieldBase} {...register('pickupLocation')}>
                <option value="">Select location</option>
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-1">
            Tags
          </label>
          <input
            type="text"
            placeholder="e.g., samsung, phone, electronics"
            className={fieldBase}
            {...register('tags')}
          />
          <p className="mt-1 text-xs text-earth-400 tracking-wide">
            Comma-separated — helps buyers find your item (max 10)
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-3">
            Listing Status
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                value="active"
                {...register('status')}
                className="w-4 h-4 border-2 border-earth-400 text-earth-900 focus:ring-earth-900 accent-earth-900"
              />
              <span className="text-sm text-earth-700 group-hover:text-earth-900 font-medium">
                Publish Now
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                value="draft"
                {...register('status')}
                className="w-4 h-4 border-2 border-earth-400 text-earth-900 focus:ring-earth-900 accent-earth-900"
              />
              <span className="text-sm text-earth-700 group-hover:text-earth-900 font-medium">
                Save as Draft
              </span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-6 border-t border-earth-100">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 border border-earth-300 text-xs font-bold uppercase tracking-[0.15em] text-earth-700 hover:border-earth-900 hover:text-earth-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-earth-900 text-white text-xs font-bold uppercase tracking-[0.15em] hover:bg-earth-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : isEdit ? 'Update Listing' : 'Post Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditProduct;
