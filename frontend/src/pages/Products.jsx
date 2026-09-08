import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "../i18n";

import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";

function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", category: "", price: "", image: "", description: "", rating: "" });

  // FETCH PRODUCTS (Supports dynamic REST API with internal JSON seed fallback)
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/products`)
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data);
        } else {
          // Internal JSON seed fallback
          return fetch("/data/seed_products.json").then(r => r.json()).then(data => setProducts(data));
        }
      })
      .catch(async () => {
        try {
          // Read from internal JSON seed file
          const seedRes = await fetch("/data/seed_products.json");
          const seedData = await seedRes.json();
          setProducts(seedData);
        } catch (e) {
          setError(t("products.error"));
        }
      })
      .finally(() => setLoading(false));
  }, [t]);

  // DELETE PRODUCT
  const deleteProduct = async (id) => {
    const password = prompt("Enter admin password to delete:");
    if (!password) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`, {
        headers: { "x-admin-password": password }
      });
      setProducts(products.filter((item) => item.id !== id));
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || "Unauthorized"));
    }
  };

  // ADD PRODUCT
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/products`, newProduct);
      setProducts([...products, res.data]);
      setNewProduct({ name: "", category: "", price: "", image: "", description: "", rating: "" });
      setShowAddForm(false);
    } catch (err) {
      alert("Failed to add product");
    }
  };

  // FILTERING
  const filteredProducts = products.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selected === "all" || item.category === selected;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* TITLE */}
      <h1 className="text-3xl font-black mb-6 text-green-700 dark:text-green-400">
        {t("products.title")}
      </h1>

      {/* SEARCH + FILTER */}
      <SearchBar search={search} setSearch={setSearch} />
      <CategoryFilter selected={selected} setSelected={setSelected} />

      {/* ADD NEW PRODUCT FORM */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-6 bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700"
      >
        {showAddForm ? "Hide Form" : "Add New Product"}
      </button>

      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg mb-6 border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Add New Product</h2>
          <form onSubmit={handleAddProduct} className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Product Name"
              required
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <select
              required
              value={newProduct.category}
              onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            >
              <option value="">Select Category</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Herbs">Herbs</option>
              <option value="Seeds">Seeds</option>
            </select>
            <input
              type="number"
              placeholder="Price"
              step="0.01"
              required
              value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={newProduct.image}
              onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <textarea
              placeholder="Description"
              rows="2"
              value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              className="md:col-span-2 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <input
              type="number"
              placeholder="Rating (0-5)"
              step="0.1"
              min="0"
              max="5"
              value={newProduct.rating}
              onChange={(e) => setNewProduct({...newProduct, rating: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">
                Add Product
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-400 text-white py-2 rounded font-bold">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="text-center mt-10 text-gray-500 dark:text-gray-300">
          <div className="animate-pulse">{t("products.loading")}</div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <p className="text-red-500 mt-6 text-center font-semibold">
          {error}
        </p>
      )}

      {/* EMPTY STATE */}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center mt-10 text-gray-500 dark:text-gray-400 font-semibold">
          {t("products.empty")}
        </div>
      )}

      {/* PRODUCT GRID */}
      <div className="grid md:grid-cols-3 gap-6 mt-6">

        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            deleteProduct={deleteProduct}
          />
        ))}

      </div>

    </div>
  );
}

export default Products;