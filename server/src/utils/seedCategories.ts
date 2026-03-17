import mongoose from 'mongoose';
import Category from '../models/Category';
import connectDB from '../config/db';
import env from '../config/env';

const DEFAULT_CATEGORIES = [
  {
    name: 'Textbooks',
    slug: 'textbooks',
    icon: 'book-open',
    description: 'Academic textbooks, past questions, and study materials',
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    icon: 'smartphone',
    description: 'Phones, laptops, chargers, headphones, and gadgets',
  },
  {
    name: 'Food & Drinks',
    slug: 'food-drinks',
    icon: 'utensils',
    description: 'Homemade meals, snacks, beverages, and groceries',
  },
  {
    name: 'Clothing & Fashion',
    slug: 'clothing-fashion',
    icon: 'shirt',
    description: 'Clothes, shoes, accessories, and fashion items',
  },
  {
    name: 'Services',
    slug: 'services',
    icon: 'briefcase',
    description: 'Tutoring, printing, laundry, repairs, and other services',
  },
  {
    name: 'Accommodation',
    slug: 'accommodation',
    icon: 'home',
    description: 'Hostel rooms, off-campus housing, and roommate search',
  },
  {
    name: 'Stationery',
    slug: 'stationery',
    icon: 'pen-tool',
    description: 'Pens, notebooks, calculators, and lab equipment',
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    icon: 'dumbbell',
    description: 'Sports equipment, gym gear, and fitness accessories',
  },
  {
    name: 'Others',
    slug: 'others',
    icon: 'package',
    description: "Everything else that doesn't fit other categories",
  },
];

const seedCategories = async () => {
  try {
    await connectDB();
    console.log('Seeding categories...');

    for (const category of DEFAULT_CATEGORIES) {
      await Category.findOneAndUpdate(
        { slug: category.slug },
        category,
        { upsert: true, new: true }
      );
    }

    console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories successfully`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedCategories();
