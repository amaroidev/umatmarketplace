import mongoose from 'mongoose';
import User from '../models/User';
import Product from '../models/Product';
import ApiError from '../utils/ApiError';

class SavedItemService {
  /**
   * Toggle save/unsave a product
   */
  async toggleSavedItem(
    userId: string,
    productId: string
  ): Promise<{ saved: boolean; savedItems: string[] }> {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const objectId = new mongoose.Types.ObjectId(productId);
    const index = user.savedItems.findIndex(
      (id) => id.toString() === productId
    );

    if (index > -1) {
      // Already saved — remove
      user.savedItems.splice(index, 1);
      await user.save();
      return { saved: false, savedItems: user.savedItems.map((id) => id.toString()) };
    } else {
      // Not saved — add
      user.savedItems.push(objectId);
      await user.save();
      return { saved: true, savedItems: user.savedItems.map((id) => id.toString()) };
    }
  }

  /**
   * Get user's saved items (paginated, populated)
   */
  async getSavedItems(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ products: any[]; pagination: any }> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const total = user.savedItems.length;
    const skip = (page - 1) * limit;

    // Get paginated slice of IDs (newest first — last added first)
    const paginatedIds = [...user.savedItems].reverse().slice(skip, skip + limit);

    const products = await Product.find({ _id: { $in: paginatedIds } })
      .populate('category', 'name slug')
      .populate('seller', 'name avatar isVerified location');

    // Maintain the reverse order
    const idOrder = paginatedIds.map((id) => id.toString());
    products.sort(
      (a, b) => idOrder.indexOf(a._id.toString()) - idOrder.indexOf(b._id.toString())
    );

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check if a product is saved by the user
   */
  async isSaved(userId: string, productId: string): Promise<boolean> {
    const user = await User.findById(userId).select('savedItems');
    if (!user) return false;
    return user.savedItems.some((id) => id.toString() === productId);
  }

  /**
   * Get saved item IDs for a user (for quick client-side checks)
   */
  async getSavedItemIds(userId: string): Promise<string[]> {
    const user = await User.findById(userId).select('savedItems');
    if (!user) return [];
    return user.savedItems.map((id) => id.toString());
  }
}

export default new SavedItemService();
