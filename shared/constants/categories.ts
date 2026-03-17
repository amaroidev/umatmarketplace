export interface DefaultCategory {
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
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
    description: 'Everything else that doesn\'t fit other categories',
  },
];
