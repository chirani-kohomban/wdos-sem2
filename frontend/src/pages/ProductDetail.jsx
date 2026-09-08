import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "../i18n";

function ProductDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
        const found = Array.isArray(res.data) ? res.data.find((item) => Number(item.id) === Number(id)) : null;
        if (found) {
          setProduct(found);
        } else {
          const seedRes = await fetch("/data/seed_products.json");
          const seedData = await seedRes.json();
          setProduct(seedData.find((item) => Number(item.id) === Number(id)));
        }
      } catch (err) {
        try {
          const seedRes = await fetch("/data/seed_products.json");
          const seedData = await seedRes.json();
          setProduct(seedData.find((item) => Number(item.id) === Number(id)));
        } catch (e) {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow border border-gray-150 dark:border-gray-700 max-w-sm">
          <h1 className="text-red-500 text-2xl font-bold mb-2">
            Product not found ❌
          </h1>
          <Link to="/products" className="text-green-600 dark:text-green-400 hover:underline mt-4 inline-block font-semibold">
            &larr; Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabel = t(`products.${product.category}`) || product.category;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-6">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Product Image */}
        <div className="h-64 bg-gray-150 relative">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 bg-gray-200 dark:bg-gray-750">
              🌱 No Image Available
            </div>
          )}
        </div>

        <div className="p-8">
          <Link to="/products" className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 hover:underline">
            &larr; {t("navbar.products")}
          </Link>

          <h1 className="text-3xl font-black text-gray-800 dark:text-white mt-4 mb-4">
            {product.name}
          </h1>

          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              <strong>{t("products.category")}:</strong>{" "}
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2.5 py-0.5 rounded text-xs font-semibold ml-1.5">
                {categoryLabel}
              </span>
            </p>

            <p className="text-lg text-gray-700 dark:text-gray-200">
              <strong>{t("products.price")}:</strong>{" "}
              <span className="font-extrabold text-green-600 dark:text-green-400 ml-1.5">
                Rs {product.price}
              </span>
            </p>
            
            <div className="pt-2">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Rating</h3>
              <div className="flex items-center text-yellow-500">
                <span className="text-lg">★</span>
                <span className="ml-1 font-bold text-gray-700 dark:text-gray-200">{Number(product.rating || 0).toFixed(1)} / 5.0</span>
              </div>
            </div>

            <div className="pt-4 border-t dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {product.description || "No description available for this product."}
              </p>
            </div>
            
            <div className="pt-6">
              <button 
                onClick={() => {
                  if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("Added to Cart!", { body: `${product.name} has been added.` });
                  } else {
                    alert(`🛒 ${product.name} Added to Cart!`);
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                🛒 Add to Cart
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProductDetail;